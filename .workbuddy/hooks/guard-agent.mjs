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

const payload = readPayload();
const input = payload.tool_input || payload.toolInput || {};
const subagentType = String(input.subagent_type || input.subagentType || '');

if (subagentType === 'builder-strong') {
  process.stdout.write(JSON.stringify({
    continue: true,
    hookSpecificOutput: { permissionDecision: 'ask' },
    systemMessage: 'builder-strong là gate cứng: chỉ gọi sau khi user phê duyệt rõ (tương đương permission.task.builder-strong = ask của opencode).',
  }));
}

process.exit(0);
