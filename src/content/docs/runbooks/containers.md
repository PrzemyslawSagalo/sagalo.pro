---
title: Containers & OpenShift (Docker & oc)
sidebar:
  order: 4
---

Practical runbook for daily Docker container management, resource inspection, and OpenShift image registry operations.

## Docker Resource Inspection

### System Disk Usage
Inspect how much disk space is consumed by images, containers, local volumes, and build caches:

```bash
docker system df
```

For verbose, per-item breakdown:
```bash
docker system df -v
```

### Live Resource Utilization
Stream real-time CPU, memory, network I/O, and block I/O statistics across running containers:

```bash
docker stats
```

To format or stream specific containers:
```bash
docker stats --no-stream
```

### Container Process Table
Display the running processes inside a specific container directly from the host:

```bash
docker top <container_id_or_name>
```

### Host & Container File Transfer
Copy files or directories bidirectionally between a running container and the local filesystem:

```bash
# Copy from host to container
docker cp ./config.json <container_id>:/app/config.json

# Copy from container to host
docker cp <container_id>:/var/log/app.log ./app.log
```

---

## OpenShift CLI (`oc`) Registry Workflows

When working with private OpenShift container registries, configure the local Docker daemon and authenticate using short-lived tokens.

### 1. Cluster Authentication
Log into the target OpenShift cluster via CLI:

```bash
oc login --server=<cluster-api-url> --token=<auth-token>
```

### 2. Insecure Registry Configuration
If the OpenShift internal image registry route uses self-signed or internal enterprise certificates, register the domain in Docker daemon's configuration:

Edit `/etc/docker/daemon.json` (requires root privileges):
```json
{
  "insecure-registries": [
    "default-route-openshift-image-registry.<cluster-domain>.com"
  ]
}
```

Reload and restart Docker:
```bash
sudo systemctl daemon-reload
sudo systemctl restart docker
```

### 3. Registry Authentication via CLI Token
Authenticate Docker directly against the OpenShift image registry using your active `oc` session token:

```bash
docker login -u openshift -p $(oc whoami -t) default-route-openshift-image-registry.<cluster-domain>.com
```

---

## Reference Guides & Cheat Sheets

> [!TIP]
> **Offline Reference**: A comprehensive [Docker CLI Cheat Sheet (PDF)](/docs/docker.pdf) is available for offline download.
