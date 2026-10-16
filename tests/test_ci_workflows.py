import subprocess
import unittest
from pathlib import Path
import yaml

REPO_ROOT = Path(__file__).resolve().parent.parent

class TestCIWorkflows(unittest.TestCase):
    def test_01_yamllint_ci_workflow(self):
        """Verify YAML syntax of .github/workflows/ci.yml via yamllint -c .yamllint.yaml."""
        file_path = REPO_ROOT / ".github" / "workflows" / "ci.yml"
        self.assertTrue(file_path.exists(), f"{file_path} does not exist")
        res = subprocess.run(
            ["yamllint", "-c", ".yamllint.yaml", str(file_path)],
            cwd=str(REPO_ROOT),
            capture_output=True,
            text=True,
        )
        self.assertEqual(res.returncode, 0, f"yamllint failed on ci.yml:\n{res.stdout}\n{res.stderr}")

    def test_02_yamllint_dependency_review(self):
        """Verify YAML syntax of .github/workflows/dependency-review.yml via yamllint -c .yamllint.yaml."""
        file_path = REPO_ROOT / ".github" / "workflows" / "dependency-review.yml"
        self.assertTrue(file_path.exists(), f"{file_path} does not exist")
        res = subprocess.run(
            ["yamllint", "-c", ".yamllint.yaml", str(file_path)],
            cwd=str(REPO_ROOT),
            capture_output=True,
            text=True,
        )
        self.assertEqual(res.returncode, 0, f"yamllint failed on dependency-review.yml:\n{res.stdout}\n{res.stderr}")

    def test_03_yamllint_dependabot(self):
        """Verify YAML syntax of .github/dependabot.yml via yamllint -c .yamllint.yaml."""
        file_path = REPO_ROOT / ".github" / "dependabot.yml"
        self.assertTrue(file_path.exists(), f"{file_path} does not exist")
        res = subprocess.run(
            ["yamllint", "-c", ".yamllint.yaml", str(file_path)],
            cwd=str(REPO_ROOT),
            capture_output=True,
            text=True,
        )
        self.assertEqual(res.returncode, 0, f"yamllint failed on dependabot.yml:\n{res.stdout}\n{res.stderr}")

    def test_04_permissions_contents_read(self):
        """Assert presence of permissions: contents: read on all new workflows."""
        workflows = [
            REPO_ROOT / ".github" / "workflows" / "ci.yml",
            REPO_ROOT / ".github" / "workflows" / "dependency-review.yml",
        ]
        for wf_path in workflows:
            self.assertTrue(wf_path.exists(), f"{wf_path} does not exist")
            with open(wf_path, "r", encoding="utf-8") as f:
                data = yaml.safe_load(f)
            self.assertIn("permissions", data, f"'permissions' block missing in {wf_path}")
            permissions = data["permissions"]
            self.assertEqual(
                permissions.get("contents"),
                "read",
                f"'permissions.contents' is not 'read' in {wf_path}: got {permissions.get('contents')}"
            )

    def test_05_concurrency_cancellation_block(self):
        """Assert presence of concurrency cancellation block in .github/workflows/ci.yml."""
        ci_path = REPO_ROOT / ".github" / "workflows" / "ci.yml"
        self.assertTrue(ci_path.exists(), f"{ci_path} does not exist")
        with open(ci_path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
        self.assertIn("concurrency", data, "'concurrency' block missing in ci.yml")
        concurrency = data["concurrency"]
        self.assertTrue(
            concurrency.get("cancel-in-progress") is True,
            f"'cancel-in-progress' must be true in ci.yml, got {concurrency.get('cancel-in-progress')}"
        )
        self.assertEqual(
            concurrency.get("group"),
            "${{ github.workflow }}-${{ github.ref }}",
            f"concurrency group mismatch, got {concurrency.get('group')}"
        )

    def test_06_pinned_action_versions(self):
        """Verify pinned action versions across workflows."""
        ci_path = REPO_ROOT / ".github" / "workflows" / "ci.yml"
        dep_path = REPO_ROOT / ".github" / "workflows" / "dependency-review.yml"
        with open(ci_path, "r", encoding="utf-8") as f:
            ci_content = f.read()
        with open(dep_path, "r", encoding="utf-8") as f:
            dep_content = f.read()

        required_actions = [
            "actions/checkout@v4",
            "actions/setup-python@v5",
            "actions/setup-go@v5",
            "peaceiris/actions-hugo@v3",
        ]
        for action in required_actions:
            self.assertIn(action, ci_content, f"Action {action} missing or incorrect in ci.yml")

        self.assertIn(
            "actions/checkout@v4",
            dep_content,
            "actions/checkout@v4 missing in dependency-review.yml"
        )
        self.assertIn(
            "actions/dependency-review-action@v5",
            dep_content,
            "actions/dependency-review-action@v5 missing or incorrect in dependency-review.yml"
        )

if __name__ == "__main__":
    unittest.main()
