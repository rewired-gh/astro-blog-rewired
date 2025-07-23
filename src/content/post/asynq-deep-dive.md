---
date: 2025-07-20
title: "探讨 Asynq 底层原理"
tags: [
  'Distributed Systems',
  'Cloud Native',
  'Redis',
]
language: 'zh'
draft: true
---

## 是什么

- 使用 Go 的异步任务调度体系，包括 worker、client。
- 用 Redis 管理所有状态，用 Protobuf 编码消息。
- worker 能横向 scale，适应高并发需求。

## 用 Redis 的好处

- 除了 Redis，其他部分都是无状态，无需操心分布式系统的一致性问题。
- Redis 指令执行单线程，保证状态转换的顺序性，无需操心 worker 争抢。
- Redis 可配置成高可用集群，能自动 sharding、failover 切换，无需操心分布式系统的共识问题。
- Redis 可配置持久化，通过 AOF、RDB。

## 总体架构

![Asynq 总体架构](../../assets/asynq_simple_arch.svg)

- Web 应用利用 Asynq 库的 client API 注册任务。
- Worker 基于 Asynq 库的 server 完成定制。

## 任务状态

![Asynq 任务状态转换图](../../assets/asynq_state.svg)

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

#### Redis 例子

```plaintext frame="terminal"
127.0.0.1:6379> sadd asynq:queues welcome_email
(integer) 1
127.0.0.1:6379> exists asynq:welcome_email:t:1
(integer) 0
127.0.0.1:6379> hset asynq:welcome_email:t:1 msg ChFhZG1pbkByZXdpcmVkLm1vZQ== state pending pending_since 1753259218
(integer) 3
127.0.0.1:6379> lpush asynq:welcome_email:pending 1
(integer) 1
```

### Dequeue

- 作用：按优先级从各个非暂停队列的就绪列表中取出第一个任务，然后执行这个任务。
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

### MarkAsComplete

- 作用：将成功执行的任务从活跃列表移到完成列表，并更新统计数据。
- Redis 脚本过程：
    1. 将任务从活跃列表中移除（Redis `LREM`），若不存在则不继续操作。
    2. 将任务从租约有序列表中移除（Redis `ZREM`），若不存在则不继续操作。
    3. 将任务添加到完成列表（Redis `ZADD`），若失败则不继续操作。
    4. 设置任务信息，包括消息、状态（Redis `HSET`）。
    5. 增加每日处理计数，若为当日第一个任务，则设置此项过期时间（Redis `INCR`、`EXPIREAT`）。
    6. 更新总共处理计数，注意考虑溢出情况（Redis `GET`、`SET`、`INCR`）。

#### Redis 例子

```plaintext frame="terminal"
127.0.0.1:6379> lrem asynq:welcome_email:active 0 1
(integer) 1
127.0.0.1:6379> zrem asynq:welcome_email:lease 1
(integer) 1
127.0.0.1:6379> zadd asynq:welcome_email:completed 1753459218 1
(integer) 1
127.0.0.1:6379> hset asynq:welcome_email:t:1 msg ChFhZG1pbkByZXdpcmVkLm1vZQ== state completed
(integer) 0
127.0.0.1:6379> incr asynq:welcome_email:processed:2025-07-23
(integer) 1
127.0.0.1:6379> expireat asynq:welcome_email:processed:2025-07-23 1753559218
(integer) 1
127.0.0.1:6379> get asynq:welcome_email:processed
(nil)
127.0.0.1:6379> incr asynq:welcome_email:processed
(integer) 1
```

### DeleteExpiredCompletedTasks

- 作用：删除完成列表中过期的任务。
- Redis 脚本过程：
    1. 找到所有过期的任务，有最大数量限制（Redis `ZRANGEBYSCORE`）。
    2. 对于每个任务：
       1. 删除任务信息（Redis `DEL`）。
       2. 在完成列表中移除任务（Redis `ZREM`）。

#### Redis 例子

```plaintext frame="terminal"
127.0.0.1:6379> zrangebyscore asynq:welcome_email:completed -inf 1763259218 limit 0 100
1) "1"
127.0.0.1:6379> del asynq:welcome_email:t:1
(integer) 1
127.0.0.1:6379> zrem asynq:welcome_email:completed 1
(integer) 1
```

### Retry

### Archive

### Requeue

### Ping

- 作用：通过 ping 测试 Redis 的健康状态。

## Worker 服务器角色线程

在本章中，worker 指的是 worker 服务器中所有处理任务的协程。

Worker 服务器中的角色线程具有以下结构：

- logger：处理日志，使用了内部实现，主要利用了互斥锁。
- broker：状态管理中介，使用了 RDB 实现。
- done：接受完成信号（即停止协程信号）的 channel。
- interval（或者之类的）：轮询周期。
- 额外信息。

角色线程分为以下类别，这些线程会周期地进行一些操作：

- aggregator：负责检查组，若满足条件则聚合成一个任务。
    - 额外信息：TODO
    - 使用信号量管理协程间同步。
    - TODO
- forwarder：负责将到时的任务从已计划状态转到就绪状态。
    - 额外信息：
        - queues：当前角色线程管理的所有队列名称。
    - 对应的 RDB 操作：ForwardIfReady。
- healthchecker：负责检查 Redis 的健康状态。
    - 额外信息：
        - healthcheckFunc：健康状态检查的函数，若为 nil 则不检查。
    - 对应的 RDB 操作：Ping。
- heartbeater：负责向 Redis 维持健康状态，并续租任务。
    - 额外信息：
        - clock：用于共识的时钟，在实现中采用墙上时钟，在测试过程中可以换成其他实现。
        - host、pid、serverID、concurrency、queues、strictPriority：自动初始化的服务器信息。
        - started：heartbeater 启动的时间。
        - workers：从任务 ID 到 worker 的映射。
        - state：服务器状态，利用了互斥锁。
        - starting：接收 worker 启动消息的 channel。
        - finished：接收 worker 完成消息的 channel。
    - 对于每个周期的心跳操作：
        1. 收集服务器信息的快照。
        2. 收集所有租约未过期的 worker 信息，并处理租约过期的 worker。
        3. 向 Redis 更新自己的服务器和 worker 信息（对应的 RDB 操作：WriteServerState）。
        4. 向 Redis 续租任务（对应的 RDB 操作：ExtendLease）。
- janitor：负责清理已完成且过期的任务。
    - 额外信息：
        - queues：当前角色线程管理的所有队列名称。
        - batchSize：单次清理的最大任务数。
    - 对应的 RDB 操作：DeleteExpiredCompletedTasks。
- processor：负责执行就绪的任务。
    - 额外信息：
        - handler：处理任务的函数。
        - baseCtxFn：创建基础上下文的函数。
        - queueConfig：队列优先级配置。
        - orderedQueues：严格优先级模式下的有序队列列表。
        - taskCheckInterval：轮询任务的时间间隔。
        - retryDelayFunc：计算重试延迟的函数。
        - isFailureFunc：判断错误是否为失败的函数。
        - errHandler：错误处理器。
        - shutdownTimeout：关闭超时时间。
        - sema：信号量，限制并发 worker 数量。
        - quit、abort：用于协程间通信的 channel。
        - cancelations：活跃任务的取消函数集合。
        - starting、finished：与 heartbeater 通信的 channel。
    - 工作流程：
        1. 从信号量获取令牌，限制并发数。
        2. 确定队列查询顺序：
            - 单队列：直接返回该队列名。
            - 严格优先级模式：按优先级降序排列队列。
            - 非严格优先级模式：按优先级权重复制队列名，然后随机打散（Fisher-Yates shuffle）以避免低优先级队列饥饿。
        3. 从就绪列表中按顺序取出任务（RDB 操作：Dequeue）。
        4. 处理出队结果：
            - 无可处理任务：使用 jitter 机制等待（taskCheckInterval/2 + 随机抖动），避免同时轮询造成 Redis 压力。
            - 其他错误：使用速率限制器记录日志（每 3 秒最多 1 条），避免日志洪水。
        5. 创建租约和任务截止时间：
            - timeout 和 deadline 都设置：取较小值。
            - 只有 timeout：当前时间 + timeout。
            - 只有 deadline：使用 deadline。
            - 都未设置：使用默认超时时间。
        6. 向 heartbeater 发送 worker 启动信息，启动 worker 协程处理任务。
        7. 在 worker 协程中：
            1. 创建带截止时间的上下文，注册取消函数到 cancelations 集合。
            2. 检查上下文是否已取消（如截止时间已过）。
            3. 启动任务执行协程，使用 defer-recover 机制捕获 panic。
            4. 监听多个 channel：服务器关闭、租约过期、上下文取消、任务完成。
        8. 根据执行结果进行相应处理：
            - 成功且无保留期：直接删除任务（RDB 操作：Done）。
            - 成功且有保留期：移到完成列表（RDB 操作：MarkAsComplete）。
            - 失败且为 RevokeTask 错误：直接删除任务。
            - 失败且重试次数未达上限且非 SkipRetry：计算重试延迟后移到重试列表（RDB 操作：Retry）。
            - 失败且达重试上限或 SkipRetry：移到归档列表（RDB 操作：Archive）。
            - 关闭时清理或租约过期：重新放回就绪列表（RDB 操作：Requeue）。
        9. 向 heartbeater 发送 worker 完成信息，释放信号量令牌。

![processor 工作流程](../../assets/asynq_processor.svg)

- recoverer：负责重试或归档执行失败的任务（即租约过期的任务）。
- subscriber：负责监听取消命令并取消任务。
- syncer：负责重试 Redis 操作，保证状态的一致性。

## 租约

租约的结构：

- once：确认 channel 只被关闭一次。
- ch：用于传递过期消息的 channel。
- Clock：用于共识的时钟，在实现中采用墙上时钟，在测试过程中可以换成其他实现。
- mu：保护过期时间的互斥锁，读和写时都需要获取锁。
- expireAt：租约的过期时间。

租约的操作：

- 创建租约。
- 验证租约：验证时使用互斥锁保护。
- 重置租约：更新未过期的租约的过期时间，使用互斥锁保护。
- 通知过期：若租约未过期则不通知，否则关闭 ch 从而通知租约过期，用 once 确保只会关闭一次。
- 完成：向承租方提供 ch，用于获悉租约过期。
- 期限：获得租约的过期时间，使用互斥锁保护。