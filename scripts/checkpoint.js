#!/usr/bin/env node

/**
 * Checkpoint Generator
 * 
 * Generates CHECKPOINT.md after each layer completion
 * Includes: git log, completed tasks, architecture, decisions, API contracts
 * 
 * Usage: npm run checkpoint
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CHECKPOINT_FILE = 'CHECKPOINT.md';
const TASKS_DIR = 'tasks';
const DONE_FILE = path.join(TASKS_DIR, 'done.md');

// Get current layer from git branch or environment
function getCurrentLayer() {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
    const match = branch.match(/layer-(\d+)/);
    return match ? match[1] : 'current';
  } catch {
    return 'current';
  }
}

// Get git log for current layer
function getGitLog() {
  try {
    // Get commits since last checkpoint or last tag
    const log = execSync(
      'git log --oneline --decorate -20',
      { encoding: 'utf-8' }
    ).trim();
    return log || 'No commits yet';
  } catch {
    return 'Unable to fetch git log';
  }
}

// Read completed tasks from done.md
function getCompletedTasks() {
  try {
    if (!fs.existsSync(DONE_FILE)) {
      return 'No completed tasks yet';
    }
    const content = fs.readFileSync(DONE_FILE, 'utf-8');
    return content || 'No completed tasks yet';
  } catch {
    return 'Unable to read completed tasks';
  }
}

// Read current layer tasks
function getCurrentLayerTasks() {
  try {
    const layer = getCurrentLayer();
    const todoFile = path.join(TASKS_DIR, `layer-${layer}-todo.md`);
    
    if (!fs.existsSync(todoFile)) {
      return 'No tasks file found';
    }
    
    const content = fs.readFileSync(todoFile, 'utf-8');
    return content || 'No tasks in current layer';
  } catch {
    return 'Unable to read current layer tasks';
  }
}

// Generate checkpoint content
function generateCheckpoint() {
  const timestamp = new Date().toISOString();
  const layer = getCurrentLayer();
  const gitLog = getGitLog();
  const completedTasks = getCompletedTasks();
  const currentTasks = getCurrentLayerTasks();

  const checkpoint = `# 🔖 Checkpoint — Layer ${layer}

**Generated:** ${timestamp}

---

## 📊 Git Log (Recent Commits)

\`\`\`
${gitLog}
\`\`\`

---

## ✅ Completed Tasks

${completedTasks}

---

## 📋 Current Layer Tasks

${currentTasks}

---

## 🏗️ Architecture

[Add architecture diagram or description here]

---

## 🎯 Key Decisions

- **Decision 1:** [Rationale]
- **Decision 2:** [Rationale]

---

## 📡 API Contracts

### Example Function Signature
\`\`\`typescript
// Input/Output types
interface Request {
  // ...
}

interface Response {
  // ...
}
\`\`\`

---

## ⚠️ Known Issues & Solutions

- **Issue 1:** [Description] → [Solution]
- **Issue 2:** [Description] → [Solution]

---

## 📝 Notes

- Context reduced by ~70-80% using this checkpoint
- Load this checkpoint for next layer instead of full history
- Update this file manually with architecture, decisions, and API contracts

---

**Next Steps:**
1. Review this checkpoint
2. Update architecture, decisions, and API contracts sections
3. Commit: \`git add CHECKPOINT.md && git commit -m "docs: checkpoint after layer ${layer}"\`
4. Start next layer with this checkpoint as context
`;

  return checkpoint;
}

// Main
function main() {
  try {
    const checkpoint = generateCheckpoint();
    fs.writeFileSync(CHECKPOINT_FILE, checkpoint, 'utf-8');
    console.log(`✅ Checkpoint generated: ${CHECKPOINT_FILE}`);
    console.log('📝 Please update the following sections manually:');
    console.log('   - Architecture');
    console.log('   - Key Decisions');
    console.log('   - API Contracts');
    console.log('   - Known Issues & Solutions');
  } catch (error) {
    console.error('❌ Error generating checkpoint:', error.message);
    process.exit(1);
  }
}

main();
