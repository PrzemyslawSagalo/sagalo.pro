---
title: Git Cheat Sheet (Reverting & Undoing)
weight: 1
type: docs
---

Practical strategies for safely undoing commits, restoring files, and cleaning untracked workspace changes.

## Cleaning Untracked Files (`git clean`)

Force-remove untracked files and directories from the working tree:

```bash
# Preview what will be deleted without actually deleting
git clean -n -d

# Force remove untracked files and directories
git clean -f -d
```

---

## Safely Undoing Commits on a Shared Branch

When unwanted commits have already been pushed to a shared collaborative branch, avoid `git reset --hard` as it breaks history for other team members. Instead, use a structured revert workflow:

### 1. Create a Dedicated Fix Branch
Always perform reverts on a separate branch so the change can go through standard CI and peer review:

```bash
git checkout main
git pull origin main
git checkout -b fix/revert-accidental-commits
```

### 2. Revert the Target Commits
Create new commits that systematically reverse the changes:

```bash
# Revert specific commits in reverse chronological order
git revert <commit-hash-1>
git revert <commit-hash-2>
```

### 3. Resolve Conflicts (If Any Occur)
If changes overlap with other modifications, Git will place standard conflict markers:
- `<<<<<<< HEAD`: The current code, including the changes being reverted.
- `=======`: Conflict separator.
- `>>>>>>> parent of ...`: Code as it existed before the reverted commit.

Edit the file to the desired state, then continue:

```bash
# Stage resolved files
git add <path/to/resolved/file>

# Continue revert process
git revert --continue
```

> [!TIP]
> If you need to abort the revert and restore branch state, run:
> ```bash
> git revert --abort
> ```

### 4. Squash Reverts into a Single Clean Commit
Clean up the branch history by combining multiple revert commits into one atomic commit:

```bash
# Rebase the last n revert commits (e.g. 3)
git rebase -i HEAD~3
```

In the interactive rebase editor, leave the first commit as `pick` and change the subsequent commits to `s` (squash):

```text
pick a1b2c3d Revert "wip commit 1"
s d4e5f6g Revert "wip commit 2"
s h7i8j9k Revert "wip commit 3"
```

Save and set a clear, conventional commit message (e.g., `revert(main): remove accidental WIP commits`).

---

## Revert Specific Committed Files

Restore a single file to its exact state from a previous commit without affecting other files:

```bash
git restore --source <commit-hash> -- <file-path>
```
