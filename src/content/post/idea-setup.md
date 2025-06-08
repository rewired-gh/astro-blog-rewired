---
date: 2025-04-10
title: 'My IntelliJ IDEA Setup'
tags: [
  'Quick Note'
]
language: 'en'
---

> This is a quick note and may not be polished.

## Software Resources

- Ultimate EAP: <https://www.jetbrains.com/idea/nextversion>
- Community Edition: <https://www.jetbrains.com/idea/download>

## Appearance

- Theme: Light with Light Header
- Font: IBM Plex Mono
- Font size: 14.0
- Line height: 1.1
- Show whitespaces: Trailing, Selection
- Show line numbers: Hybrid

## Plugins

AceJump, IdeaVim, IdeaVim-EasyMotion, Which-Key, Maven Helper, VSCode Keymap, Google Search, Kursor, JPA Buddy, Multi-Project Workspace.

## .ideavimrc

```txt
" .ideavimrc is a configuration file for IdeaVim plugin. It uses
"   the same commands as the original .vimrc configuration.
" You can find a list of commands here: https://jb.gg/h38q75
" Find more examples here: https://jb.gg/share-ideavimrc


"" -- Suggested options --
" Show a few lines of context around the cursor. Note that this makes the
" text scroll if you mouse-click near the start or end of the window.
set scrolloff=5

" Do incremental searching.
set incsearch

" Don't use Ex mode, use Q for formatting.
map Q gq

let mapleader=" "

set timeoutlen=60000

" --- Enable IdeaVim plugins https://jb.gg/ideavim-plugins

" Highlight copied text
Plug 'machakann/vim-highlightedyank'
" Commentary plugin
Plug 'tpope/vim-commentary'
Plug 'easymotion/vim-easymotion'
Plug 'justinmk/vim-sneak'
Plug 'tpope/vim-surround'
Plug 'vim-scripts/argtextobj.vim'
set which-key
set peekaboo

" Highlight copied text
" ---------------------
" Plugin: vim-highlightedyank
" Automatically highlights the text you yank (copy) for a brief moment.
" No configuration is required, but you can customize the highlight duration.

" Commentary plugin
" -----------------
" Plugin: vim-commentary
" Toggle comments for code.
" Usage:
" - gcc: Toggle comment on a line (normal mode).
" - gc{motion}: Comment/uncomment a selected range (e.g., `gcip` for a paragraph).
" - Visual mode: Select text and press `gc` to toggle comments.

" EasyMotion
" ----------
" Plugin: vim-easymotion
" Quickly jump to any word, character, or location on the screen.
" Usage:
" - <Leader><Leader>w: Jump to the start of a word.
" - <Leader><Leader>f{char}: Jump to a specific character on the current line.
" - <Leader><Leader>j/k: Jump up/down multiple lines.
" Note: Replace `<Leader>` with your leader key (default is `\`).

" Vim-Sneak
" ---------
" Plugin: vim-sneak
" Fast motion plugin to jump to specific characters.
" Usage:
" - s{char}{char}: Jump to the next occurrence of two characters.
" - S{char}{char}: Jump backward to the previous occurrence.
" - Use `;` and `,` to repeat the last Sneak motion (forward and backward).

" Surround
" --------
" Plugin: vim-surround
" Easily add, change, or delete surrounding characters (quotes, brackets, etc.).
" Usage:
" - cs{char}{char}: Change surrounding (e.g., `cs"'` changes "text" to 'text').
" - ds{char}: Delete surrounding (e.g., `ds"` removes quotes around "text").
" - ysiw{char}: Add surrounding to a word (e.g., `ysiw)` wraps a word in parentheses).
" - Visual mode: Select text and use `S{char}` to surround it.

" Argument Text Object
" --------------------
" Plugin: argtextobj.vim
" Provides a text object for arguments (e.g., function arguments).
" Usage:
" - cia: Change the argument under the cursor.
" - dia: Delete the argument under the cursor.
" - Use with operators like `y` (yank) or `v` (visual mode).
" Example: `cia` changes the current argument.

" Which-Key
" ---------
" Command: set which-key
" Displays a popup menu showing available key bindings when you press your leader key.
" No further configuration is needed, but you can customize its appearance.

" Peekaboo
" --------
" Command: set peekaboo
" Enhances the register preview when pasting (`"`) or using macros (`@`).
" Automatically displays the contents of the clipboard/register as you type.
" No additional configuration is required.

"" -- Map IDE actions to IdeaVim -- https://jb.gg/abva4t
"" Map <leader>f to the Reformat Code action
map <leader>f <Action>(ReformatCode)

"" Map <leader>d to start debug
map <leader>d <Action>(Debug)

"" Map <leader>b to toggle the breakpoint on the current line
map <leader>b <Action>(ToggleLineBreakpoint)
```

## Miscellaneous

- Keymap: VSCode (macOS)
- Language: English
- Region: Asia (except China Mainland)
- Allow auto-make [...]: Enabled
- Terminal engine: Reworked 2025
- Automatically download: Documentation, Annotations
- Vim: No handlers