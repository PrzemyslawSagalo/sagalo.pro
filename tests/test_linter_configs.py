import os
import subprocess
import unittest
from pathlib import Path
import yaml

REPO_ROOT = Path(__file__).resolve().parent.parent


class TestLinterConfigs(unittest.TestCase):
    def test_01_yamllint_config(self):
        config_path = REPO_ROOT / ".yamllint.yaml"
        self.assertTrue(config_path.exists(), ".yamllint.yaml does not exist")
        with open(config_path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
        self.assertEqual(data.get("extends"), "default")
        rules = data.get("rules", {})
        self.assertEqual(rules.get("document-start"), "disable")
        self.assertEqual(rules.get("line-length"), {"max": 160, "level": "warning"})
        self.assertEqual(rules.get("truthy"), {"check-keys": False})

    def test_02_markdownlint_config(self):
        config_path = REPO_ROOT / ".markdownlint.yaml"
        self.assertTrue(config_path.exists(), ".markdownlint.yaml does not exist")
        with open(config_path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
        self.assertTrue(data.get("default"))
        self.assertFalse(data.get("MD013"))
        self.assertFalse(data.get("MD033"))
        self.assertEqual(data.get("MD024"), {"siblings_only": True})

    def test_03_pre_commit_config(self):
        config_path = REPO_ROOT / ".pre-commit-config.yaml"
        self.assertTrue(config_path.exists(), ".pre-commit-config.yaml does not exist")
        with open(config_path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
        repos = data.get("repos", [])
        repo_map = {r.get("repo"): r.get("rev") for r in repos}
        self.assertEqual(repo_map.get("https://github.com/pre-commit/pre-commit-hooks"), "v5.0.0")
        self.assertEqual(repo_map.get("https://github.com/adrienverge/yamllint"), "v1.35.1")
        self.assertEqual(repo_map.get("https://github.com/igorshubovych/markdownlint-cli"), "v0.44.0")

    def test_04_yamllint_on_existing_yamls(self):
        yamllint_cfg = REPO_ROOT / ".yamllint.yaml"
        self.assertTrue(yamllint_cfg.exists(), ".yamllint.yaml does not exist")
        target_files = [
            str(REPO_ROOT / "hugo.yaml"),
            str(REPO_ROOT / ".github" / "workflows" / "hugo.yaml"),
        ]
        for tf in target_files:
            self.assertTrue(os.path.exists(tf), f"Target YAML file {tf} does not exist")
        cmd = ["yamllint", "-c", str(yamllint_cfg)] + target_files
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, check=False)
            self.assertEqual(
                result.returncode,
                0,
                f"yamllint returned non-zero code {result.returncode}:\nSTDOUT:\n{result.stdout}\nSTDERR:\n{result.stderr}",
            )
        except FileNotFoundError:
            self.skipTest("yamllint executable not found in PATH")

    def test_05_markdownlint_rules_tolerance(self):
        config_path = REPO_ROOT / ".markdownlint.yaml"
        self.assertTrue(config_path.exists(), ".markdownlint.yaml does not exist")
        readme_path = REPO_ROOT / "README.md"
        self.assertTrue(readme_path.exists(), "README.md does not exist")
        with open(config_path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
        self.assertFalse(data.get("MD013"), "MD013 should be disabled")
        self.assertFalse(data.get("MD033"), "MD033 should be disabled")


if __name__ == "__main__":
    unittest.main()
