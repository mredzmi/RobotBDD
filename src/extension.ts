import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { QACommandName, runQACommand, runQACommandInChat } from './runner';

const CLAUDE_COMMANDS_DIR = path.join('.claude', 'commands');

const QA_COMMANDS: { id: string; name: QACommandName }[] = [
  { id: 'qa-bots.sanity',     name: 'QA-sanity' },
  { id: 'qa-bots.regression', name: 'QA-regression' },
  { id: 'qa-bots.automate',   name: 'QA-automate' },
  { id: 'qa-bots.debug',      name: 'QA-debug' },
  { id: 'qa-bots.reviewPR',   name: 'QA-reviewPR' },
];

// Chat participant sub-command → QA command name mapping
const CHAT_CMD_MAP: Record<string, QACommandName> = {
  sanity:     'QA-sanity',
  regression: 'QA-regression',
  automate:   'QA-automate',
  debug:      'QA-debug',
  reviewPR:   'QA-reviewPR',
};

export function activate(context: vscode.ExtensionContext): void {

  // ── 1. Chat Participant (@qa-bots in any VS Code AI chat panel) ─────────────
  const participant = vscode.chat.createChatParticipant(
    'qa-bots.assistant',
    async (
      request: vscode.ChatRequest,
      _chatContext: vscode.ChatContext,
      response: vscode.ChatResponseStream,
      token: vscode.CancellationToken
    ) => {
      const commandName = CHAT_CMD_MAP[request.command ?? ''];

      if (!commandName) {
        response.markdown(
          [
            'Hi! I\'m **QA-Bots**. Use one of my sub-commands:',
            '',
            '| Command | What it does |',
            '|---|---|',
            '| `/sanity` | Health-check your project |',
            '| `/regression` | Find regression risks in recent changes |',
            '| `/automate` | Generate tests for the active file |',
            '| `/debug` | Root-cause an error or stack trace |',
            '| `/reviewPR` | Review the current branch as a PR |',
            '',
            'Example: `@qa-bots /debug TypeError: Cannot read id`',
          ].join('\n')
        );
        return;
      }

      await runQACommandInChat(
        context,
        commandName,
        request.prompt,
        response,
        request.model,
        token
      );
    }
  );

  participant.iconPath = vscode.Uri.joinPath(context.extensionUri, 'images', 'icon.png');
  context.subscriptions.push(participant);

  // ── 2. Command Palette commands ─────────────────────────────────────────────
  for (const { id, name } of QA_COMMANDS) {
    context.subscriptions.push(
      vscode.commands.registerCommand(id, async () => {
        // For debug, prompt the user to paste their error first
        let userInput: string | undefined;
        if (name === 'QA-debug') {
          userInput = await vscode.window.showInputBox({
            title: 'QA-Bots: Debug',
            prompt: 'Paste your error message or stack trace (or leave blank to analyse the active file)',
            placeHolder: 'TypeError: Cannot read properties of undefined…',
          });
          if (userInput === undefined) return; // user cancelled
        }
        await runQACommand(context, name, userInput);
      })
    );
  }

  // ── 3. Install Claude Code command files (for claude-code backend users) ────
  context.subscriptions.push(
    vscode.commands.registerCommand('qa-bots.install', () =>
      installClaudeCommands(context, false)
    )
  );

  // Auto-install on startup when backend is claude-code
  const config = vscode.workspace.getConfiguration('qa-bots');
  const backend = config.get<string>('aiBackend', 'vscode-lm');
  const autoInstall = config.get<boolean>('autoInstallOnActivation', true);
  if (backend === 'claude-code' && autoInstall) {
    installClaudeCommands(context, true);
  }
}

export function deactivate(): void {}

// ── Claude Code skill file installer ─────────────────────────────────────────

function installClaudeCommands(
  context: vscode.ExtensionContext,
  silent: boolean
): void {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders) {
    if (!silent) {
      vscode.window.showWarningMessage('QA-Bots: No workspace folder open.');
    }
    return;
  }

  const targetDir = path.join(folders[0].uri.fsPath, CLAUDE_COMMANDS_DIR);
  fs.mkdirSync(targetDir, { recursive: true });

  const sourceDir = path.join(context.extensionPath, 'commands');
  let installed = 0;
  let skipped = 0;

  for (const { name } of QA_COMMANDS) {
    const src = path.join(sourceDir, `${name}.md`);
    const dst = path.join(targetDir, `${name}.md`);
    if (!fs.existsSync(src)) continue;
    if (fs.existsSync(dst)) { skipped++; continue; }
    fs.copyFileSync(src, dst);
    installed++;
  }

  if (!silent || installed > 0) {
    const msg =
      installed > 0
        ? `QA-Bots: Installed ${installed} Claude Code command(s) into ${CLAUDE_COMMANDS_DIR}.${
            skipped > 0 ? ` (${skipped} already existed)` : ''
          }`
        : `QA-Bots: All Claude Code commands already present — nothing to install.`;
    vscode.window.showInformationMessage(msg);
  }
}
