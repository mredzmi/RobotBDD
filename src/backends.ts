import * as vscode from 'vscode';
import * as https from 'https';

export type BackendId = 'vscode-lm' | 'openai' | 'claude-code';

// ── VS Code Language Model API (GitHub Copilot, Claude, Gemini, any VS Code AI) ──

export async function runWithVSCodeLM(
  prompt: string,
  token: vscode.CancellationToken
): Promise<string> {
  const config = vscode.workspace.getConfiguration('qa-bots');
  const family = config.get<string>('vscodeLmFamily', '');

  const selector: vscode.LanguageModelChatSelector = family ? { family } : {};
  const models = await vscode.lm.selectChatModels(selector);

  if (models.length === 0) {
    throw new Error(
      'No AI model found in VS Code. Install GitHub Copilot, the Claude extension, ' +
      'or another VS Code AI provider — then try again.'
    );
  }

  const model = models[0];
  const messages = [vscode.LanguageModelChatMessage.User(prompt)];
  const response = await model.sendRequest(messages, {}, token);

  let result = '';
  for await (const chunk of response.text) {
    result += chunk;
  }
  return result;
}

// Stream version used by the chat participant
export async function streamWithVSCodeLM(
  prompt: string,
  stream: vscode.ChatResponseStream,
  token: vscode.CancellationToken,
  model: vscode.LanguageModelChat
): Promise<void> {
  const messages = [vscode.LanguageModelChatMessage.User(prompt)];
  const response = await model.sendRequest(messages, {}, token);
  for await (const chunk of response.text) {
    stream.markdown(chunk);
  }
}

// ── OpenAI API ───────────────────────────────────────────────────────────────

export async function runWithOpenAI(prompt: string): Promise<string> {
  const config = vscode.workspace.getConfiguration('qa-bots');
  const apiKey = config.get<string>('openaiApiKey', '').trim();
  const model = config.get<string>('openaiModel', 'gpt-4o');

  if (!apiKey) {
    throw new Error(
      'OpenAI API key is not set. Go to VS Code Settings → search "QA-Bots" → ' +
      'enter your key in "qa-bots.openaiApiKey".'
    );
  }

  const body = JSON.stringify({
    model,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 4096,
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.openai.com',
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              reject(new Error(`OpenAI: ${parsed.error.message}`));
            } else {
              resolve(parsed.choices[0].message.content as string);
            }
          } catch (e) {
            reject(e);
          }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── Claude Code CLI (install .md files, show hint) ───────────────────────────

export function claudeCodeHint(commandName: string): string {
  return [
    `## Claude Code Mode`,
    ``,
    `Your Claude Code skill files are installed in \`.claude/commands/\`.`,
    ``,
    `Open a terminal in your project root and run:`,
    ``,
    `\`\`\`bash`,
    `claude`,
    `\`\`\``,
    ``,
    `Then type the slash command:`,
    ``,
    `\`\`\``,
    `/${commandName}`,
    `\`\`\``,
  ].join('\n');
}
