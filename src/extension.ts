import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

// Names of all QA-Bot skill files bundled with the extension
const QA_COMMANDS = [
  'QA-sanity',
  'QA-regression',
  'QA-automate',
  'QA-debug',
  'QA-reviewPR',
] as const;

type QACommand = (typeof QA_COMMANDS)[number];

// Destination inside the user's workspace
const CLAUDE_COMMANDS_DIR = path.join('.claude', 'commands');

/**
 * Copy all bundled QA skill markdown files into the active workspace's
 * .claude/commands/ directory so Claude Code can pick them up as slash commands.
 */
async function installClaudeCommands(
  context: vscode.ExtensionContext,
  silent = false
): Promise<void> {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    if (!silent) {
      vscode.window.showWarningMessage(
        'QA-Bots: No workspace folder is open. Open a folder first, then run this command again.'
      );
    }
    return;
  }

  const workspaceRoot = workspaceFolders[0].uri.fsPath;
  const targetDir = path.join(workspaceRoot, CLAUDE_COMMANDS_DIR);

  // Ensure .claude/commands/ exists
  fs.mkdirSync(targetDir, { recursive: true });

  // Source directory: extension-root/commands/
  const sourceDir = path.join(context.extensionPath, 'commands');

  let installed = 0;
  let skipped = 0;

  for (const name of QA_COMMANDS) {
    const sourceFile = path.join(sourceDir, `${name}.md`);
    const targetFile = path.join(targetDir, `${name}.md`);

    if (!fs.existsSync(sourceFile)) {
      vscode.window.showWarningMessage(
        `QA-Bots: Could not find bundled command file for ${name}. Please reinstall the extension.`
      );
      continue;
    }

    // Never silently overwrite files that the user may have customised
    if (fs.existsSync(targetFile)) {
      skipped++;
      continue;
    }

    fs.copyFileSync(sourceFile, targetFile);
    installed++;
  }

  if (!silent || installed > 0) {
    const msg =
      installed > 0
        ? `QA-Bots: Installed ${installed} Claude Code command(s) into ${CLAUDE_COMMANDS_DIR}.${
            skipped > 0 ? ` (${skipped} already existed — not overwritten)` : ''
          }`
        : `QA-Bots: All commands already present in ${CLAUDE_COMMANDS_DIR}. Nothing to install.`;

    vscode.window.showInformationMessage(msg);
  }
}

/**
 * Build a short hint telling the user how to invoke a QA-Bot command inside
 * Claude Code, optionally including the current file context.
 */
function buildHint(command: QACommand, activeFile?: string): string {
  const slash = `/${command}`;
  const fileHint = activeFile ? ` (active file: ${path.basename(activeFile)})` : '';
  return `Open Claude Code and run: ${slash}${fileHint}`;
}

export function activate(context: vscode.ExtensionContext): void {
  const config = vscode.workspace.getConfiguration('qa-bots');
  const autoInstall = config.get<boolean>('autoInstallOnActivation', true);

  if (autoInstall) {
    // Run silently on startup so we don't spam the user every launch
    installClaudeCommands(context, true);
  }

  // ── Install command ──────────────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand('qa-bots.install', () =>
      installClaudeCommands(context, false)
    )
  );

  // ── Individual QA command launchers ─────────────────────────────────────
  const registerQACommand = (id: string, qaCommand: QACommand) => {
    context.subscriptions.push(
      vscode.commands.registerCommand(id, () => {
        const activeFile = vscode.window.activeTextEditor?.document.fileName;
        const hint = buildHint(qaCommand, activeFile);
        vscode.window.showInformationMessage(hint, 'Open Terminal').then((choice) => {
          if (choice === 'Open Terminal') {
            vscode.commands.executeCommand('workbench.action.terminal.new');
          }
        });
      })
    );
  };

  registerQACommand('qa-bots.sanity', 'QA-sanity');
  registerQACommand('qa-bots.regression', 'QA-regression');
  registerQACommand('qa-bots.automate', 'QA-automate');
  registerQACommand('qa-bots.debug', 'QA-debug');
  registerQACommand('qa-bots.reviewPR', 'QA-reviewPR');
}

export function deactivate(): void {}
