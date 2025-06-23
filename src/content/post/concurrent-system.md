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

## Dimensions of scaling

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

### Elastic scaling

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

### Graceful degradation

### Disaster recovery

### Validation

### CAP Theorem