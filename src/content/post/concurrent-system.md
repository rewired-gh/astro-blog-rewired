---
date: 2025-06-18
title: "Highly Concurrent System Design Note"
tags: [
  'Web Dev',
  'Note',
]
language: 'en'
---

<!--
Prompt:
For the whole article:
Fix and improve the writing where any of the following conditions are satisfied:

1. Grammar error or typo
2. Expression is not customary for native speakers

Keep the meaning consistent.
Don't change other text.
-->

> This article is not meant to be a guide. It merely serves as a personal note and may not have a clear structure, a specific topic, or polished content. This note should never be considered finished.

## Essential principles

![Scaling, Caching, Asynchronous Patterns](../../assets/hc_principles.svg)

- Scaling: Increase computing power.
- Caching: Add layers to the storage hierarchy.
- Asynchronous patterns: Don't wait; just subscribe and publish.

## Scaling dimensions

### Terminology

- Scale up (vertical scaling): Increase the capacity of a single computer system by upgrading or adding resources, typically hardware resources.
- Scale out (horizontal scaling): Add more systems to distribute the workload.

### How to choose

- Choose vertical scaling if: 
  - The service is in the early stage and has a relatively small codebase, so it uses monolithic architecture to follow the KISS principle.
  - The service is highly stateful and requires strict ACID properties, such as a traditional relational database storing customer transactions for a bank. Some modern commercial ACID databases can be distributed.
  - An immediate performance issue needs to be resolved.
- Choose horizontal scaling if:
  - High availability is critical for the service. This doesn't necessarily mean that the service's architecture needs to be altered.
  - High traffic is anticipated and long-term cost-effectiveness at scale is a major concern.
  - The service is mostly stateless or purely functional.
  - Following cloud-native best practices is essential for the nature of the business.
- Choose direct scaling if: The service is stateless.
- Choose sharding if: The service is stateful.

### Elastic scaling

- Threshold-based policy: Define static upper and lower bounds on metrics of resources.
- Control theory approaches: Use PID controllers or similar feedback loops to adjust resource levels smoothly.
- Machine learning methods: Employ machine learning models to forecast demand and proactively provision resources before load increases, improving responsiveness but requiring historical data and model maintenance.
- StatuScale: <https://arxiv.org/pdf/2407.10173>.
- Reactive Scaling: Responds after metrics cross thresholds.
- Proactive Scaling: Uses predictions or scheduled events to adjust capacity in advance.
- Common policy engines: Kubernetes Horizontal Pod Autoscaler (HPA) and AWS Auto Scaling Groups (ASG).

<!-- Separator 1 -->

## Ubiquitous levels of abstraction

### MVC architecture

- Model: State and static data.
- View: Presented form of the state and static data.
- Controller: Manager for state transitions and their triggers.

### Three-tier architecture

- Presentation tier: User interface and communication layer, such as a REST API controller.
- Application tier: Where information is processed using business logic, also known as the logic tier.
- Data tier: Where information, particularly states, is stored and managed, such as a MongoDB instance.

### Benefits of abstraction

- Horizontal scaling decisions and architectural design are only required to be considered on a certain layer.
- Makes it easier to partition a system among teams and members.
- Improves the reusability of layers.

<!-- Separator 2 -->

## Performance profiling

### Metrics of performance

- Latency: The time to process a request and return a response, crucial for user satisfaction.
- Throughput: Requests handled per second, indicating capacity.
- Response time: Total time from request to response, including network delays, impacting user experience.
- Error rate: Percentage of failed requests, indicating reliability. Targets include <5% network errors and <1% application errors, tracked via logging tools like Sentry.
- CPU usage: Percentage of CPU capacity used, preventing overload. High usage leading to throttling.
- Memory usage: Amount of RAM consumed, ensuring no slowdowns. Measured in bytes, with metrics like virtual and resident memory.
- Uptime (availability): Percentage of operational time, critical for SLAs.
- Concurrency level: Number of simultaneous requests, directly measuring system load.
- Garbage collection metrics: For languages like Java, measures GC frequency and duration, impacting performance under load.
- Network traffic: Data flow in and out, identifying bottlenecks in distributed systems.
- Disk I/O: Rate of storage operations, preventing delays.

## High availability

### Metrics of availability

- Percentage of uptime: The total percentage of time a system operates healthily during a given time period.
- SLA (Service Level Agreement): Formalizes the expected availability and penalties for breaches.
- MTBF (Mean Time Between Failures) and MTTR (Mean Time To Repair): Quantify how often failures occur and how fast systems recover.

### Redundancy

- Common configuration: N is the number of enough components.
  - N: No backups.
  - N+1: Only one extra component to tolerate a single failure.
  - 2N: Full duplication of a system.
  - 2N+1: Two active systems and one spare.
  - AN/B: Additional capacity is based on the load of the system.
- Synchronous replication: Zero data loss but higher latency.
- Asynchronous replication: Lower latency with potential for small data-loss window.

### Failover strategies

- Active–Passive: Standby doesn't serve live traffic under normal condition.
  - Cold: Standby is powered off until a failure occurs 
  - Warm: Standby runs but doesn’t handle live traffic until needed.
  - Hot: Standby handles traffic and can be promoted instantly on failure.
- Active—Active: All nodes serve live traffic. Load balancers distribute work and detect failures.
- RTO (Recovery Time Objective): The time within which a business process must be restored after a disruption
- RPO (Recovery Point Objective): The maximum acceptable age of data that must be recovered from backup for normal operations to resume after a disruption.
- Failure detection: Periodic probes verify liveness and readiness.

### Load balancing

- Transport layer (L4): The load balancer routes traffic based on the IP address and TCP/UDP port.
- Application layer (L7): The load balancer routes traffic based on application-level data. For instance, traffic could be routed to different servers based on the URL or the content type.
- Round robin: Distributes requests sequentially to each server in a cyclic manner.
- Least connections: Sends requests to the server with the least number of active connections. It is useful when requests have varying loads.
- IP hashing: Uses a hash of the client’s IP address to determine which server will handle the request. This ensures that a user consistently connects to the same server.
- Weighted load balancing: Servers are assigned a weight based on their capacity.
- SSL termination: In secure applications, load balancers often handle SSL termination, where they decrypt the encrypted traffic.

### Partitioning

- Sharding (horizontal partitioning): A dataset is divided into shards, with each shard being stored on a separate server or node.
  - Challenges: Some queries may require data from multiple partitions, which can introduce latency or complexity.
- Vertical partitioning: Splitting a dataset or application functionality based on columns or service boundaries.
  - Challenges: Increased latency and dependency management.
- Logical partitioning:  A system is divided into logical units that may or may not be backed by distinct physical resources. For instance, Kubernetes follows this pattern.
  - Challenges: A failure in shared physical resources could still lead to a larger failure.
- Split-brain scenario: Two or more partitions believe they are the primary active nodes, leading to data inconsistency or conflicts. This is often handled using consensus algorithms like [Paxos](https://youtu.be/s8JqcZtvnsM) (the notorious consensus algorithm) or [Raft](https://raft.github.io/raft.pdf).

### Monitoring

- SLI (Service Level Indicators): Quantify aspects like request latency or error rate.
- Infrastructure health: Includes CPU, memory, disk I/O, network latency, Queue depths, and connection counts.
- Application performance: Includes request throughput, error rates, database replication lag, and cache hit ratios.
- Heartbeat mechanism: Services report health information in each interval.
- Monitoring architecture
  - Data collection layer: Agents, exporters, or sidecars gather metrics and logs from servers, containers, and network devices. Popular solutions include Prometheus exporters, StatsD agents, and Fluentd/Logstash for logs.
  - Storage and query layer: Time-series databases (Prometheus TSDB, InfluxDB) and log stores (Elasticsearch, Splunk) hold and index data for fast retrieval and correlation.
  - Visualization and alerting layer: Dashboards (Grafana, Kibana) and alert managers (Alertmanager, PagerDuty integrations) provide real-time views and notifications. Advanced setups support dynamic thresholds and anomaly detection.
  - Common combination: Prometheus, Loki, Grafana, and HAProxy exporter.
- Alerting channels: web page, email, IM bot, phone call, and silent log.
- Alert fatigue: Fine-tune thresholds and employ grouping or suppression to prevent noise and ensure critical alerts are not ignored.
- Cost consideration: Aggregate and downsample metric data over time. Use log sampling and retention policies to control storage costs while preserving fidelity for incident investigation.

### Graceful degradation

- Design principles
  - Identify core functionality and dependencies: Determine which services are essential to core business workflows and which can be degraded under failure conditions.
  - Business-driven degradation priorities: Engage stakeholders in deciding which features to preserve during partial outages.
  - Simplified failure pathways: Ensure that fallback and degradation code paths are significantly simpler than normal operation flows, making them easier to test and less prone to introducing new failures.
- Load shedding and rate limiting: Under high load, drop or throttle low-priority requests to free up resources for critical operations.
- Circuit breaker pattern: Monitor calls to downstream services and, upon detecting excessive failures or timeouts, open the circuit to prevent further calls.
- Bulkhead pattern: Partition system resources into isolated compartments so that failures or resource exhaustion in one area do not impact others.
- Feature toggles and fallback strategies: Use runtime feature flags to disable non-critical features during incidents. Implement fallback logic to maintain core operations if a dependency is unreachable.

### Validation

### CAP Theorem

- Definition: Distributed systems can only guarantee two of three properties: Consistency (all nodes see the same data), Availability (system always responds), and Partition Tolerance (works despite network failures).
- Prioritized property: Financial systems might prioritize consistency for accuracy. E-commerce platforms might prioritize availability to ensure users can always access services. 
- CA: Not practical for distributed systems, as it cannot handle network partitions.
- CP: Ensures data consistency but may not respond to all requests during partitions.
- AP: Remains available during partitions but may return inconsistent data.
- CockroachDB: Provide strong consistency while maintaining high availability through careful partition handling.

## Redis implementation

## Kafka implementation