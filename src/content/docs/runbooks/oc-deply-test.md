**Goal:** Quick test/hotfix for a hardcoded file in a container image without pushing commits or waiting for a CI/CD pipeline. It utilizes an ephemeral volume (projected in node RAM) to mask the original file path.

### 🛠️ Step-by-Step: Injecting the ConfigMap (Hotfix)

- [ ] **1. Dump configuration:** Extract the current file from the running pod to your local drive.
  `oc exec deployment/<deployment-name> -n <namespace> -- cat /path/in/container/file.yml > local-file.yml`

- [ ] **2. Edit:** Modify `local-file.yml` in your code editor.

- [ ] **3. Create ConfigMap:** Wrap the modified file into a Kubernetes object.
  `oc create cm <cm-hotfix-name> --from-file=<original-file.yml>=local-file.yml -n <namespace>`

- [ ] **4. Apply the patch (Rollout):** Inject the volume exactly at the target file path. OpenShift will automatically terminate the old pod and spin up a new one with the overwritten configuration.
  `oc set volume deployment/<deployment-name> --add --name=<volume-name> --type=configmap --configmap-name=<cm-hotfix-name> --mount-path=/path/in/container/file.yml --sub-path=<original-file.yml> -n <namespace>`

### 🧹 Cleanup (End of Test)
*Keep your receipts* – once the test is done, revert the changes to restore the system to its original state from the baked Docker image.

- [ ] **1. Detach volume:** Remove the mount (this triggers a rollout back to the clean image).
  `oc set volume deployment/<deployment-name> --remove --name=<volume-name> -n <namespace>`

- [ ] **2. Delete ConfigMap:** Remove the temporary object from the cluster.
  `oc delete cm <cm-hotfix-name> -n <namespace>`
