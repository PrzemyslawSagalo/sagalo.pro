import subprocess
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent

class TestMakefileAndDocs(unittest.TestCase):
    def test_01_makefile_syntax(self):
        """Verify Makefile syntax and target parsing via make -n help."""
        makefile_path = REPO_ROOT / "Makefile"
        self.assertTrue(makefile_path.exists(), f"{makefile_path} does not exist")
        res = subprocess.run(
            ["make", "-n", "help"],
            cwd=str(REPO_ROOT),
            capture_output=True,
            text=True,
        )
        self.assertEqual(res.returncode, 0, f"make -n help failed:\n{res.stdout}\n{res.stderr}")

    def test_02_make_help_output(self):
        """Verify make help outputs description for all targets (help, lint, verify, build, serve, test)."""
        res = subprocess.run(
            ["make", "help"],
            cwd=str(REPO_ROOT),
            capture_output=True,
            text=True,
        )
        self.assertEqual(res.returncode, 0, f"make help failed:\n{res.stdout}\n{res.stderr}")
        expected_targets = ["help", "lint", "verify", "build", "serve", "test"]
        for target in expected_targets:
            self.assertIn(
                f"make {target}",
                res.stdout,
                f"Expected target 'make {target}' not found in 'make help' output:\n{res.stdout}",
            )

    def test_03_default_goal_is_help(self):
        """Verify .DEFAULT_GOAL := help triggers help menu by default when executing plain make."""
        makefile_path = REPO_ROOT / "Makefile"
        self.assertTrue(makefile_path.exists(), f"{makefile_path} does not exist")
        with open(makefile_path, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertIn(".DEFAULT_GOAL := help", content, ".DEFAULT_GOAL := help missing in Makefile")

        res_plain = subprocess.run(
            ["make"],
            cwd=str(REPO_ROOT),
            capture_output=True,
            text=True,
        )
        self.assertEqual(res_plain.returncode, 0, f"plain 'make' failed:\n{res_plain.stdout}\n{res_plain.stderr}")
        res_help = subprocess.run(
            ["make", "help"],
            cwd=str(REPO_ROOT),
            capture_output=True,
            text=True,
        )
        self.assertEqual(res_plain.stdout, res_help.stdout, "Plain 'make' output does not match 'make help'")

    def test_04_make_verify(self):
        """Verify make verify successfully runs go mod verify and hugo mod verify."""
        res = subprocess.run(
            ["make", "verify"],
            cwd=str(REPO_ROOT),
            capture_output=True,
            text=True,
        )
        self.assertEqual(res.returncode, 0, f"make verify failed:\n{res.stdout}\n{res.stderr}")
        self.assertIn("all modules verified", res.stdout, f"Expected 'all modules verified' in stdout:\n{res.stdout}")

    def test_05_make_build_dry_run(self):
        """Verify make build dry-run executes hugo --gc --minify without errors."""
        res = subprocess.run(
            ["make", "-n", "build"],
            cwd=str(REPO_ROOT),
            capture_output=True,
            text=True,
        )
        self.assertEqual(res.returncode, 0, f"make -n build failed:\n{res.stdout}\n{res.stderr}")
        self.assertIn("hugo --gc --minify", res.stdout, f"Expected 'hugo --gc --minify' in stdout:\n{res.stdout}")

    def test_06_readme_documentation(self):
        """Validate README.md contains Node.js (>= 18), Hugo Extended, Go, Python, and Makefile commands."""
        readme_path = REPO_ROOT / "README.md"
        self.assertTrue(readme_path.exists(), f"{readme_path} does not exist")
        with open(readme_path, "r", encoding="utf-8") as f:
            content = f.read()

        required_strings = [
            "Node.js",
            ">= 18",
            "Hugo Extended",
            ">= 0.146.0",
            "Go",
            ">= 1.21",
            "Python",
            ">= 3.10",
            "make help",
            "make serve",
            "make lint",
            "make verify",
            "make build",
            "make test",
            "pre-commit install",
        ]
        for req in required_strings:
            self.assertIn(req, content, f"Required string '{req}' not found in README.md")

if __name__ == "__main__":
    unittest.main()
