---
title: Concurrency Models in Python
weight: 1
type: docs
---

A comparative architectural breakdown of Python's concurrency paradigms: AsyncIO, Threading, and Multiprocessing.

| Feature | AsyncIO | Threading | Multiprocessing |
| :--- | :--- | :--- | :--- |
| **Context Switch** | **Cooperative (Fast)**<br>The code itself decides when to pause (using `await`). | **Preemptive (Slow)**<br>The OS forces the code to pause and switch tasks. | **Preemptive (Slow)**<br>The OS forces the code to pause and switch tasks. |
| **Best For** | **High Concurrency I/O**<br>(Websockets, 10k+ connections, non-blocking APIs) | **I/O Heavy Tasks**<br>Delegating network/storage I/O to background threads so the main thread remains responsive. | **Heavy Calculation**<br>(Data processing, Machine Learning, encryption) |
| **Memory & Data** | **Shared (Efficient)**<br>Everything runs in one place. Easy access to variables. | **Shared (Careful)**<br>Threads share memory. You need **Locks** to prevent race conditions. | **Isolated (Expensive)**<br>Each process has its own memory. Data must be pickled and **copied** to share. |
| **Parallelism** | **None**<br>Single-threaded. One task runs at a time. | **Concurrent (During I/O)**<br>Only one thread executes bytecode at a time, but **GIL is released during I/O** (disk/network), allowing tasks to overlap. | **True Parallelism**<br>Multiple CPUs execute code simultaneously. |
