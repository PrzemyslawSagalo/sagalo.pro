---
title: Environments & Package Tooling
description: "Python virtual environments, dependency isolation, and modern package management using uv, poetry, and pip."
sidebar:
  order: 4
tags:
  - python
  - packaging
  - virtualenv
  - uv
  - poetry
---

Practical reference for deterministic Python environment isolation, dependency managers (`pyenv`, `poetry`, `pip`, `conda`), and runtime configuration.

## Python Version Management (`pyenv`)

Install and manage multiple isolated CPython versions without polluting system interpreters:

```bash
# Install a specific CPython version
pyenv install 3.12.8

# Pin the local project directory to this Python version (.python-version file)
pyenv local 3.12.8

# Verify the active interpreter
pyenv which python
```

Once pinned, bootstrap an isolated virtual environment:
```bash
python -m venv .venv
source .venv/bin/activate
```

---

## Dependency Management with Poetry

### Enforce In-Project Virtual Environments
By default, Poetry creates virtual environments in a global cache directory. Enforce local `.venv` creation inside the repository root for predictable IDE discovery:

```bash
poetry config virtualenvs.in-project true
```

### Environment Inspection
Query active environment metadata:

```bash
# Print the absolute path to the active virtualenv
poetry env info -p

# Display full environment diagnostic info (Python version, platform, path)
poetry env info
```

---

## Package Resolvers (`pip` & `conda`)

### Pip Configuration Inspection
Inspect the active hierarchical configuration of `pip` across global, user, and site levels:

```bash
pip config -v list
```

#### Windows Configuration Override
On Windows hosts (PowerShell), point `pip` to a custom configuration file via environment variable:

```powershell
$Env:PIP_CONFIG_FILE = "C:\path\to\your\pip.ini"
```

### Conda Channel Priorities
Query the exact resolution order of active Conda package channels:

```bash
conda config --get channels
```

---

## Reference Guides & Cheat Sheets

> [!TIP]
> **Offline Reference**: A comprehensive [Python AsyncIO Cheat Sheet (PDF)](/docs/python-asyncio.pdf) is available for offline download.
