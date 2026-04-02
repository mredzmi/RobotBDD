# QA-Bots — Claude Code VSCode Extension

A VSCode extension that installs **QA-Bot slash commands** into your Claude Code workspace, giving you AI-powered QA assistants directly inside Claude Code CLI.

## Commands

| Slash Command      | Description |
|--------------------|-------------|
| `/QA-sanity`       | Run a quick sanity check on your codebase — imports, deps, env, smoke tests |
| `/QA-regression`   | Analyse recent changes for regression risk and generate targeted test cases |
| `/QA-automate`     | Generate automated test cases (Jest, Pytest, Robot Framework, BDD, etc.) |
| `/QA-debug`        | Debug errors and failing tests — root-cause analysis + fix suggestions |
| `/QA-reviewPR`     | Review a pull request for quality, bugs, and missing test coverage |

## Installation

1. Install the extension from the VS Code Marketplace (search **QA-Bots**).
2. Open your project in VS Code.
3. Run **QA-Bots: Install Claude Code Commands** from the Command Palette (`Ctrl+Shift+P`).
4. Open Claude Code in the same workspace — all `/QA-*` commands are now available.

## How It Works

On activation the extension copies five Claude Code skill files into your workspace at `.claude/commands/`. Claude Code automatically picks up any `.md` files in that directory and exposes them as slash commands.

```
your-project/
└── .claude/
    └── commands/
        ├── QA-sanity.md
        ├── QA-regression.md
        ├── QA-automate.md
        ├── QA-debug.md
        └── QA-reviewPR.md
```

## Requirements

- [Claude Code CLI](https://github.com/anthropics/claude-code) installed and authenticated.
- VS Code 1.85.0 or later.

## Development

```bash
npm install
npm run compile        # one-off build
npm run watch          # watch mode
npm run package        # produce .vsix bundle
```
