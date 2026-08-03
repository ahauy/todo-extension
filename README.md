# AI-Powered Project Template (Web)

> Multi-agent architecture for building web applications with React + Node.js

## Architecture

This template uses an **Event-Driven + Graph + Loop + Blackboard** architecture where multiple specialized AI agents collaborate to build your project:

| Agent | Role | File |
|-------|------|------|
| **Brainstorm** | Gathers requirements interactively | `.agent/brainstorm.md` |
| **Spec Validator** | Validates specifications completeness | `.agent/spec-validator.md` |
| **Graph Planner** | Decomposes work into dependency layers | `.agent/graph.md` |
| **Loop (Builder)** | Implements tasks using ReAct pattern | `.agent/loop.md` |
| **Reviewer** | Independent code review (different model) | `.agent/reviewer.md` |
| **Error Analyzer** | Root cause analysis + pattern learning | `.agent/error-analyzer.md` |
| **Context Manager** | Manages context window efficiently | `.agent/context-manager.md` |
| **Rollback** | Git checkpoint + recovery strategy | `.agent/rollback.md` |
| **DevOps** | Git setup, CI/CD, deployment | `.agent/devops.md` |
| **Blackboard** | State tracking + session resume | `.agent/blackboard.md` |

## Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  BRIEF.md → Brainstorm → Spec Validate → Graph → Loop → Review │
│       ↑                        ↑                   ↑       │    │
│       │         FAIL ──────────┘      Error ───────┘       │    │
│       │                                                    ↓    │
│       └──── Resume (blackboard) ←──── DevOps → Deploy ─────    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

1. **BRIEF** — User fills project brief
2. **Brainstorm** — Agent asks clarifying questions (stack, auth, DB, deploy...)
3. **Spec Validate** — Cross-checks SPECIFICATIONS vs brainstorm answers
4. **Graph** — Decomposes into layers with dependency ordering
5. **Loop** — Builds each task (plan → code → test → fix)
6. **Review** — Independent agent reviews code quality
7. **DevOps** — Git management, CI/CD, deployment
8. **Deploy** — Ship to production with health checks

## Quick Start — New Project

1. **Fill** `BRIEF.md` with your project idea
2. **Run** the agent entry point: open `AGENT.md`
3. **Follow** the brainstorm questions (answer one at a time)
4. **Configure** `.env.local` with your git token and model choices
5. **Let it build** — the agents handle the rest

```bash
# 1. Copy this template
git clone git@github.com:ocanhdt12-gif/opencode-project-template.git my-project
cd my-project

# 2. Setup your environment
cp .env.local.example .env.local
# Edit .env.local with your tokens and model preferences

# 3. Fill your brief
# Edit BRIEF.md with your project idea

# 4. Start building
# Open AGENT.md and follow instructions
```

## Resume — Existing Project

If your session was interrupted:

1. The agent reads `.context/progress.json` automatically
2. It resumes from the last completed task
3. Error memory is preserved in `.context/error-memory.md`
4. All decisions logged in `.context/decisions.md`

## Directory Structure

```
.
├── AGENT.md                    ← Start here (entry point)
├── BRIEF.md                    ← Your project brief
├── SPECIFICATIONS.md           ← Generated specifications
├── .env.local.example          ← Environment template
├── .gitignore
│
├── .agent/                     ← Agent behavior definitions
│   ├── brainstorm.md           ← Requirements gathering
│   ├── graph.md                ← Task decomposition
│   ├── loop.md                 ← Task execution (ReAct)
│   ├── blackboard.md           ← State & resume
│   ├── reviewer.md             ← Code review agent
│   ├── spec-validator.md       ← Specification validation
│   ├── error-analyzer.md       ← Error pattern learning
│   ├── context-manager.md      ← Context optimization
│   ├── rollback.md             ← Git checkpoint strategy
│   └── devops.md               ← Git, CI/CD, deploy
│
├── skills/react-nodejs/        ← Stack-specific knowledge
│   ├── conventions.md          ← Coding style & structure
│   ├── stack.md                ← Libraries & versions
│   ├── patterns.md             ← API, auth, DB patterns
│   └── common-errors.md        ← Known errors + fixes
│
├── tasks/                      ← Generated task files
│   └── README.md               ← Task structure guide
│
├── .devops/                    ← Deployment configs
│   ├── templates/              ← Platform templates
│   │   ├── vercel.md
│   │   ├── railway.md
│   │   ├── docker-vps.md
│   │   └── generic.md
│   └── environments.md
│
└── .context/                   ← Runtime state (auto-managed)
    ├── progress.json           ← Current progress
    ├── decisions.md            ← Architecture decisions
    ├── error-memory.md         ← Error patterns
    ├── brainstorm-log.md       ← Q&A log
    └── review-reports/         ← Code review outputs
```

## Supported Models

Configure in `.env.local`. Using different providers for different roles reduces bias:

### Anthropic (via AIHub)
| Model | Best For |
|-------|----------|
| `claude-sonnet-4-6` | Balanced coding tasks |
| `claude-opus-4-6` | Complex reasoning + architecture |
| `claude-opus-4-8` | Most capable, heavy tasks |

### OpenAI (via AIHub)
| Model | Best For |
|-------|----------|
| `gpt-5.5` | Strong general purpose |
| `gpt-5.4` | Balanced coding + review |
| `gpt-5.3-codex` | Specialized code generation |

### DeepSeek (via Huawei MAAS)
| Model | Best For |
|-------|----------|
| `deepseek-v4-pro` | Strong reasoning + validation |
| `deepseek-v4-flash` | Fast iteration, cost-effective |
| `glm-5.2` | Lightweight tasks |

### Recommended Combination
- **CODING_MODEL:** `claude-opus-4-6` (strong architecture + code)
- **REVIEWER_MODEL:** `gpt-5.4` (different perspective for review)
- **SPEC_VALIDATOR_MODEL:** `deepseek-v4-pro` (independent validation)

## Design Principles

- **Model-Agnostic** — Works with any LLM that can follow markdown instructions
- **Layered Execution** — Dependencies enforced by graph, no race conditions
- **Error Learning** — Mistakes are logged and prevented from recurring
- **Human Checkpoints** — Critical decisions require human approval
- **Git Safety** — Every task committed, every layer tagged, rollback always available
- **Multi-Model** — Different agents use different models to reduce systematic bias

## License

MIT
