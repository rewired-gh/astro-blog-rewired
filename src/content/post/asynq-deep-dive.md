---
date: 2025-07-20
title: "深入探讨 Asynq"
tags: [
  'Distributed Systems',
  'Cloud Native',
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

#### Redis 例子

```plaintext frame="terminal"
127.0.0.1:6379> sadd asynq:queues welcome_email 
(integer) 1
127.0.0.1:6379> exists asynq:welcome_email:t:1
(integer) 0
127.0.0.1:6379> hset asynq:welcome_email:t:1 msg ChFhZG1pbkByZXdpcmVkLm1vZQ== state scheduled
(integer) 2
127.0.0.1:6379> zadd asynq:welcome_email:scheduled 1753075918 1
(integer) 1
```

### forward

- 作用：将到时的任务从已计划、重试状态转换到就绪状态。
- Redis 脚本过程：
    1. 从队列的集合中选择到时的任务（Redis `ZRANGEBYSCORE`）。
    2. 对于每个任务：
        1. 获取任务对应的组（Redis：`HGET`）。
        2. 对于分组任务：TODO。
        3. 对于普通任务：添加到指定队列的就绪列表（Redis `LPUSH`）；从原队列的集合中删除（Redis `ZREM`）；设置任务信息，包括状态、就绪开始时间（Redis `HSET`）。

#### Redis 例子

```plaintext frame="terminal"
127.0.0.1:6379> zrangebyscore asynq:welcome_email:scheduled -inf 1753075918 limit 0 100
1) "1"
127.0.0.1:6379> lpush asynq:welcome_email:pending 1
(integer) 1
127.0.0.1:6379> zrem asynq:welcome_email:scheduled 1
(integer) 1
127.0.0.1:6379> hset asynq:welcome_email:t:1 state pending pending_since 1753075918
(integer) 1
```

### ForwardIfReady

- 作用：对于每个队列，先轮询已计划集合进行 forward，再轮询重试集合进行 forward。

### Enqueue

- 作用：直接添加新任务到某一个队列的就绪列表中。
- 基于通用流程 1。
- Redis 脚本过程：
    1. 若任务信息存在，则不继续操作（Redis `EXISTS`）。
    2. 设置任务信息，包括消息、状态、就绪开始时间（Redis `HSET`）。
    3. 添加到指定队列的就绪列表（Redis `LPUSH`）。

### Dequeue

- 作用：按优先级从各个非暂停队列的就绪列表中取出第一个任务，然后执行这个任务并返回结果。
- Redis 脚本过程：
    1. 若队列暂停，则不继续操作（Redis `EXISTS`）。
    2. 将任务从就绪列表移到活跃列表（Redis `RPOPLPUSH`）。
    3. 设置任务信息，包括状态，并移除就绪相关信息（Redis `HSET`、`HDEL`）。
    4. 将任务记录在租约有序列表中，按过期时间作为权重（Redis `ZADD`）。
    5. 获取并返回任务消息（Redis `HGET`）。

#### Redis 例子

```plaintext frame="terminal"
127.0.0.1:6379> exists asynq:welcome_email:paused 
(integer) 0
127.0.0.1:6379> rpoplpush asynq:welcome_email:pending asynq:welcome_email:active
"1"
127.0.0.1:6379> hdel asynq:welcome_email:t:1 pending_since 
(integer) 1
127.0.0.1:6379> zadd asynq:welcome_email:lease 1753375918 1 
(integer) 1
127.0.0.1:6379> hget asynq:welcome_email:t:1 msg
"ChFhZG1pbkByZXdpcmVkLm1vZQ=="
```

### Done

- 作用：清除指定的成功执行的任务，并更新统计数据。
- Redis 脚本过程：
    1. 将任务从活跃列表中移除（Redis `LREM`），若不存在则不继续操作。
    2. 将任务从租约有序列表中移除（Redis `ZREM`），若不存在则不继续操作。
    3. 移除任务信息（Redis `DEL`），若不存在则不继续操作。
    4. 增加每日处理计数，若为当日第一个任务，则设置此项过期时间（Redis `INCR`、`EXPIREAT`）。
    5. 更新总共处理计数，注意考虑溢出情况（Redis `GET`、`SET`、`INCR`）。

#### Redis 例子

```plaintext frame="terminal"
127.0.0.1:6379> lrem asynq:welcome_email:active 0 1 
(integer) 1
127.0.0.1:6379> zrem asynq:welcome_email:lease 1
(integer) 1
127.0.0.1:6379> del asynq:welcome_email:t:1
(integer) 1
127.0.0.1:6379> incr asynq:welcome_email:processed:2025-07-21 
(integer) 1
127.0.0.1:6379> expireat asynq:welcome_email:processed:2025-07-21 1753400000
(integer) 1
127.0.0.1:6379> get asynq:welcome_email:processed 
(nil)
127.0.0.1:6379> incr asynq:welcome_email:processed
(integer) 1
```