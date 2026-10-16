import subprocess
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent


class TestIntegration(unittest.TestCase):
    def test_18_full_make_test_pipeline(self):
        """Execute full end-to-end make test pipeline (lint + verify + build) and assert exit code is 0."""
        res = subprocess.run(
            ["make", "test"],
            cwd=str(REPO_ROOT),
            capture_output=True,
            text=True,
        )
        self.assertEqual(
            res.returncode,
            0,
            f"'make test' failed with code {res.returncode}:\nSTDOUT:\n{res.stdout}\nSTDERR:\n{res.stderr}",
        )
        self.assertIn("pre-commit run --all-files", res.stdout)
        self.assertIn("all modules verified", res.stdout)
        self.assertIn("Total in", res.stdout)

    def test_19_deployment_workflow_unmodified(self):
        """Verify that .github/workflows/hugo.yaml is clean and unmodified."""
        hugo_wf = REPO_ROOT / ".github" / "workflows" / "hugo.yaml"
        self.assertTrue(hugo_wf.exists(), f"{hugo_wf} does not exist")

        res = subprocess.run(
            ["git", "diff", "--exit-code", ".github/workflows/hugo.yaml"],
            cwd=str(REPO_ROOT),
            capture_output=True,
            text=True,
        )
        self.assertEqual(
            res.returncode,
            0,
            f".github/workflows/hugo.yaml has uncommitted changes:\n{res.stdout}\n{res.stderr}",
        )

        res_main = subprocess.run(
            ["git", "diff", "--exit-code", "main", "--", ".github/workflows/hugo.yaml"],
            cwd=str(REPO_ROOT),
            capture_output=True,
            text=True,
        )
        if res_main.returncode != 0:
            check_ref = subprocess.run(
                ["git", "rev-parse", "--verify", "main"],
                cwd=str(REPO_ROOT),
                capture_output=True,
                text=True,
            )
            if check_ref.returncode == 0:
                self.assertEqual(
                    res_main.returncode,
                    0,
                    f".github/workflows/hugo.yaml differs from main branch:\n{res_main.stdout}",
                )

    def test_20_no_untracked_build_artifacts(self):
        """Validate that build artifacts (like public/ directory) are ignored and not tracked by git."""
        gitignore_path = REPO_ROOT / ".gitignore"
        self.assertTrue(gitignore_path.exists(), ".gitignore does not exist")
        with open(gitignore_path, "r", encoding="utf-8") as f:
            gitignore_content = f.read()
        self.assertIn("public/", gitignore_content)

        res_ignore = subprocess.run(
            ["git", "check-ignore", "public/", "resources/_gen/", ".hugo_build.lock"],
            cwd=str(REPO_ROOT),
            capture_output=True,
            text=True,
        )
        self.assertEqual(
            res_ignore.returncode,
            0,
            f"Expected build artifact paths to be ignored by git:\n{res_ignore.stderr}",
        )
        ignored_patterns = res_ignore.stdout.splitlines()
        self.assertIn("public/", ignored_patterns)

        res_status = subprocess.run(
            ["git", "status", "--porcelain"],
            cwd=str(REPO_ROOT),
            capture_output=True,
            text=True,
        )
        self.assertEqual(res_status.returncode, 0)
        status_lines = res_status.stdout.splitlines()
        untracked_files = [line.strip().split(maxsplit=1)[1] for line in status_lines if line.startswith("??")]
        for uf in untracked_files:
            self.assertFalse(
                uf.startswith("public/"),
                f"public/ build directory is unexpectedly untracked in git: {uf}",
            )

    def test_21_required_files_exist(self):
        """Verify that all expected configuration and workflow files exist and are non-empty."""
        expected_files = [
            REPO_ROOT / ".pre-commit-config.yaml",
            REPO_ROOT / ".yamllint.yaml",
            REPO_ROOT / ".markdownlint.yaml",
            REPO_ROOT / ".github" / "workflows" / "ci.yml",
            REPO_ROOT / ".github" / "workflows" / "dependency-review.yml",
            REPO_ROOT / ".github" / "dependabot.yml",
            REPO_ROOT / "Makefile",
        ]
        for fpath in expected_files:
            self.assertTrue(fpath.exists(), f"Required file {fpath.name} does not exist at {fpath}")
            self.assertGreater(
                fpath.stat().st_size,
                0,
                f"Required file {fpath.name} is empty",
            )


if __name__ == "__main__":
    unittest.main()
