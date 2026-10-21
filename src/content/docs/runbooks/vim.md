---
title: Vim & Neovim Cheat Sheet
description: "Vim & Neovim modal editing motions, regex substitution, buffer management, and sorting flags."
sidebar:
  order: 2
tags:
  - vim
  - neovim
  - productivity
  - editor
---

A curated reference of everyday Vim and Neovim navigation, substitution, sorting, window management, and plugin shortcuts.

## General Shortcuts

| Key | Action |
| :--- | :--- |
| `"+y` | Copy to OS system clipboard |
| `:norm A  [text]` | Append text at the end of each selected line in normal mode |
| `:verbose imap <key>` | Inspect which plugin/config mapped a key in insert mode |
| `:verbose nmap <key>` | Inspect which plugin/config mapped a key in normal mode |

---

## Basic Word Navigation

- `w` - Move the cursor forward to the **beginning** of the next word.
- `b` - Move the cursor backward to the **beginning** of the current or previous word.
- `e` - Move the cursor forward to the **end** of the current or next word.

---

## Search & Substitution

### Single File Substitution

```vim
:[range]s/search/replace/[flags]
```

- **`range`** (optional): Range of lines to apply substitution:
  - `%`: Entire file.
  - `1,5s`: Lines 1 through 5.
  - `.,+10s`: From current line to 10 lines down.
- **`search`**: Target string or regular expression pattern.
- **`replace`**: Replacement string.
- **`flags`** (optional):
  - `g`: Global (replace all occurrences per line, not just the first).
  - `i`: Case-insensitive search.
  - `c`: Confirm each substitution interactively.

### Multi-Buffer Substitution (Across All Open Buffers)

```vim
:bufdo %s/old_pattern/new_pattern/gce | update
```

- **`:bufdo`**: Executes the subsequent command across every buffer in the buffer list.
- **`gce`**: Flags:
  - `g`: Replace all occurrences per line.
  - `c`: Confirm each substitution interactively.
  - `e`: Suppress errors if the pattern is not found in a buffer.
- **`update`**: Writes and saves the file only if modifications were made.

---

## Sorting (`sort`)

### Basic Syntax

```vim
:[range]sort[!] [options] [/{pattern}/]
```

### Ranges

| Command | Description |
| :--- | :--- |
| `:%sort` | Sort the entire file. |
| `:10,20sort` | Sort lines 10 through 20. |
| `:'<,'>sort` | Sort the current visual selection (automatically entered after selecting). |
| `:.,+5sort` | Sort from the current line to 5 lines down. |

### Common Flags

| Flag | Description | Example |
| :--- | :--- | :--- |
| `!` or `r` | **R**everse the sort order. | `:%sort!` |
| `u` | **U**nique: remove duplicate lines. | `:%sort u` |
| `n` | **N**umeric: sort based on the first decimal number in the line. | `:%sort n` |
| `i` | **I**gnore case. | `:%sort i` |
| `f` | **F**old case: similar to `i` but respects `'ignorecase'` setting. | `:%sort f` |
| `x` | Sort based on the first he**x**adecimal number. | `:%sort x` |
| `o` | Sort based on the first **o**ctal number. | `:%sort o` |
| `b` | Sort based on the first **b**inary number. | `:%sort b` |

### Combining Flags

```vim
" Reverse, numeric, unique sort
:%sort! nu

" Case-insensitive unique sort
:%sort ui
```

---

## Buffers, Windows, and Tabs

### Concepts
- **Buffers**: In-memory representations of files. Opening a file loads it into a buffer.
- **Windows**: Viewports into buffers. Multiple windows can view different buffers (or different parts of the same buffer) simultaneously.
- **Tabs**: Collections or layouts of windows.

### Navigation

| Key | Action |
| :--- | :--- |
| `gt` | Next tab |
| `gT` | Previous tab |
| `<S-l>` | Next buffer |
| `<S-h>` | Previous buffer |
| `:bwipeout` (or `:bw`) | Delete and remove buffer from buffer list |

---

## Plugins & LSP

### LSP
| Key | Action |
| :--- | :--- |
| `:LspInfo` | Display status and attached clients of the LSP server |

### nvim-surround
| Key | Action | Example |
| :--- | :--- | :--- |
| `ys<motion><delimiter>` | Add surrounding | `ysiw"` wraps word in `""` |
| `cs<old><new>` | Change surrounding | `cs"'` changes `""` to `''` |
| `ds<delimiter>` | Delete surrounding | `ds"` removes surrounding `""` |

### nvim-tree
| Key | Action | Description |
| :--- | :--- | :--- |
| `<CR>` | `edit` | Open file/folder; root will cd to parent directory |
| `<C-v>` | `vsplit` | Open file in vertical split |
| `<C-x>` | `split` | Open file in horizontal split |
| `<C-t>` | `tabnew` | Open file in new tab |
| `<` | `prev_sibling` | Navigate to previous sibling |
| `>` | `next_sibling` | Navigate to next sibling |
| `P` | `parent_node` | Move cursor to parent directory |
| `<BS>` | `close_node` | Close current opened directory or parent |
| `<Tab>` | `preview` | Open file preview without moving focus from tree |
| `R` | `refresh` | Refresh tree |
| `a` | `create` | Add file (trailing `/` creates directory) |
| `d` | `remove` | Delete file/directory (with confirmation) |
| `D` | `trash` | Trash file via system trash |
| `r` | `rename` | Rename file |
| `<C-r>` | `full_rename` | Full rename (omits original filename on input) |
| `e` | `rename_basename` | Rename without modifying extension (`:t:r`) |
| `x` | `cut` | Cut file/directory to clipboard |
| `c` | `copy` | Copy file/directory to clipboard |
| `p` | `paste` | Paste from clipboard |
| `y` | `copy_name` | Copy filename to system clipboard |
| `Y` | `copy_path` | Copy relative path to system clipboard |
| `gy` | `copy_absolute_path` | Copy absolute path to system clipboard |
| `s` | `system_open` | Open with system default application / file manager |

### Telescope & treesj
- `:Telescope keymaps` — Interactive fuzzy finder for active key mappings.
- [treesj commands](https://github.com/Wansmer/treesj?tab=readme-ov-file#commands) — Split and join code blocks using tree-sitter.
