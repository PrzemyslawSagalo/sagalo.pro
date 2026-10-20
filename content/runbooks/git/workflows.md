---
title: Git Workflows & Daily Operations
weight: 2
type: docs
---

Curated workflows for daily Git operations, worktrees, branch synchronization, and commit inspection.

## Branch Synchronization

### Syncing with Upstream Master/Main
Fetch updates from the remote and rebase local commits cleanly on top:

```bash
git fetch origin
git rebase origin/master
```

### Pull with Rebase
Avoid unnecessary merge commits when updating local feature branches:

```bash
git pull --rebase
```

If merge conflicts arise during rebase and you need to abort:

```bash
git rebase --abort
```

---

## Git Worktree

Worktrees allow having multiple working branches checked out simultaneously in separate directories without multiple clones.

### Bare Clone Setup
```bash
git clone --bare <repository-url> .bare
```

### Adding a Worktree for an Existing Branch
```bash
git worktree add <path> <branch>
```

### Adding a Worktree with a New Branch
```bash
git worktree add <path> -b <new-branch> <base-branch>
```

### Listing and Removing Worktrees
```bash
git worktree list
git worktree remove <path>
```

---

## Log Inspection & Graph Visualization

### Graphical Single-Line History
```bash
git log --graph --pretty=oneline
```

### Full Branch Graph with Decorations
Display all branches, tags, and commits in an ASCII graph:

```bash
git log --graph --decorate --all --oneline
```

### Suppress Commit Notes
```bash
git log --no-notes
```

---

## History Rewriting & Reverting

### Interactive Rebase
Rebase and clean up the last `n` commits:

```bash
git rebase -i HEAD~n
```

### Reverting Commits
Create a new commit that reverses changes from a previous commit:

```bash
git revert <commit-hash>
```

When reverting a merge commit, specify the mainline parent flag (typically `-m 1`) to effectively reverse the changes introduced by the merge commit:

```bash
git revert -m 1 <merge-commit-hash>
```

### Deleting Tags
Remove local and remote tags (see reference guide on [how to delete local and remote tags on git](https://devconnected.com/how-to-delete-local-and-remote-tags-on-git/)):

```bash
# Delete local tag
git tag -d <tag-name>

# Delete remote tag
git push origin --delete <tag-name>
```

---

## End-of-Day Work-in-Progress (WIP) Commits

If your changes are not ready to be submitted at the end of your work day, make a dirty branch, commit all of your changes to it, and push it to a remote repository so work is never lost:

```bash
# Create and switch to a temporary WIP branch
git checkout -b feature/<branch-name>-wip

# Commit all changes to the dirty branch
git commit -am "WIP"

# Push dirty branch to remote
git push -u origin feature/<branch-name>-wip
```

When resuming work, continue on the branch and rebase or squash the WIP commits into clean, atomic commits before opening a Pull Request.
