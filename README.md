# QA-Bots — AI-Powered QA Extension for VS Code

> Works with **any AI** — GitHub Copilot, OpenAI GPT-4o, Claude, Gemini, and more.

Five QA assistants available directly in VS Code — no specific AI subscription required.

---

## Supported AI Backends

```mermaid
flowchart LR
    EXT["🧩 QA-Bots Extension"]

    EXT -->|"vscode-lm\n(default)"| VSLM["🤖 VS Code Language Model API\n─────────────────────────\nGitHub Copilot · Claude · Gemini\nAny VS Code AI extension"]
    EXT -->|"openai"| OAI["🟢 OpenAI API\n─────────────────────────\nGPT-4o · GPT-4-turbo\n(requires API key)"]
    EXT -->|"claude-code"| CC["⚡ Claude Code CLI\n─────────────────────────\nInstalls .md skill files\ninto .claude/commands/"]

    style EXT fill:#2d2d2d,color:#fff,stroke:#ff9e4a,stroke-width:2px
    style VSLM fill:#1e3a5f,color:#fff,stroke:#4a9eff
    style OAI fill:#1a4a2a,color:#fff,stroke:#4aff9e
    style CC fill:#4a2a1a,color:#fff,stroke:#ff9e4a
```

Switch backends any time via **VS Code Settings → QA-Bots → AI Backend**.

---

## System Architecture

```mermaid
flowchart TD
    subgraph DEV["💻 Developer's Machine"]
        subgraph VSCODE["VS Code 1.90+"]
            EXT["🧩 QA-Bots Extension"]
            CHAT["💬 Chat Panel\n@qa-bots /sanity"]
            CMD["⌨️ Command Palette\nQA-Bots: Run Sanity Check"]
        end

        subgraph PROJECT["📁 Your Project  (any language)"]
            SRC["src/"]
            TESTS["tests/"]
            GIT[".git/"]
            subgraph CLAUDE_DIR[".claude/commands/  ← only for claude-code backend"]
                S["QA-sanity.md"]
                R["QA-regression.md"]
                A["QA-automate.md"]
                D["QA-debug.md"]
                P["QA-reviewPR.md"]
            end
        end
    end

    subgraph AI_LAYER["☁️ AI Layer  (your choice)"]
        VSLM["🤖 VS Code LM API\n(Copilot · Claude · Gemini)"]
        OAI["🟢 OpenAI\n(GPT-4o)"]
        CC["⚡ Claude Code CLI"]
    end

    CHAT -->|"streams response"| EXT
    CMD --> EXT
    EXT -->|"reads prompt + gathers context"| PROJECT
    EXT -->|"vscode-lm backend"| VSLM
    EXT -->|"openai backend"| OAI
    EXT -->|"claude-code backend"| CC

    VSLM --> OUT["📋 Result shown as\nMarkdown Preview"]
    OAI --> OUT
    CC --> OUT

    style EXT fill:#2d2d2d,color:#fff,stroke:#ff9e4a,stroke-width:2px
```

---

## Commands & Benefits

```mermaid
flowchart TD
    EXT["🤖 QA-Bots\n(any AI backend)"]

    EXT --> SANITY["/QA-sanity\n🏥 Sanity Check"]
    EXT --> REGRESSION["/QA-regression\n📉 Regression Analysis"]
    EXT --> AUTOMATE["/QA-automate\n⚙️ Test Generation"]
    EXT --> DEBUG["/QA-debug\n🐛 Debug Assistant"]
    EXT --> REVIEWPR["/QA-reviewPR\n🔍 PR Review"]

    SANITY --> S1["✅ Verifies deps & lock files\n✅ Checks project structure\n✅ Detects broken imports\n✅ Smoke-test dry-run\n→ Pass / Warn / Fail report"]

    REGRESSION --> R1["📊 Diffs recent git changes\n🎯 Maps regression risk areas\n🔎 Finds test coverage gaps\n🧪 Generates targeted\ntest cases by priority"]

    AUTOMATE --> A1["🔎 Auto-detects framework\nJest · Pytest · Robot · Mocha…\n📝 Writes complete runnable tests\n🎭 BDD / Gherkin scenarios\n≥ 80% branch coverage target"]

    DEBUG --> D1["📜 Parses stack traces\n🌳 5-Why root cause analysis\n💡 Before/after fix diff\n🛡️ Suggests regression test\nto prevent recurrence"]

    REVIEWPR --> P1["🐛 Logic & correctness review\n🔒 Security vulnerability scan\n⚡ Performance red flags\n✅ Test coverage verdict\n→ APPROVE / REQUEST CHANGES"]

    style EXT fill:#2d2d2d,color:#fff,stroke:#ff9e4a,stroke-width:3px
    style SANITY fill:#1e3a5f,color:#fff,stroke:#4a9eff
    style REGRESSION fill:#1e3a5f,color:#fff,stroke:#4a9eff
    style AUTOMATE fill:#1e3a5f,color:#fff,stroke:#4a9eff
    style DEBUG fill:#1e3a5f,color:#fff,stroke:#4a9eff
    style REVIEWPR fill:#1e3a5f,color:#fff,stroke:#4a9eff
```

---

## Step-by-Step User Journey

```mermaid
flowchart LR
    ST1["① Build\n─────\nnpm install\nnpm run package\n⬇\nqa-bots-0.2.0.vsix"]
    ST2["② Install\n─────\ncode --install-extension\nqa-bots-0.2.0.vsix"]
    ST3["③ Pick AI\n─────\nSettings → QA-Bots\n→ AI Backend\nvscode-lm / openai\n/ claude-code"]
    ST4["④ Open Project\n─────\ncode /your-project"]
    ST5["⑤ Run via Chat\n─────\n@qa-bots /sanity\n@qa-bots /debug\n(in Copilot Chat)"]
    ST6["⑥ OR via\nCommand Palette\n─────\nCtrl+Shift+P\n→ QA-Bots: Run…"]

    ST1 --> ST2 --> ST3 --> ST4 --> ST5
    ST4 --> ST6

    style ST1 fill:#1e3a5f,color:#fff,stroke:#4a9eff
    style ST2 fill:#1e3a5f,color:#fff,stroke:#4a9eff
    style ST3 fill:#5f3a1e,color:#fff,stroke:#ff9e4a
    style ST4 fill:#1e3a5f,color:#fff,stroke:#4a9eff
    style ST5 fill:#1e5f3a,color:#fff,stroke:#4aff9e
    style ST6 fill:#1e5f3a,color:#fff,stroke:#4aff9e
```

---

## Example: One Project, Real Dev Flow

```mermaid
sequenceDiagram
    actor Dev as 👨‍💻 Developer
    participant VSC as VS Code + QA-Bots
    participant AI as Any AI (Copilot / GPT-4o / Claude)
    participant Repo as Your Repo (my-app)

    Dev->>VSC: Opens my-app workspace

    Note over Dev,Repo: ── Writing a new feature ──

    Dev->>VSC: @qa-bots /sanity  OR  Ctrl+Shift+P → QA-Bots: Run Sanity Check
    VSC->>Repo: Reads package.json, src/, tests/
    VSC->>AI: Sends QA-sanity prompt + workspace context
    AI-->>Dev: 📋 Sanity Report (pass / warn / fail)

    Note over Dev,Repo: ── Before committing ──

    Dev->>VSC: @qa-bots /automate  (active file: src/payment.ts)
    VSC->>Repo: Reads payment.ts content
    VSC->>AI: Sends QA-automate prompt + file content
    AI-->>Dev: ⚙️ Complete Jest/Pytest test file

    Note over Dev,Repo: ── A test is failing ──

    Dev->>VSC: @qa-bots /debug TypeError: Cannot read 'id'
    VSC->>Repo: Reads active file context
    VSC->>AI: Sends QA-debug prompt + stack trace
    AI-->>Dev: 🐛 Root cause + fix diff + regression test

    Note over Dev,Repo: ── Opening a Pull Request ──

    Dev->>VSC: @qa-bots /reviewPR
    VSC->>Repo: git diff main...HEAD
    VSC->>AI: Sends QA-reviewPR prompt + full diff
    AI-->>Dev: 🔍 Review checklist + APPROVE / REQUEST CHANGES
```

---

## Commands

| Slash Command | Chat (`@qa-bots`) | Command Palette | Description |
|---|---|---|---|
| `/QA-sanity` | `/sanity` | QA-Bots: Run Sanity Check | Health-check deps, imports, structure |
| `/QA-regression` | `/regression` | QA-Bots: Run Regression Analysis | Risk analysis of recent git changes |
| `/QA-automate` | `/automate` | QA-Bots: Generate Automated Tests | Full test code for the active file |
| `/QA-debug` | `/debug <error>` | QA-Bots: Debug Errors | Root cause + fix for errors/failures |
| `/QA-reviewPR` | `/reviewPR` | QA-Bots: Review Pull Request | Full QA review of the branch diff |

---

## Step-by-Step: Install & Use

### Prerequisites

- [ ] **Node.js 18+**
- [ ] **VS Code 1.90+**
- [ ] At least **one** of:
  - **GitHub Copilot** extension (for `vscode-lm` backend — recommended, no extra setup)
  - **OpenAI API key** (for `openai` backend)
  - **Claude Code CLI** authenticated (for `claude-code` backend)

---

### Step 1 — Build & Install the Extension Locally

1. Clone this repository:
   ```bash
   git clone https://github.com/mredzmi/robotbdd.git
   cd robotbdd
   ```
2. Install dependencies and build:
   ```bash
   npm install
   npm run package
   ```
   This produces `qa-bots-0.2.0.vsix` in the project root.
3. Install in VS Code:
   ```bash
   code --install-extension qa-bots-0.2.0.vsix
   ```

---

### Step 2 — Pick Your AI Backend

Open VS Code Settings (`Ctrl+,`) and search **QA-Bots**:

| Setting | Value | Requirement |
|---|---|---|
| `qa-bots.aiBackend` | `vscode-lm` | GitHub Copilot or any VS Code AI extension |
| `qa-bots.aiBackend` | `openai` | Set `qa-bots.openaiApiKey` to your OpenAI key |
| `qa-bots.aiBackend` | `claude-code` | Claude Code CLI installed and `claude login` done |

> **Recommended:** Leave it as `vscode-lm`. If you have GitHub Copilot, it works out of the box.

---

### Step 3 — Open Your Project

```bash
code /path/to/your-project
```

---

### Step 4 — Run a QA-Bot

**Option A — Chat panel** (GitHub Copilot or any VS Code AI chat):

Open the Chat panel (`Ctrl+Alt+I`) and type:
```
@qa-bots /sanity
@qa-bots /regression
@qa-bots /automate
@qa-bots /debug TypeError: Cannot read 'id' at src/users.ts:42
@qa-bots /reviewPR
```

**Option B — Command Palette**:

Press `Ctrl+Shift+P` and search:
```
QA-Bots: Run Sanity Check
QA-Bots: Run Regression Analysis
QA-Bots: Generate Automated Tests
QA-Bots: Debug Errors & Failing Tests
QA-Bots: Review Pull Request
```

Results open as a **Markdown Preview** panel beside your code.

---

### Step 5 — Review the Output

Example output from `/QA-sanity`:

```
## QA Sanity Report

### ✅ Passed
- package.json found with lock file
- All imports resolve correctly

### ⚠️ Warnings
- 3 TODO comments found in critical paths

### ❌ Failed
- Missing .env.example file

### Recommendation
Add .env.example to document required environment variables...
```

---

### Step 6 — (Optional) Customise a Prompt

The QA prompts are plain Markdown files bundled with the extension at `commands/*.md`. To customise for your project, copy the relevant file to your workspace:

```
.claude/commands/QA-automate.md   ← edit this to always use Pytest
```

Or run **QA-Bots: Install Claude Code Commands** from the Command Palette to copy all five files at once.

---

## Settings Reference

| Setting | Default | Description |
|---|---|---|
| `qa-bots.aiBackend` | `vscode-lm` | `vscode-lm` · `openai` · `claude-code` |
| `qa-bots.vscodeLmFamily` | `""` | Preferred model family (e.g. `gpt-4o`, `claude-sonnet`) |
| `qa-bots.openaiApiKey` | `""` | Your OpenAI secret key |
| `qa-bots.openaiModel` | `gpt-4o` | OpenAI model to call |
| `qa-bots.autoInstallOnActivation` | `true` | Auto-copy `.md` files (claude-code mode only) |
| `qa-bots.testFramework` | `auto` | Force a test framework for `/QA-automate` |

---

## Requirements

- Node.js 18+
- VS Code 1.90.0 or later
- One of: GitHub Copilot · OpenAI API key · Claude Code CLI

---

## Development

```bash
npm install
npm run compile        # one-off TypeScript build
npm run watch          # watch mode during development
npm run package        # produce .vsix bundle
```
