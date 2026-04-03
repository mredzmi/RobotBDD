import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as cp from 'child_process';
import {
  BackendId,
  runWithVSCodeLM,
  runWithOpenAI,
  claudeCodeHint,
  streamWithVSCodeLM,
} from './backends';

export type QACommandName =
  | 'QA-sanity'
  | 'QA-regression'
  | 'QA-automate'
  | 'QA-debug'
  | 'QA-reviewPR';

// ── Main entry point for Command Palette commands ─────────────────────────────

export async function runQACommand(
  context: vscode.ExtensionContext,
  command: QACommandName,
  userInput?: string
): Promise<void> {
  const workspaceRoot = getWorkspaceRoot();
  if (!workspaceRoot) {
    vscode.window.showErrorMessage('QA-Bots: Open a workspace folder first.');
    return;
  }

  const prompt = buildPrompt(context, command, workspaceRoot, userInput);
  if (!prompt) return;

  const backend = getBackend();

  if (backend === 'claude-code') {
    showResult(context, command, claudeCodeHint(command));
    return;
  }

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `QA-Bots: Running ${command} via ${backendLabel(backend)}…`,
      cancellable: true,
    },
    async (_, token) => {
      try {
        let result: string;
        if (backend === 'openai') {
          result = await runWithOpenAI(prompt);
        } else {
          result = await runWithVSCodeLM(prompt, token);
        }
        showResult(context, command, result);
      } catch (err: any) {
        vscode.window.showErrorMessage(`QA-Bots: ${err.message}`);
      }
    }
  );
}

// ── Entry point for the @qa-bots Chat Participant ─────────────────────────────

export async function runQACommandInChat(
  context: vscode.ExtensionContext,
  command: QACommandName,
  userInput: string,
  chatStream: vscode.ChatResponseStream,
  chatModel: vscode.LanguageModelChat,
  token: vscode.CancellationToken
): Promise<void> {
  const workspaceRoot = getWorkspaceRoot();
  if (!workspaceRoot) {
    chatStream.markdown('❌ No workspace folder is open. Please open a project first.');
    return;
  }

  const prompt = buildPrompt(context, command, workspaceRoot, userInput);
  if (!prompt) {
    chatStream.markdown('❌ Could not load the QA prompt file. Try reinstalling the extension.');
    return;
  }

  chatStream.markdown(`### ${command}\n\n`);
  try {
    await streamWithVSCodeLM(prompt, chatStream, token, chatModel);
  } catch (err: any) {
    chatStream.markdown(`\n\n❌ **Error:** ${err.message}`);
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildPrompt(
  context: vscode.ExtensionContext,
  command: QACommandName,
  workspaceRoot: string,
  userInput?: string
): string {
  const promptPath = path.join(context.extensionPath, 'commands', `${command}.md`);
  if (!fs.existsSync(promptPath)) {
    vscode.window.showErrorMessage(
      `QA-Bots: Prompt file missing for ${command}. Try reinstalling the extension.`
    );
    return '';
  }

  const basePrompt = fs.readFileSync(promptPath, 'utf-8');
  const contextBlock = gatherContext(command, workspaceRoot, userInput);
  return `${basePrompt}\n\n---\n\n## Live Workspace Context\n\n${contextBlock}`;
}

function gatherContext(
  command: QACommandName,
  workspaceRoot: string,
  userInput?: string
): string {
  const parts: string[] = [];

  if (userInput?.trim()) {
    parts.push(`### User Input\n${userInput.trim()}`);
  }

  // Active file content — most useful for automate and debug
  const activeEditor = vscode.window.activeTextEditor;
  if (activeEditor && (command === 'QA-automate' || command === 'QA-debug')) {
    const relPath = path.relative(workspaceRoot, activeEditor.document.fileName);
    const content = activeEditor.document.getText().slice(0, 4000);
    parts.push(`### Active File: \`${relPath}\`\n\`\`\`\n${content}\n\`\`\``);
  }

  // Git diff — useful for regression and PR review
  if (command === 'QA-regression' || command === 'QA-reviewPR') {
    try {
      const diff = cp.execSync(
        'git diff HEAD~1 HEAD --stat 2>/dev/null || git diff --cached --stat',
        { cwd: workspaceRoot, encoding: 'utf-8', timeout: 5000 }
      );
      if (diff.trim()) {
        parts.push(`### Recent Git Diff (stat)\n\`\`\`\n${diff.trim()}\n\`\`\``);
      }
      const fullDiff = cp.execSync(
        'git diff HEAD~1 HEAD 2>/dev/null || git diff --cached',
        { cwd: workspaceRoot, encoding: 'utf-8', timeout: 5000 }
      ).slice(0, 6000);
      if (fullDiff.trim()) {
        parts.push(`### Full Diff (truncated to 6000 chars)\n\`\`\`diff\n${fullDiff.trim()}\n\`\`\``);
      }
    } catch {
      parts.push('### Git Diff\n_Could not run git diff — is this a git repository?_');
    }
  }

  // package.json — useful for sanity check
  if (command === 'QA-sanity') {
    const pkgPath = path.join(workspaceRoot, 'package.json');
    if (fs.existsSync(pkgPath)) {
      parts.push(
        `### package.json\n\`\`\`json\n${fs.readFileSync(pkgPath, 'utf-8').slice(0, 2000)}\n\`\`\``
      );
    }
    const reqPath = path.join(workspaceRoot, 'requirements.txt');
    if (fs.existsSync(reqPath)) {
      parts.push(
        `### requirements.txt\n\`\`\`\n${fs.readFileSync(reqPath, 'utf-8').slice(0, 1000)}\n\`\`\``
      );
    }
  }

  return parts.length > 0 ? parts.join('\n\n') : '_No additional context gathered._';
}

function showResult(
  context: vscode.ExtensionContext,
  command: QACommandName,
  markdown: string
): void {
  // Open result as a markdown document and show its preview
  const title = `${command} — QA-Bots Result`;
  vscode.workspace
    .openTextDocument({ language: 'markdown', content: `# ${title}\n\n${markdown}` })
    .then((doc) => vscode.commands.executeCommand('markdown.showPreviewToSide', doc.uri));
}

function getWorkspaceRoot(): string | undefined {
  return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
}

function getBackend(): BackendId {
  return vscode.workspace
    .getConfiguration('qa-bots')
    .get<BackendId>('aiBackend', 'vscode-lm');
}

function backendLabel(backend: BackendId): string {
  const labels: Record<BackendId, string> = {
    'vscode-lm': 'VS Code AI',
    openai: 'OpenAI',
    'claude-code': 'Claude Code',
  };
  return labels[backend];
}
