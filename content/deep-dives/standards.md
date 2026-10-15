---
title: Engineering & Architecture Standards
weight: 2
type: docs
---

Architectural patterns, code quality rules, and infrastructure conventions enforced across systems.

## 1. Dependency Injection over Environment Branching

### 📐 Core Rule
Never use boolean flags (e.g., `USE_SANDBOX`, `IS_DEV`) to branch logic for different environments or mock services.

Code should remain entirely agnostic to the environment in which it executes. If an external service needs to be mocked, sandboxed, or rerouted, do not embed `if/else` logic inside the client or application code. Instead, control the connection dynamically by externalizing the Base URLs or endpoints via Environment Variables (e.g., `API_BASE_URL`).

### ❌ Anti-Pattern (Environment Branching)
```python
# Bad: Hardcoding environment logic and branching behavior inside application code
if settings.use_sandbox:
    base_url = "https://sandbox.api.com"
    headers["x-simulated-trading"] = "1"
else:
    base_url = "https://live.api.com"
```

### ✅ Standard (Dependency Injection via Config)
```python
# Good: Application is completely ignorant of its environment
# The Base URL is injected via configuration (Docker Compose, Terraform, Kubernetes, etc.)
self.client = httpx.AsyncClient(base_url=settings.api_base_url)
```

---

## 2. Infrastructure Requirements (12-Factor Compliant)

### Infrastructure Isolation
All infrastructure scripts (Terraform, CloudFormation, Ansible, Kubernetes manifests, etc.) MUST be contained within a dedicated `infrastructure/` directory rather than mixed into application source code.

### Environment Configuration
Environment-specific configurations (e.g., `dev.yaml`, `prod.yaml`) MUST be stored alongside the infrastructure scripts within the `infrastructure/` directory.

### Strict Secret Management
* Storing unencrypted credentials, sensitive tokens, or private auth keys inside configuration files (such as `prod.yaml`) or version-controlled files is strictly prohibited.
* All sensitive secrets MUST be injected via the environment and locally stored in `.env` files.
* All `.env` files MUST be strictly added to `.gitignore` to prevent committing them to version control.
