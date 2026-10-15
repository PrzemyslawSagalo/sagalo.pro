---
title: Positional vs Keyword Arguments (Performance & Architecture)
weight: 2
type: docs
---

In Python (CPython), the way arguments and variables are defined and passed directly impacts memory allocation, CPU throughput, and system architecture.

## 1. Positional-Only Arguments

Arguments are mapped directly to the function's internal variable array based solely on their order (index).

```python
def process(data, config, /):  # '/' enforces positional-only arguments
    pass

process(raw_data, current_config)
```

### Low-Level Characteristics:
* **Performance (Tier 1):** The fastest possible way to invoke a function in Python. The interpreter completely skips name parsing and lookups.
* **Zero Dictionary Allocation:** Values are placed directly into a C-level array of pointers (`PyObject*` in CPython).
* **Use Cases:** Algorithms, data structures, High-Frequency Trading (HFT) systems, mathematical operations (e.g., tail recursion), and internal helper functions (private APIs).

---

## 2. Keyword-Only Arguments

Arguments are passed as explicit key-value pairs, meaning their order in the function call does not matter.

```python
def create_user(*, user_id: int, email: str):  # '*' enforces keyword-only arguments
    pass

create_user(email="dev@example.com", user_id=42)
```

### Low-Level Characteristics:
* **Memory Overhead:** For every single execution, CPython must instantiate a temporary dictionary (`dict`) under the hood, calculate hashes for the string keys (`'user_id'`, `'email'`), and map them to the function parameters.
* **Refactoring Safety:** Changing the order of parameters or adding new optional fields does not break backward compatibility or client contracts.
* **Use Cases:** Business logic, Domain-Driven Design (DDD) services, component constructors, public APIs, and system configurations. *Explicit is better than implicit.*

---

## 3. Naming Conventions & Access Specifiers

| Access Specifier | Python Convention | Description |
| :--- | :--- | :--- |
| **Public** | `foo` (standard identifier) | Members are accessible from outside the class. |
| **Private** | Double underscore `__foo` | Name mangling alters the attribute name to `_ClassName__foo`, preventing accidental overrides in subclasses. |
| **Protected** | Single underscore `_foo` | By convention, indicates internal use. Still accessible directly, following Python's philosophy of consenting adults. |

### Name Mangling
When a child class and its parent class both define attributes named with double leading underscores (`__private_var`), Python treats them as distinct attributes:
- `_Parent__private_var` for the parent
- `_Child__private_var` for the child

This prevents subclass overrides from unintentionally breaking parent state.

---

## 4. Debugging & REPL Inspection (Pandas Display Options)

When inspecting large DataFrames in interactive debuggers (Neovim DAP, pdb, or interactive shells), disable row, column, and width truncations:

```python
import pandas as pd

pd.set_option("display.max_rows", 999999)
pd.set_option("display.max_columns", 999999)
pd.set_option("display.max_colwidth", 999999)
```
