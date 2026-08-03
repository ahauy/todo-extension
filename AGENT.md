# AGENT.md — AI-Powered Project Template

## What Is This?

This is a **model-agnostic**, multi-agent project template designed for building web applications (React + Node.js). Any AI coding assistant that can read markdown and execute commands can use this template.

## Architecture

The system uses 4 patterns working together:

- **Event-Driven**: Each phase triggers the next automatically
- **Graph**: Tasks are organized in dependency layers — Layer N+1 only unlocks when Layer N passes review
- **Loop (ReAct)**: Each task follows Read → Plan → Code → Test → Fix cycles
- **Blackboard**: Shared state in `.context/` allows any agent to resume from where things left off

## Agents

| Agent | File | Role |
|-------|------|------|
| Brainstorm | `.agent/brainstorm.md` | Gather requirements, configure git & models |
| Spec Validator | `.agent/spec-validator.md` | Validate SPECIFICATIONS.md against requirements |
| Graph | `.agent/graph.md` | Decompose spec into layered tasks |
| Loop | `.agent/loop.md` | Execute tasks (ReAct pattern) |
| Reviewer | `.agent/reviewer.md` | Independent code review (different model) |
| Error Analyzer | `.agent/error-analyzer.md` | Root cause analysis + pattern learning |
| Context Manager | `.agent/context-manager.md` | Context compression when window fills |
| Rollback | `.agent/rollback.md` | Git checkpoint + revert strategy |
| DevOps | `.agent/devops.md` | Git init, CI/CD, deploy |

## Workflow

```
BRIEF.md → Brainstorm → SPECIFICATIONS.md → Spec Validate
    ↓ (PASS)
Graph → tasks/layer-0/ → tasks/layer-1/ → ...
    ↓
Loop (per task) → Code → Test → Error Analyzer (if fail)
    ↓ (PASS)
Reviewer → PASS → DevOps (commit/deploy) → Next Task
    ↓ (FAIL)
Loop (with feedback) → retry
```

### Phase 0: Load Context
1. Read `BRIEF.md` — project overview
2. Read `SPECIFICATIONS.md` — detailed requirements (if exists)
3. Read `.context/progress.json` — resume point (if exists)
4. Read `.context/decisions.md` — past architectural decisions (if exists)

### Phase 1: Brainstorm (`.agent/brainstorm.md`)
- Interactive Q&A with user about project requirements
- Stack, database, auth, deployment, UI, design reference, etc.
- Output: populated `SPECIFICATIONS.md` + `.context/brainstorm-log.md`
- **After completing → MUST proceed to Phase 2 (Spec Validation)**

### Phase 2: Spec Validation (`.agent/spec-validator.md`) ← MANDATORY
- Validate `SPECIFICATIONS.md` for completeness and consistency
- Check for conflicts, missing configs, ambiguous requirements
- **PASS** → proceed to Phase 3 (Task Graph)
- **FAIL** → return to Phase 1 (Brainstorm) with specific gaps listed, then re-validate

### Phase 3: Task Graph (`.agent/graph.md`)
- Decompose specs into dependency-ordered layers
- Write task files to `tasks/` directory
- Each task: clear scope, inputs, outputs, acceptance criteria

### Phase 4: Execution Loop (`.agent/loop.md`)
- Pick next task from graph (lowest unlocked layer)
- Implement with TDD where appropriate
- Update `.context/progress.json` after each task
- Handle errors via `.agent/error-analyzer.md`

### Phase 5: Review (`.agent/reviewer.md`)
- Code quality, security, performance
- Uses `REVIEWER_MODEL` (different provider to avoid bias)
- Write reports to `.context/review-reports/`
- **PASS** → proceed to DevOps
- **FAIL** → return to Loop with feedback

### Phase 6: DevOps (`.agent/devops.md`)
- Git commit, push, CI/CD
- Deploy to configured platform

## Resume Protocol

If `.context/progress.json` exists and `status !== "not_started"`:
1. Read progress state
2. Read blackboard for current context
3. Resume at the recorded phase/task
4. Do NOT re-run completed phases

## Getting Started (New Project)

1. Fill in `BRIEF.md` with your project idea
2. Copy `.env.local.example` → `.env.local`
3. Tell your AI assistant: **"Read AGENT.md and start the project"**
4. The assistant will run `.agent/brainstorm.md` → spec-validator → graph automatically

## Resuming a Project

1. Tell your AI assistant: **"Read AGENT.md and resume the project"**
2. The assistant reads `.context/progress.json` and continues from the last checkpoint

## Model Configuration

Models are configured in `.env.local`. Use **different providers** for different roles to avoid bias:

```
CODING_MODEL=claude-opus-4-6          # Writes code
REVIEWER_MODEL=gpt-5.4                # Reviews code (different provider!)
SPEC_VALIDATOR_MODEL=deepseek-v4-pro  # Validates specs (yet another provider!)
```

## Directory Structure

```
├── AGENT.md              ← You are here
├── BRIEF.md              ← Your project idea
├── SPECIFICATIONS.md     ← Generated spec (after brainstorm)
├── .env.local            ← Git/model/deploy config (git-ignored)
├── .agent/               ← Agent workflows
├── skills/react-nodejs/  ← Stack conventions & patterns
├── tasks/                ← Generated task files
├── .devops/              ← Deploy templates
└── .context/             ← Shared state (progress, decisions, errors)
```
