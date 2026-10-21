---
title: Engineering & Deep Dives
weight: 1
type: docs
cascade:
  type: docs
---

Engineering deep dives, runtime internals, language specifications, and systems architecture notes.

## Project Kick-off Checklist

Core architectural and operational questions to resolve before starting a new project or initiative:

* [ ] **Cloud & Account:** Which provider (AWS, GCP, Azure)? Existing client account or new?
* [ ] **Authentication & Authorization:** What is the primary auth model for cloud services? (e.g., IAM Roles, Workload Identity, Service Accounts).

## Core Principles

- **Domain-First Mindset**: We are not paid to write code; we are paid to solve expensive business problems using code. Always master the business and financial domain first — implementation details follow.
- **Ownership & Action**: Issues and setbacks are normal in development. When you discover a problem, convert complaints into action by creating a task so it can be tracked, prioritized, and solved.
- **Sprint Commitment & Predictable Delivery**: Tasks committed to an iteration must be completed by its end. This requires realistic planning, proper task decomposition, and flagging risks early to ensure predictable delivery.
- **Async-First Communication**: We communicate asynchronously to protect deep work and focus time. Do not expect immediate replies; plan work accordingly and provide full context in initial messages.

## Engineering & Coding Practices

- **Changelog Hygiene**: Instantly update the changelog with new information when functional changes, fixes, or breaking updates occur.
- **YAGNI**: Write extensible code, but only add the functionalities needed now ([YAGNI](https://en.wikipedia.org/wiki/You_aren%27t_gonna_need_it)).
- **Exploratory Prototyping & TDD**: TDD works only when you fully understand the problem and interface. Building an exploratory prototype or spike is an effective way to explore before committing to test-driven implementation.
- **End-of-Day WIP Commits**: If your changes are not ready to be submitted at the end of your work day, make a dirty branch, commit all of your changes to it (typically `git commit -am 'WIP'`), and push it to a remote repository so work is never lost.
- **Naming Conventions**: Set up a clear naming convention at the beginning of your project and stick to it across modules, variables, and tests.

## Architecture & Modeling

- **C4 Model**: Use the [C4 model](https://c4model.com/) to model an architecture. You can draw blueprints in [Structurizr](https://structurizr.com/).
- **Diagrams as Code**: Use [Mermaid](https://mermaid.js.org/) for all graphs, architecture blueprints, and flowcharts.

## Deployment Strategies

| Deployment Method | Mechanism | Primary Use Case |
| :--- | :--- | :--- |
| **Blue/Green** | Two identical production environments. Traffic cutover is instantaneous via load balancer / DNS. | Critical systems requiring zero-downtime and instant rollbacks. |
| **Canary** | Incremental traffic routing to new version using metric baselines. | High-scale consumer and SaaS services to validate changes under live traffic. |
| **Rolling** | Step-by-step phased replacement across pods or server clusters. | Stateless containerized services with capacity headroom. |
| **Recreate** | Full teardown of existing version followed by fresh deploy. | Development/testing environments or breaking database schema shifts. |
