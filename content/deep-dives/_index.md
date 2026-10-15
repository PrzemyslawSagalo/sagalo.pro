---
title: Engineering & Deep Dives
weight: 1
type: docs
cascade:
  type: docs
---

Engineering deep dives, runtime internals, language specifications, and systems architecture notes.

## Core Principles

- **Domain-First Mindset**: Software exists to solve expensive business problems. Always master the business and financial domain first — implementation details follow.
- **Ownership & Action**: Convert complaints into actionable, trackable tasks with clear owners and exit criteria.
- **Predictable Delivery**: Tasks committed to an iteration must be delivered through realistic planning, task decomposition, and early risk signaling.
- **Async-First Communication**: Communicate with full context asynchronously to protect deep work and focus time.

## Architecture & Modeling

- **C4 Model**: Use the [C4 model](https://c4model.com/) and [Structurizr](https://structurizr.com/) for multi-level architectural blueprints.
- **Diagrams as Code**: Standardize on [Mermaid](https://mermaid.js.org/) for architecture graphs and sequence flows.
- **YAGNI & TDD**: Build extensible designs, but implement only what is required now.

## Deployment Strategies

| Deployment Method | Mechanism | Primary Use Case |
| :--- | :--- | :--- |
| **Blue/Green** | Two identical production environments. Traffic cutover is instantaneous via load balancer / DNS. | Critical systems requiring zero-downtime and instant rollbacks. |
| **Canary** | Incremental traffic routing to new version using metric baselines. | High-scale consumer and SaaS services to validate changes under live traffic. |
| **Rolling** | Step-by-step phased replacement across pods or server clusters. | Stateless containerized services with capacity headroom. |
| **Recreate** | Full teardown of existing version followed by fresh deploy. | Development/testing environments or breaking database schema shifts. |
