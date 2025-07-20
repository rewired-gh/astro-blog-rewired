---
date: 2025-07-20
title: "深入探讨 Asynq"
tags: [
  'Distributed Systems',
  'Cloud Infrastructure',
  'Redis',
]
language: 'zh'
draft: true
---

## 是什么

- 异步任务调度体系，包括 worker、client。
- 用 Redis 管理所有状态，用 Protobuf 编码消息。
- worker 能横向 scale，适应高并发需求。

## 用 Redis 的好处

- 除了 Redis，其他部分都是无状态，无需操心分布式系统的一致性问题。
- Redis 指令执行单线程，保证状态转换的顺序性，无需操心 workers 争抢。
- Redis 可配置成高可用集群，能自动 sharding、failover 切换，无需操心分布式系统的共识问题。
- Redis 可配置持久化，通过 AOF、RDB。

## 总体架构

![Asynq 总体架构](../../assets/asynq-simple-arch.svg)

- Web 应用利用 Asynq 库的 client API 注册任务。
- Worker 基于 Asynq 库的 server 完成定制。

## 任务状态

![Asynq 任务状态转换图](../../assets/asynq-state.svg)

- 已计划：还没到时间，会在之后处理任务。
- 就绪：任务可开始处理，等待被空闲的 worker 拾取。
- 活跃：任务正在被处理。
- 重试：任务处理失败，会在之后重新处理。
- 归档：任务多次处理失败，归档用于后续排障。
- 完成：任务处理成功，等待 TTL 结束后过期删除。

<!-- TODO: aggregating -->

## RDB

### 通用流程 1

1. 编码消息。
2. 在本地内存中查询当前队列是否存在；若不存在，则添加到 Redis 中用于记录所有队列的全局集合中（Redis `SADD`），并在本地内存中记录。
3. 执行 Redis 脚本。

### Schedule

- 作用：添加任务到某一队列的已计划集合中。
- 基于通用流程 1。
- Redis 脚本过程：
    1. 若任务信息存在，则不继续操作（Redis `EXISTS`）。
    2. 设置任务信息，包括消息、状态、就绪开始时间（Redis `HSET`）。
    3. 添加到指定队列的计划处理集合（Redis `ZADD`）。

### forward

- 作用：将到时的任务从已计划、重试状态转换到就绪状态。
- Redis 脚本过程：
    1. 从队列的集合中选择到时的任务（Redis `ZRANGEBYSCORE`）。
    2. 对于每个任务：
        1. 获取任务对应的组（Redis：`HGET`）。
        2. 对于分组任务：TODO。
        3. 对于普通任务：添加到指定队列的就绪列表（Redis `LPUSH`）；从原队列的集合中删除（Redis `ZREM`）；设置任务信息，包括状态、就绪开始时间（Redis `HSET`）。

### Enqueue

- 作用：直接添加新任务到某一个队列的就绪列表中。
- 基于通用流程 1。
- Redis 脚本过程：
    1. 若任务信息存在，则不继续操作（Redis `EXISTS`）。
    2. 设置任务信息，包括消息、状态、就绪开始时间（Redis `HSET`）。
    3. 添加到指定队列的就绪列表（Redis `LPUSH`）。
