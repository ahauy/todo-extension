#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HOME = process.env.HOME || '';

const PATHS = {
  agentsSource: path.join(ROOT, '.opencode/agent'),
  commandsSource: path.join(ROOT, '.opencode/command'),
  skillsSource: path.join(ROOT, 'skills'),
  projectSkills: path.join(ROOT, '.workbuddy-ai/skills'),
  commands: path.join(ROOT, '.codebuddy/commands'),
  settings: path.join(ROOT, '.codebuddy/settings.json'),
  marketplace: path.join(ROOT, '.workbuddy/marketplace'),
  plugin: path.join(ROOT, '.workbuddy/marketplace/todo-extension-workflow'),
  pluginAgents: path.join(ROOT, '.workbuddy/marketplace/todo-extension-workflow/agents'),
  manifest: path.join(ROOT, '.workbuddy/adapter-manifest.json'),
  hooks: path.join(ROOT, '.workbuddy/hooks'),
  userPlugins: path.join(HOME, '.workbuddy-ai/plugins'),
};

const PLUGIN_KEY = 'todo-extension-workflow@todo-extension-local';
const MARKETPLACE_KEY = 'todo-extension-local';
const VERSION = '0.1.0';

const AGENT_META = {
  builder: {
    color: 'blue',
    tools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
    trigger: 'Implement một task feature hoặc bug đã được giao, đặc biệt khi chạy trong worktree song song.',
    examples: [
      ['Dispatcher vừa giao một task file', 'Implement layer-2/task-03', 'Dùng agent builder để đọc task, viết code/test, verify rồi commit trong worktree.'],
      ['Cần sửa một bug đã có repro', 'Fix bug popup blank', 'Dùng agent builder để áp root cause fix tối thiểu và chạy verify commands.'],
    ],
  },
  'builder-strong': {
    color: 'purple',
    tools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
    trigger: 'Chỉ implement khi user đã phê duyệt rõ việc dùng builder mạnh; không tự ý gọi.',
    examples: [
      ['User yêu cầu rõ dùng builder mạnh', 'Dùng builder-strong cho task này', 'Xác nhận đã có approval rồi mới dùng agent builder-strong.'],
      ['Task khó nhưng user chưa duyệt', 'Task này khó quá', 'Không gọi builder-strong; hỏi xác nhận trước.'],
    ],
  },
  'change-request': {
    color: 'amber',
    tools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash', 'Agent'],
    trigger: 'Xử lý mọi thay đổi hậu-build từ spec/changes: classify, spec delta, phase/task, builder/reviewer, publish, archive.',
    examples: [
      ['User gõ /change hoặc /bug hoặc /feature', '/change', 'Dùng agent change-request để đọc mọi change pending rồi điều phối.'],
      ['Có change doc pending trong spec/changes', 'Xử lý FEAT-003', 'Dùng agent change-request, giữ checkpoint duyệt plan.'],
    ],
  },
  design: {
    color: 'pink',
    tools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash', 'AskUserQuestion'],
    trigger: 'Sinh design tokens và screen spec sau brainstorm, hoặc khi chạy /design.',
    examples: [
      ['Đã duyệt design doc và cần tokens', 'Tiếp tục design', 'Dùng agent design, hỏi reference từng câu một rồi chờ confirm tokens.'],
      ['User gõ /design', '/design', 'Dùng agent design để cập nhật design-spec.md và tokens.'],
    ],
  },
  graph: {
    color: 'purple',
    tools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash', 'AskUserQuestion'],
    trigger: 'Chia spec và design thành layer/task theo dependency, sinh diagram và progress.json.',
    examples: [
      ['Spec và design đã sẵn sàng', 'Chia task', 'Dùng agent graph để tạo tasks/<slug>/layer-*.md rồi dừng chờ duyệt plan.'],
      ['User gõ /graph', '/graph', 'Dùng agent graph để chạy lại hoặc điều chỉnh kế hoạch.'],
    ],
  },
  reviewer: {
    color: 'cyan',
    tools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
    trigger: 'Review độc lập một diff/task sau builder; chỉ ghi report, không sửa source.',
    examples: [
      ['Builder vừa hoàn thành task', 'Review task này', 'Dùng agent reviewer để chọn FAST/NORMAL/STRICT và ghi review report.'],
      ['Cần phase review', 'Soát phase 2', 'Dùng agent reviewer với cấu hình review level phù hợp.'],
    ],
  },
  'spec-init': {
    color: 'green',
    tools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
    trigger: 'Project đã có code nhưng chưa có spec; reverse-engineer SPECIFICATIONS.md một lần.',
    examples: [
      ['Repo cũ chưa có spec', '/spec-init', 'Dùng agent spec-init để scan code và dựng spec kèm R-xx.'],
      ['Bắt đầu /start mà chưa có spec', 'Chưa có SPECIFICATIONS.md', 'Dùng agent spec-init trước khi validate.'],
    ],
  },
  'spec-publisher': {
    color: 'green',
    tools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
    trigger: 'Phát hành spec delta: bump version, ghi updates/CHANGELOG và test-scope/current.json.',
    examples: [
      ['Vừa xong feature hoặc bug fix', 'Publish spec', 'Dùng agent spec-publisher để tăng specVersion/scopeVersion.'],
      ['User gõ /spec-publish', '/spec-publish', 'Dùng agent spec-publisher để chạy lại thủ công.'],
    ],
  },
  'spec-validator': {
    color: 'yellow',
    tools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
    trigger: 'Cross-check spec vs code/docs hoặc review một phase; chỉ ghi report.',
    examples: [
      ['Vừa sinh spec hoặc spec delta', 'Validate spec', 'Dùng agent spec-validator, tối đa 2 vòng.'],
      ['Kết thúc một layer/phase', 'Phase review', 'Dùng agent spec-validator để ra PASS/FAIL.'],
    ],
  },
};

const SOURCE_FILES = [
  'AGENTS.md',
  'opencode.jsonc',
  ...listFiles(PATHS.agentsSource).map((f) => path.relative(ROOT, f)),
  ...listFiles(PATHS.commandsSource).map((f) => path.relative(ROOT, f)),
  ...listFiles(path.join(ROOT, '.agent')).map((f) => path.relative(ROOT, f)),
  ...listFiles(PATHS.skillsSource).map((f) => path.relative(ROOT, f)),
  ...listFiles(path.join(ROOT, '.opencode/plugins')).map((f) => path.relative(ROOT, f)),
  ...listFiles(path.join(ROOT, '.claude')).map((f) => path.relative(ROOT, f)),
  ...listFiles(path.join(ROOT, 'scripts')).filter((f) => !f.endsWith('workbuddy-adapter.mjs')).map((f) => path.relative(ROOT, f)),
];

function listFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.DS_Store') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(full));
    else out.push(full);
  }
  return out.sort();
}

function ensureInsideRoot(target) {
  const rel = path.relative(ROOT, target);
  if (rel.startsWith('..') || path.isAbsolute(rel)) throw new Error(`Refusing path outside repo: ${target}`);
}

function resetGeneratedDir(dir) {
  ensureInsideRoot(dir);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

function copyDir(src, dest) {
  ensureInsideRoot(dest);
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.name === '.DS_Store') continue;
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

function splitFrontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  return match ? { frontmatter: match[1], body: match[2] } : { frontmatter: '', body: text };
}

function fmValue(frontmatter, key) {
  const match = frontmatter.match(new RegExp(`^${key}:\\s*(.*)$`, 'm'));
  return match ? match[1].trim() : '';
}

function quoteYamlList(values) {
  return `[${values.map((v) => `"${v}"`).join(', ')}]`;
}

function exampleBlock(context, user, assistant) {
  return [
    '  <example>',
    `  Context: ${context}`,
    `  user: "${user}"`,
    `  assistant: "${assistant}"`,
    '  <commentary>',
    '  Trigger đúng vai trò này; giữ nguyên gate và artifact của workflow gốc.',
    '  </commentary>',
    '  </example>',
  ].join('\n');
}

function transformAgentBody(body, name) {
  return body
    .replaceAll('`.opencode/agent/`', '`agents/` trong plugin WorkBuddy')
    .replaceAll('.opencode/agent/', 'agents/')
    .replaceAll('opencode', 'WorkBuddy')
    .replaceAll('`task` tool', '`Agent` tool')
    .replace(
      /^Bạn là \*\*([^*]+)\*\*/m,
      `> File này được sinh từ \`.opencode/agent/${name}.md\` — sửa nguồn rồi chạy \`node scripts/workbuddy-adapter.mjs sync\`. Không sửa trực tiếp.\n\nBạn là **$1**`,
    );
}

function syncAgents() {
  resetGeneratedDir(PATHS.pluginAgents);
  const files = listFiles(PATHS.agentsSource).filter((f) => f.endsWith('.md'));
  for (const file of files) {
    const name = path.basename(file, '.md');
    const meta = AGENT_META[name];
    if (!meta) throw new Error(`Missing WorkBuddy metadata for agent: ${name}`);
    const raw = fs.readFileSync(file, 'utf8');
    const { body } = splitFrontmatter(raw);
    const description = [
      `  ${meta.trigger} Examples:`,
      ...meta.examples.flatMap(([c, u, a]) => exampleBlock(c, u, a).split('\n')),
    ].join('\n');
    const output = [
      '---',
      `name: ${name}`,
      'description: |',
      description,
      '  Không dùng cho task ngoài phạm vi luật `AGENTS.md` và `.agent/`.',
      'model: inherit',
      `color: ${meta.color}`,
      `tools: ${quoteYamlList(meta.tools)}`,
      '---',
      '',
      transformAgentBody(body, name).trim(),
      '',
    ].join('\n');
    fs.writeFileSync(path.join(PATHS.pluginAgents, `${name}.md`), output);
  }
  return files.length;
}

function syncCommands() {
  resetGeneratedDir(PATHS.commands);
  const files = listFiles(PATHS.commandsSource).filter((f) => f.endsWith('.md'));
  for (const file of files) {
    const name = path.basename(file, '.md');
    const raw = fs.readFileSync(file, 'utf8');
    const { frontmatter } = splitFrontmatter(raw);
    const sourceDescription = fmValue(frontmatter, 'description') || `WorkBuddy wrapper cho /${name}`;
    const output = [
      '---',
      `description: ${sourceDescription}`,
      '---',
      '',
      `> Wrapper WorkBuddy. Nguồn canonical: \`.opencode/command/${name}.md\`. Không sửa wrapper này.`,
      '',
      `Đọc \`.opencode/command/${name}.md\` trước khi hành động, rồi thực thi đúng nội dung trong đó.`,
      'Giữ nguyên mọi human checkpoint và artifact path của workflow gốc.',
      '',
      'Ánh xạ runtime khi cần:',
      '- `task` / subagent của opencode → tool `Agent` với tên agent tương ứng.',
      '- `usage()` → đọc `.context/session-policy.json` và `.context/runs/` thay vì API plugin opencode.',
      '- permission `bash` của `opencode.jsonc` → hook `.workbuddy/hooks/guard-bash.mjs`.',
      '- model cụ thể của opencode → tham số `model` khi gọi Agent, nếu runtime hỗ trợ.',
      '',
      'Không ghi đè file canonical trừ khi user yêu cầu rõ.',
      '',
    ].join('\n');
    fs.writeFileSync(path.join(PATHS.commands, `${name}.md`), output);
  }
  return files.length;
}

function syncSkills() {
  resetGeneratedDir(PATHS.projectSkills);
  const dirs = fs.readdirSync(PATHS.skillsSource, { withFileTypes: true }).filter((e) => e.isDirectory() && e.name !== '.DS_Store');
  for (const dir of dirs) copyDir(path.join(PATHS.skillsSource, dir.name), path.join(PATHS.projectSkills, dir.name));
  return dirs.length;
}

function writeJson(file, value) {
  ensureInsideRoot(file);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function syncConfig() {
  const hook = (script, timeout = 10) => ({
    hooks: [{ type: 'command', command: `node .workbuddy/hooks/${script}`, timeout }],
  });
  const rootHook = (script, timeout = 10) => ({
    hooks: [{ type: 'command', command: `node ${script}`, timeout }],
  });

  writeJson(PATHS.settings, {
    PreToolUse: [
      { matcher: 'Bash', ...hook('guard-bash.mjs') },
      { matcher: 'Agent', ...hook('guard-agent.mjs') },
      { matcher: 'Agent|Task|SendMessage', ...rootHook('.claude/hooks/live-studio.mjs', 5) },
    ],
    PostToolUse: [{ matcher: 'Agent|Task|SendMessage', ...rootHook('.claude/hooks/live-studio.mjs', 5) }],
    SubagentStop: [rootHook('.claude/hooks/live-studio.mjs', 5)],
    UserPromptSubmit: [rootHook('.claude/hooks/live-studio.mjs', 5)],
    Stop: [rootHook('.claude/hooks/live-studio.mjs', 5)],
    PreCompact: [hook('session-handoff.mjs')],
  });

  const marketplaceManifest = {
    name: MARKETPLACE_KEY,
    description: 'Local WorkBuddy adapter for the todo-extension opencode workflow',
    owner: { name: 'todo-extension' },
    plugins: [
      {
        name: 'todo-extension-workflow',
        description: 'Exposes the canonical opencode subagents as WorkBuddy agents',
        version: VERSION,
        source: './todo-extension-workflow',
      },
    ],
  };
  writeJson(path.join(PATHS.marketplace, '.codebuddy-plugin/marketplace.json'), marketplaceManifest);

  const pluginManifest = {
    name: 'todo-extension-workflow',
    version: VERSION,
    description: 'Adapter that mirrors .opencode/agent/*.md into WorkBuddy subagents',
    agents: ['./agents'],
  };
  writeJson(path.join(PATHS.plugin, '.codebuddy-plugin/plugin.json'), pluginManifest);
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function syncManifest() {
  const files = SOURCE_FILES.filter((f) => fs.existsSync(path.join(ROOT, f)));
  const hashes = {};
  for (const rel of files) hashes[rel] = sha256(path.join(ROOT, rel));
  writeJson(PATHS.manifest, {
    generatedAt: new Date().toISOString(),
    adapterVersion: VERSION,
    sourceHashes: hashes,
  });
  return files.length;
}

function sync() {
  const agentCount = syncAgents();
  const commandCount = syncCommands();
  const skillCount = syncSkills();
  syncConfig();
  const sourceCount = syncManifest();
  console.log(`sync: ${agentCount} agents, ${commandCount} commands, ${skillCount} skills, ${sourceCount} canonical files tracked`);
}

function parseJsonSafe(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function hookDecision(script, payload) {
  const result = spawnSync(process.execPath, [path.join(PATHS.hooks, script)], {
    input: JSON.stringify(payload),
    encoding: 'utf8',
  });
  if (result.error) return '';
  try {
    return JSON.parse(result.stdout || '{}').hookSpecificOutput?.permissionDecision || 'allow';
  } catch {
    return 'allow';
  }
}

function validate() {
  const failures = [];
  const canonicalAgents = listFiles(PATHS.agentsSource).filter((f) => f.endsWith('.md'));
  const generatedAgents = listFiles(PATHS.pluginAgents).filter((f) => f.endsWith('.md'));
  const canonicalCommands = listFiles(PATHS.commandsSource).filter((f) => f.endsWith('.md'));
  const generatedCommands = listFiles(PATHS.commands).filter((f) => f.endsWith('.md'));
  const canonicalSkills = fs.readdirSync(PATHS.skillsSource, { withFileTypes: true }).filter((e) => e.isDirectory() && e.name !== '.DS_Store');
  const generatedSkills = fs.readdirSync(PATHS.projectSkills, { withFileTypes: true }).filter((e) => e.isDirectory());

  if (canonicalAgents.length !== generatedAgents.length) failures.push(`agent count ${canonicalAgents.length} != ${generatedAgents.length}`);
  if (canonicalCommands.length !== generatedCommands.length) failures.push(`command count ${canonicalCommands.length} != ${generatedCommands.length}`);
  if (canonicalSkills.length !== generatedSkills.length) failures.push(`skill count ${canonicalSkills.length} != ${generatedSkills.length}`);

  for (const file of generatedAgents) {
    const text = fs.readFileSync(file, 'utf8');
    const { frontmatter } = splitFrontmatter(text);
    for (const key of ['name', 'description', 'model', 'color', 'tools']) {
      if (!frontmatter.includes(`${key}:`)) failures.push(`${path.basename(file)} missing ${key}`);
    }
  }

  for (const rel of ['settings', 'manifest', 'hooks'].map((k) => PATHS[k])) {
    if (rel.endsWith('.json') && !fs.existsSync(rel)) failures.push(`missing ${rel}`);
  }

  const parsedSettings = parseJsonSafe(PATHS.settings, null);
  if (!parsedSettings) failures.push('.codebuddy/settings.json is not valid JSON');
  else {
    for (const event of ['PreToolUse', 'PostToolUse', 'SubagentStop', 'UserPromptSubmit', 'Stop', 'PreCompact']) {
      if (!parsedSettings[event]) failures.push(`settings missing event ${event}`);
    }
  }

  for (const script of ['guard-bash.mjs', 'guard-agent.mjs', 'session-handoff.mjs']) {
    if (!fs.existsSync(path.join(PATHS.hooks, script))) failures.push(`missing hook ${script}`);
  }

  if (fs.existsSync(path.join(PATHS.hooks, 'guard-bash.mjs'))) {
    const bashCases = [
      ['git push origin main', 'deny'],
      ['git push --force origin staging', 'deny'],
      ['git reset --hard HEAD', 'deny'],
      ['git checkout -- src/x.ts', 'deny'],
      ['pnpm db:reset', 'deny'],
      ['git status --short', 'allow'],
    ];
    for (const [command, expected] of bashCases) {
      const actual = hookDecision('guard-bash.mjs', { tool_input: { command } });
      if (actual !== expected) failures.push(`guard-bash ${command}: expected ${expected}, got ${actual || 'no output'}`);
    }
  }
  if (fs.existsSync(path.join(PATHS.hooks, 'guard-agent.mjs'))) {
    const actual = hookDecision('guard-agent.mjs', { tool_input: { subagent_type: 'builder-strong' } });
    if (actual !== 'ask') failures.push(`guard-agent builder-strong: expected ask, got ${actual || 'no output'}`);
  }

  const manifest = parseJsonSafe(PATHS.manifest, null);
  if (!manifest?.sourceHashes) failures.push('adapter manifest missing sourceHashes');
  else {
    for (const [rel, hash] of Object.entries(manifest.sourceHashes)) {
      const full = path.join(ROOT, rel);
      if (!fs.existsSync(full) || sha256(full) !== hash) failures.push(`canonical file changed since sync: ${rel}`);
    }
  }

  if (failures.length) {
    for (const failure of failures) console.error(`FAIL  ${failure}`);
    process.exitCode = 1;
    console.error('validate: FAILED');
    return;
  }
  console.log('validate: OK (counts, frontmatter, hook decisions, canonical hashes)');
}

function backupAndWriteJson(file, value) {
  if (fs.existsSync(file)) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    fs.copyFileSync(file, `${file}.bak-${stamp}`);
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function install() {
  sync();
  validate();
  if (process.exitCode) return;

  const now = new Date().toISOString();
  const marketplaceFile = path.join(PATHS.userPlugins, 'known_marketplaces.json');
  const installedFile = path.join(PATHS.userPlugins, 'installed_plugins.json');
  const configuredFile = path.join(PATHS.userPlugins, 'configured-plugins.json');
  const settingsFile = path.join(HOME, '.workbuddy-ai/settings.json');

  const marketplaces = parseJsonSafe(marketplaceFile, {});
  marketplaces[MARKETPLACE_KEY] = {
    manifestName: MARKETPLACE_KEY,
    type: 'directory',
    source: { source: 'directory', path: PATHS.marketplace },
    installLocation: PATHS.marketplace,
    description: 'Local WorkBuddy adapter for todo-extension (source: repository)',
    lastUpdated: now,
    autoUpdate: false,
  };
  backupAndWriteJson(marketplaceFile, marketplaces);

  const installed = parseJsonSafe(installedFile, { version: 2, plugins: {} });
  installed.plugins ||= {};
  installed.plugins[PLUGIN_KEY] = [
    {
      scope: 'user',
      installPath: PATHS.plugin,
      version: VERSION,
      installedAt: now,
      lastUpdated: now,
    },
  ];
  backupAndWriteJson(installedFile, installed);

  const configured = parseJsonSafe(configuredFile, { version: 1, builtInMarketPlugins: [] });
  configured.builtInMarketPlugins ||= [];
  if (!configured.builtInMarketPlugins.some((p) => p.name === 'todo-extension-workflow' && p.marketplaceName === MARKETPLACE_KEY)) {
    configured.builtInMarketPlugins.push({
      name: 'todo-extension-workflow',
      marketplaceName: MARKETPLACE_KEY,
      scope: 'user',
    });
  }
  backupAndWriteJson(configuredFile, configured);

  const settings = parseJsonSafe(settingsFile, {});
  settings.enabledPlugins ||= {};
  settings.enabledPlugins[PLUGIN_KEY] = true;
  backupAndWriteJson(settingsFile, settings);

  console.log(`install: registered ${PLUGIN_KEY}`);
  console.log('install: restart WorkBuddy so commands, agents and hooks are loaded');
}

const command = process.argv[2] || 'sync';
if (command === 'sync') sync();
else if (command === 'validate') validate();
else if (command === 'install') install();
else {
  console.error('usage: node scripts/workbuddy-adapter.mjs <sync|validate|install>');
  process.exit(1);
}
