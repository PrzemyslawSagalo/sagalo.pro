---
title: Python Testing Principles & Pytest Standards
description: "Test-driven engineering with pytest: test doubles, fixtures, mocking patterns, and parameterization."
sidebar:
  order: 3
tags:
  - python
  - pytest
  - testing
  - tdd
  - mocking
---

## General Testing Principles

A test suite is only as maintainable as it is readable. You should set up a clear naming convention at the beginning of your project and stick to it to ensure your tests accurately reflect business requirements.

* **Behaviour Over Implementation**
    Test names must describe the expected business outcome, not the literal arguments passed to a function. A failing test should immediately tell you what functionality broke without requiring you to reverse-engineer the test code.

* **Adopt Given-When-Then (GWT) Naming**
    Structure test names to explicitly state the initial state, the trigger, and the outcome. This transforms your test suite into readable, declarative documentation.

* **Avoid Control-Flow Parameterisation**
    Parameterising boolean flags that fundamentally alter a method's execution path is an anti-pattern that violates the Single Responsibility Principle. Reserve parameterisation strictly for testing a *single behaviour* against different data boundaries.

---

## Test Naming Conventions - Pytest

When implementing tests in Python using `pytest`, adhere to these framework-specific rules to ensure test discovery works predictably.

* **Fixtures are Nouns, Not Verbs**
    Fixtures represent state, data, or resources injected into a test. Name them as the object they represent (`pre_existing_array_uri`, `db_connection`), never as the procedural steps taken to construct them (`create_pre_existing_array`, `setup_database`).

* **Protect the Discovery Namespace**
    Pytest relies on lexical matching for test discovery. Applying a test prefix (e.g., `test_`) to fixtures or helper utilities pollutes the namespace and causes runner warnings. Use `sample_pandas_df` instead of `test_pandas_df`.

* **Pytest Given-When-Then (GWT) Implementation**
    Test classes must use PascalCase and begin with `Test` (e.g., `TestIngestPandas`). Test methods must use snake_case, begin with `test_`, and adopt the GWT structure (e.g., `test_given_existing_array_when_replace_true_then_overwrites_array`).

* **Proper Use of `@pytest.mark.parametrize`**
    Use parameterisation only for data inputs (e.g., passing different shapes of DataFrames), never for control-flow flags like `replace=True`.
