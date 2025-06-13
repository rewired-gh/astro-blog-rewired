---
date: 2025-06-13
title: "利用 Redis 实现滑动窗口计数器速率限制"
tags: [
  'Cloud Native',
  'Web Dev',
  'Spring Cloud'
]
language: 'zh'
---

## 引言

最近由于一些个人的项目需求，稍微研究了一下速率限制算法。常见的速率限制算法包括：漏水桶、代币桶、固定窗口日志、滑动窗口日志、滑动窗口计数器等（此外，还有一些利用指数退避增加惩罚时间的算法，不在本文的讨论范围之内）。这几种算法中，代币桶的性能开销最小，且允许猝发请求。不过在实际场景中，有时需要利用滑动窗口策略以保证最大的公平性，而滑动窗口计数器则是一种性能开销较小的算法。本文将介绍：在 Spring Cloud Gateway 项目中，如何实现自定义的速率限制中间件，并利用 Redis 实现滑动窗口计数器算法。

## 滑动窗口计数器算法

### 基本原理

不妨定义「整体窗口大小」为 $W$，「时间分片大小」为 $T$，「窗口内容量限制」为 $N$。滑动窗口计数器的核心思想在于按 $T$ 分桶，例如：若 $W = 1\ \text{min}$，$T = 15\ \text{s}$，则总共分为 6 个桶，每个桶以 $W$ 为周期重置。相较于滑动窗口日志算法，这种分桶实现能减少内存开销。

滑动窗口计数器算法的基本思路如下：

1. 收到请求，当前时刻为 $t$。
2. 计算 $W$ 内所有桶的总计数，若大于 $N$ 则拒绝。
3. 根据 $t$ 和 $T$ 计算得到桶编号，将对应的桶增一。
4. 每个桶将会按 $W$ 在不同的时刻定期重置。

其中，上述第 2 条可能有一点反直觉：为什么不用考虑 $T$？不妨假设 $W = 10\ \text{s}$，$T = 2\ \text{s}$，分桶编号计算函数为 $f_T(t)= \left\lfloor\frac{t}{T}\right\rfloor$，那么：

1. 若 $t = 2\ \text{s}$（处于第 1 个周期），则分桶编号 $f_T(t) = 1$。
2. 若 $t = 12\ \text{s}$（处于第 2 个周期），则分桶编号 $f_T(t) = 6$，此时编号为 1 的桶应当过期销毁，然后被编号为 6 的桶代替，即可视作「重置」。

### Redis 实现

从 7.4 版本开始，Redis 支持为每个哈希项设置独立的 TTL（过期时间），利用这个特性能实现性能更佳的滑动窗口计数器算法。在本文使用的实现中，出于性能考虑，每个桶并不是严格生存在指定的时间片中，而是桶中第一个请求到达时设置 TTL 为 $W$。也就是说，如果某个桶对应着从 $t_1$ 到 $t_2 = t_1 + W$ 的理论时间片，且桶内第一个请求的时刻为 $t$（其中 $t_1 \le t < t_2$），则桶的实际生存时间为从 $t$ 到 $t + W$。具体的实现分为以下步骤：

1. 利用 `HVALS` 获得所有桶的计数。
2. 对所有桶的计数进行求和，得到 `total`。
3. 若 `total` 大于 `limit` 则返回拒绝。
4. 计算桶编号，利用 `HINCRBY`（对应项不存在时自动创建并假设为 0）增加桶的计数，利用 `PEXPIRE` 在新桶创建时设置 TTL。
5. 返回允许。

对应的 Lua 脚本如下：

```lua
-- KEYS[1] = "rate_limit:{clientId}"
-- ARGV[1] = windowSize (seconds)
-- ARGV[2] = subWindowSize (seconds)
-- ARGV[3] = limit (max requests per window)
-- ARGV[4] = current time (seconds)

local key = KEYS[1]
local window_secs = tonumber(ARGV[1])
local sub_secs = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local now_secs = tonumber(ARGV[4])

local vals = redis.call("HVALS", key)
local total = 0
for _, v in ipairs(vals) do
    total = total + tonumber(v)
end

if total < limit then
    local cur = math.floor(now_secs / sub_secs)
    redis.call("HINCRBY", key, tostring(cur), 1)
    redis.call("PEXPIRE", key, window_secs, "NX")
    return { 1, total }
else
    return { 0, total }
end
```

## 速率限制中间件

本文中使用 `spring-cloud-starter-gateway-server-webflux`、`spring-boot-starter-data-redis-reactive`、`lombok` 等依赖，Redis 版本为 8.0.2，Spring Cloud 版本为 2025.0.0，Java 版本为 24，采用 Maven 管理项目。

首先，将上文提到的 Lua 脚本放置于 `src/resources/rate_limiter.lua`，然后创建 `SlidingWindowCounterRateLimiter` 类。具体代码如下（省略了 `import` 语句）：

```java title="SlidingWindowCounterRateLimiter.java"
@Slf4j
public class SlidingWindowCounterRateLimiter
        extends AbstractRateLimiter<SlidingWindowCounterRateLimiter.Config>
        implements ApplicationContextAware {
    private final Config defaultConfig;
    private final AtomicBoolean initialized;
    private ReactiveRedisTemplate<String, String> redisTemplate;
    private RedisScript<List<Long>> rateLimiterScript;

    public SlidingWindowCounterRateLimiter(long windowSecs, long subwindowSecs, long limit) {
        super(Config.class, "swc-rate-limiter", null);
        defaultConfig = Config.builder().windowSecs(windowSecs).subwindowSecs(subwindowSecs).limit(limit).build();
        initialized = new AtomicBoolean(false);
    }

    public void setApplicationContext(ApplicationContext context) throws BeansException {
        if (initialized.compareAndSet(false, true)) {
            if (redisTemplate == null) {
                redisTemplate = context.getBean(ReactiveStringRedisTemplate.class);
            }
            rateLimiterScript = (RedisScript<List<Long>>) context.getBean("rateLimiterScript", RedisScript.class);
            if (context.getBeanNamesForType(ConfigurationService.class).length > 0) {
                setConfigurationService(context.getBean(ConfigurationService.class));
            }
        }
    }

    private Map<String, String> getHeaders(long remaining, long limit) {
        return Map.of(
                "X-RateLimit-Remaining", String.valueOf(Math.max(remaining, 0)),
                "X-RateLimit-Limit", String.valueOf(limit));
    }

    @Override
    public Mono<Response> isAllowed(String routeId, String id) {
        final List<String> keys = List.of("rateLimiter:" + routeId + ":" + id);
        final long now = Instant.now().toEpochMilli() / 1000L;
        final Config config = getConfig().getOrDefault(routeId, defaultConfig);
        try {
            return redisTemplate.execute(rateLimiterScript, keys, List.of(
                            String.valueOf(config.windowSecs),
                            String.valueOf(config.subwindowSecs),
                            String.valueOf(config.limit),
                            String.valueOf(now)
                    )).onErrorResume(throwable -> {
                        log.error("Error calling rate limiter lua", throwable);
                        return Mono.just(List.of(1L, 0L));
                    }).next()
                    .map(result -> {
                        final boolean allowed = result.get(0) == 1L;
                        final long remaining = config.limit - result.get(1);
                        return new Response(allowed, getHeaders(remaining, config.limit));
                    });
        } catch (Exception e) {
            log.error("Error determining if user allowed from redis", e);
            return Mono.just(new Response(true, getHeaders(-1L, config.limit)));
        }
    }

    @Validated
    @Getter
    @Setter
    @ToString
    @Builder
    public static class Config {
        private @Min(1) Long windowSecs;
        private @Min(1) Long subwindowSecs;
        private @Min(1) Long limit;
    }
}
```

这里有几个地方需要注意：

- 为了方便起见，此类没有完整地支持 Spring Boot 配置范式。
- 需要实现 `ApplicationContextAware` 接口，从而在 `setApplicationContext` 中手动控制 Bean 的发现和注入。
- 在 `isAllowed` 的异常处理中，若 Redis 相关操作失败则默认放行。
- 使用 Redis 脚本能保证操作原子性，以及性能更优。

Redis 脚本相关的配置如下：

```java title="RedisConfig.java"
@Configuration
public class RedisConfig {
    @Bean
    public RedisScript<List<Long>> rateLimiterScript(ResourceLoader loader) {
        return RedisScript.of(
                loader.getResource("classpath:redis/rate_limiter.lua"),
                (Class<List<Long>>) (Class<?>) List.class
        );
    }
}
```

最后，在合适的位置创建 `SlidingWindowCounterRateLimiter` 的 Bean，然后利用 Spring Cloud Gateway 的 `RouteLocatorBuilder` 添加速率限制中间件。具体代码如下：

```java title="GatewayApplication.java"
@SpringBootApplication
public class GatewayApplication {
    public static void main(String[] args) {
        SpringApplication.run(GatewayApplication.class, args);
    }

    @Bean
    public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()
                .route(r -> r
                        .path("/example/**")
                        .filters(f -> f
                                .requestRateLimiter(c -> c
                                        .setRateLimiter(slidingWindowCounterRateLimiter()))
                        ).uri("example")
                      ).build();
    }

    @Bean
    @Primary
    public SlidingWindowCounterRateLimiter slidingWindowCounterRateLimiter() {
        return new SlidingWindowCounterRateLimiter(15, 1, 15);
    }
}
```

大功告成，后续可以压测相应的 API，并根据真实流量特征来调整速率限制的参数。