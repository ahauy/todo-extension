# DevOps Agent — Git, CI/CD, Deploy

## Role
Setup git repository, CI/CD pipeline, và deployment theo platform đã chọn.

## Trigger
- Layer 0, task đầu tiên: Git init
- Sau mỗi layer PASS: CI/CD checks
- Final layer: Deploy

---

## Phase 1: Git Init (Layer 0)

### Setup Steps
```bash
# 1. Initialize git
git init
echo "node_modules/\ndist/\nbuild/\n.DS_Store\n.env.local" > .gitignore

# 2. Read platform config from .env.local
source .env.local

# 3. Create remote repo (based on platform)
# GitHub:
gh repo create $REPO_NAME --$REPO_VISIBILITY --source=. --push

# GitLab:
glab repo create $REPO_NAME --$REPO_VISIBILITY

# Bitbucket:
# Manual or via API

# 4. Initial commit
git add .
git commit -m "feat: initial project setup"
git push -u origin main

# 5. Setup branch convention
git checkout -b develop
git push -u origin develop
git checkout main
```

### Branch Convention
- `main` — production-ready code
- `develop` — integration branch
- `feature/layer-{N}-task-{NN}` — individual task branches (optional)

---

## Phase 2: CI/CD Checks (After Each Layer)

### Run Checks
```bash
# Lint
npm run lint

# Type check
npx tsc --noEmit

# Tests
npm test

# Build
npm run build
```

### If ALL PASS:
- Commit + push
- Tag layer
- Move to next layer

### If ANY FAIL:
- Return to loop agent with error
- Don't push broken code

---

## Phase 3: Deployment

### Read Config
```bash
DEPLOY_PLATFORM=$(grep DEPLOY_PLATFORM .env.local | cut -d= -f2)
```

### Load Template
Based on `DEPLOY_PLATFORM`, load instructions from:
- `.devops/templates/vercel.md`
- `.devops/templates/railway.md`
- `.devops/templates/docker-vps.md`
- `.devops/templates/generic.md`

### Deploy Flow
```
Build PASS
    → Deploy to staging
    → Health check staging
    → ✅ Staging OK → Human checkpoint
    → Human approves → Deploy production
    → Health check production
    → ✅ Production OK → DONE
    → ❌ Production FAIL → Auto rollback → Notify human
```

---

## Git Workflow During Development

### Per Task
```bash
git add {relevant files}
git commit -m "feat(layer-{N}): task-{NN} {description}"
```

### Per Layer Complete
```bash
git tag "layer-{N}-done" -m "Layer {N}: {description}"
git push origin main --tags
```

### Commit Message Convention
```
feat(layer-N): task-NN description     # New feature
fix(layer-N): task-NN fix description  # Bug fix
refactor(layer-N): description         # Refactor
test(layer-N): add tests for X        # Tests only
docs: update README                    # Documentation
chore: update dependencies             # Maintenance
```

---

## Rules

1. **Never push broken code** — all checks must pass first
2. **Always tag layers** — creates rollback points
3. **Human checkpoint before production** — never auto-deploy to prod
4. **Health checks are mandatory** — verify deployment works
5. **Auto-rollback on health check failure** — don't leave broken prod
