#!/usr/bin/env node
import fs from 'node:fs';

function readPayload() {
  try {
    const raw = fs.readFileSync(0, 'utf8');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function deny(reason) {
  process.stdout.write(JSON.stringify({
    continue: false,
    hookSpecificOutput: { permissionDecision: 'deny' },
    systemMessage: `workbuddy-adapter: ${reason}`,
  }));
  process.exit(0);
}

function pushSegment(command) {
  const match = command.match(/\bgit\s+push\b[\s\S]*$/);
  return match ? match[0] : '';
}

const payload = readPayload();
const input = payload.tool_input || payload.toolInput || {};
const command = String(input.command || '');

if (!command.trim()) process.exit(0);

const push = pushSegment(command);
if (push) {
  if (/^git\s+push\s*$/.test(push)) deny('bare git push bị chặn; dùng `git push origin <target_branch>`');
  if (/^git\s+push\s+origin\s*$/.test(push)) deny('thiếu target branch; dùng `git push origin <target_branch>`');
  if (/\bmain\b/.test(push)) deny('push tới main/ref main bị chặn bởi project-config.forbidden_branch');
  if (/\s--(?:all|mirror)\b/.test(push) || /\s--(?:all|mirror)=/.test(push)) deny('push aggregate/mirror bị chặn');
  if (/\+refs\/heads\//.test(push) || /refs\/heads\/[^:]+:refs\/heads\//.test(push)) deny('push refspec force/aggregate bị chặn');
  if (/--force\b|(?:\s|^)-f(?:\s|$)/.test(push)) deny('force push bị chặn');
  if (/origin\s+--delete\b|origin\s+:/.test(push)) deny('xóa remote branch bị chặn');
}

if (/\bgit\s+reset\s+--hard\b/.test(command)) deny('git reset --hard bị chặn; dùng git revert');
if (/\bgit\s+checkout\s+--/.test(command)) deny('git checkout -- bị chặn; dùng git restore có kiểm soát');

const destructive = [
  /prisma\s+db\s+push/i,
  /drizzle-kit\s+push/i,
  /prisma\s+migrate\s+reset/i,
  /prisma\s+db\s+seed/i,
  /supabase\s+db\s+reset/i,
  /db:(?:push|reset|seed)\b/i,
];
if (destructive.some((pattern) => pattern.test(command))) deny('DB destructive shortcut bị chặn; dùng migration versioned');

process.exit(0);
