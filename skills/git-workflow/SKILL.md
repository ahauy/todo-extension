---
name: git-workflow
description: "Git workflow best practices including conventional commits, branch naming, PR/MR process, merge strategies, and team collaboration patterns."
origin: codex-project-template
---

# Git Workflow Skill

Comprehensive guide for professional Git workflows, commit conventions, and team collaboration.

## When to Use

Invoke this skill:
- When starting a new project or joining a team
- When creating commits or branches
- When preparing a PR/MR for review
- When resolving merge conflicts
- When managing releases and versioning
- When establishing team Git conventions

## Commit Conventions (Conventional Commits)

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type

| Type | Purpose | Example |
|------|---------|---------|
| **feat** | New feature | `feat(auth): add login form` |
| **fix** | Bug fix | `fix(api): handle null response` |
| **docs** | Documentation | `docs(readme): update setup steps` |
| **style** | Code style (no logic change) | `style(button): fix indentation` |
| **refactor** | Code refactor | `refactor(store): simplify selector logic` |
| **perf** | Performance improvement | `perf(image): optimize lazy loading` |
| **test** | Add/update tests | `test(form): add validation tests` |
| **chore** | Build, deps, config | `chore(deps): upgrade react to 19` |
| **ci** | CI/CD changes | `ci(github): add coverage check` |

### Scope (Optional)

Scope is the area of code affected:
- `auth`, `api`, `ui`, `store`, `hooks`, `utils`, `config`, etc.
- Keep it short and specific
- Use lowercase

### Subject

- Imperative mood: "add" not "added" or "adds"
- Don't capitalize first letter
- No period at end
- Max 50 characters
- Be specific and descriptive

### Body (Optional)

- Explain **what** and **why**, not **how**
- Wrap at 72 characters
- Separate from subject with blank line
- Use bullet points for multiple changes

### Footer (Optional)

Reference issues and breaking changes:

```
Fixes #123
Closes #456
BREAKING CHANGE: removed deprecated API
```

### Examples

**Good commits:**
```
feat(auth): add two-factor authentication

- Implement TOTP-based 2FA
- Add backup codes generation
- Update user settings UI

Fixes #234
```

```
fix(api): handle timeout errors gracefully

Previously, timeout errors would crash the app.
Now we show a user-friendly error message and retry.

Fixes #567
```

```
refactor(store): extract user selectors

Move user-related selectors to separate file
for better organization and reusability.
```

**Bad commits:**
```
❌ fixed stuff
❌ WIP
❌ asdf
❌ Updated files
❌ feat: add login form and update navbar and fix button styles
```

## Branch Naming

### Format

```
<type>/<issue-id>-<description>
```

### Type

| Type | Purpose | Example |
|------|---------|---------|
| **feature** | New feature | `feature/123-user-profile` |
| **bugfix** | Bug fix | `bugfix/456-login-error` |
| **hotfix** | Production fix | `hotfix/789-payment-crash` |
| **refactor** | Code refactor | `refactor/cleanup-store` |
| **docs** | Documentation | `docs/update-readme` |
| **chore** | Maintenance | `chore/upgrade-deps` |

### Rules

- Use lowercase
- Use hyphens to separate words (not underscores)
- Include issue ID if available
- Keep it short but descriptive
- Delete branch after merge

### Examples

```
✅ feature/123-add-dark-mode
✅ bugfix/456-fix-form-validation
✅ hotfix/789-payment-timeout
✅ refactor/simplify-api-client

❌ Feature/AddDarkMode
❌ feature_add_dark_mode
❌ feature/add-dark-mode-and-update-navbar-and-fix-button
```

## Pull Request / Merge Request Process

### Before Creating PR

1. **Update from main**
   ```bash
   git fetch origin
   git rebase origin/main
   ```

2. **Run checks locally**
   ```bash
   npm run lint
   npm run type-check
   npm run test
   npm run build
   ```

3. **Verify no secrets**
   ```bash
   git diff origin/main | grep -E "sk-|api_key|password|token"
   ```

### PR Title

Follow commit convention:
```
feat(auth): add two-factor authentication
fix(api): handle timeout errors
docs(readme): update setup steps
```

### PR Description Template

```markdown
## Description
Brief summary of changes.

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Fixes #123
Closes #456

## Changes Made
- Change 1
- Change 2
- Change 3

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests pass locally
- [ ] Coverage maintained (80%+)
- [ ] No secrets committed
```

### PR Review Checklist

**For Reviewers:**
- [ ] Code is readable and maintainable
- [ ] Logic is correct and handles edge cases
- [ ] Tests are adequate (80%+ coverage)
- [ ] No performance regressions
- [ ] No security issues
- [ ] Follows project conventions
- [ ] Documentation is updated
- [ ] Commit messages are clear

**For Authors:**
- [ ] Respond to all comments
- [ ] Request re-review after changes
- [ ] Don't force-push after review started
- [ ] Keep PR focused (one feature per PR)
- [ ] Keep PR size reasonable (<400 lines)

### Merge Strategies

#### 1. Squash and Merge (Recommended for features)
```bash
git merge --squash feature/123-add-dark-mode
git commit -m "feat(ui): add dark mode"
```

**Pros:**
- Clean history
- One commit per feature
- Easy to revert

**Cons:**
- Loses individual commit history

**Use when:** Feature has many small commits

#### 2. Rebase and Merge (Recommended for bugfixes)
```bash
git rebase origin/main
git merge --ff-only feature/456-fix-bug
```

**Pros:**
- Linear history
- Each commit is meaningful
- Easy to bisect

**Cons:**
- Rewrites history (don't use on shared branches)

**Use when:** Commits are well-organized and meaningful

#### 3. Create a Merge Commit (Use rarely)
```bash
git merge --no-ff feature/789-refactor
```

**Pros:**
- Preserves branch history
- Clear merge points

**Cons:**
- Cluttered history
- Harder to read

**Use when:** Merging long-lived branches

### Merge Conflict Resolution

**When conflicts occur:**

1. **Identify conflicts**
   ```bash
   git status
   ```

2. **Open conflicted files**
   ```
   <<<<<<< HEAD
   your changes
   =======
   their changes
   >>>>>>> branch-name
   ```

3. **Resolve manually**
   - Keep your changes, their changes, or both
   - Remove conflict markers
   - Test thoroughly

4. **Complete merge**
   ```bash
   git add .
   git commit -m "merge: resolve conflicts with main"
   git push origin feature/branch
   ```

**Best practices:**
- Communicate with team before resolving
- Test after resolving
- Don't blindly accept either side
- Review the final result carefully

## Workflow Examples

### Feature Development

```bash
# 1. Create feature branch
git checkout -b feature/123-add-dark-mode

# 2. Make changes and commit
git add src/components/ThemeToggle.tsx
git commit -m "feat(ui): add theme toggle component"

git add src/hooks/useTheme.ts
git commit -m "feat(hooks): add useTheme hook"

# 3. Push to remote
git push -u origin feature/123-add-dark-mode

# 4. Create PR on GitHub/GitLab
# (via web UI)

# 5. After approval, merge
git checkout main
git pull origin main
git merge --squash feature/123-add-dark-mode
git commit -m "feat(ui): add dark mode support"
git push origin main

# 6. Delete branch
git branch -d feature/123-add-dark-mode
git push origin --delete feature/123-add-dark-mode
```

### Hotfix for Production

```bash
# 1. Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/789-payment-crash

# 2. Fix the issue
git add src/api/payment.ts
git commit -m "fix(payment): handle null response"

# 3. Push and create PR
git push -u origin hotfix/789-payment-crash

# 4. After approval, merge to main
git checkout main
git merge --ff-only hotfix/789-payment-crash
git push origin main

# 5. Also merge to develop (if exists)
git checkout develop
git merge --ff-only hotfix/789-payment-crash
git push origin develop

# 6. Delete hotfix branch
git branch -d hotfix/789-payment-crash
git push origin --delete hotfix/789-payment-crash
```

### Rebase and Update

```bash
# 1. Fetch latest changes
git fetch origin

# 2. Rebase on main
git rebase origin/main

# 3. If conflicts, resolve them
# (edit files, then)
git add .
git rebase --continue

# 4. Force push (only on your own branch!)
git push origin feature/123-add-dark-mode --force-with-lease
```

## Team Conventions

### Commit Message Style

**Choose one and stick with it:**

**Option A: Conventional Commits (Recommended)**
```
feat(auth): add login form
fix(api): handle timeout
```

**Option B: Emoji Prefix**
```
✨ feat: add login form
🐛 fix: handle timeout
📚 docs: update readme
```

**Option C: Jira-style**
```
PROJ-123: Add login form
PROJ-456: Fix timeout error
```

### Branch Protection Rules

Set up on GitHub/GitLab:
- Require PR reviews (at least 1)
- Require status checks to pass (lint, test, build)
- Require branches to be up to date
- Dismiss stale PR approvals
- Require code review from code owners

### Release Workflow

**Semantic Versioning: MAJOR.MINOR.PATCH**

```bash
# 1. Create release branch
git checkout -b release/1.2.0

# 2. Update version in package.json
npm version minor

# 3. Update CHANGELOG.md
# (document all changes)

# 4. Commit and tag
git commit -m "chore: release 1.2.0"
git tag -a v1.2.0 -m "Release version 1.2.0"

# 5. Push
git push origin release/1.2.0
git push origin v1.2.0

# 6. Create PR, review, merge to main
# 7. Also merge back to develop
```

## Common Mistakes

### ❌ Mistake 1: Large commits mixing multiple concerns
```bash
# BAD
git commit -m "update stuff"
# (contains auth changes, UI changes, and API changes)

# GOOD
git commit -m "feat(auth): add login form"
git commit -m "feat(ui): update navbar"
git commit -m "fix(api): handle errors"
```

### ❌ Mistake 2: Committing secrets
```bash
# BAD
git add .env
git commit -m "add env file"

# GOOD
echo ".env" >> .gitignore
git add .gitignore
git commit -m "chore: add .env to gitignore"
```

### ❌ Mistake 3: Force pushing to shared branches
```bash
# BAD
git push origin main --force

# GOOD
git push origin feature/123-add-dark-mode --force-with-lease
```

### ❌ Mistake 4: Vague commit messages
```bash
# BAD
git commit -m "fix"
git commit -m "update"
git commit -m "WIP"

# GOOD
git commit -m "fix(form): validate email before submit"
git commit -m "refactor(store): simplify selector logic"
```

### ❌ Mistake 5: Not updating from main before PR
```bash
# BAD
git push origin feature/123-add-dark-mode
# (main has moved forward)

# GOOD
git fetch origin
git rebase origin/main
git push origin feature/123-add-dark-mode
```

## Checklist Before Pushing

- [ ] Branch name follows convention: `type/issue-id-description`
- [ ] Commits follow conventional commits format
- [ ] No secrets in commits (API keys, tokens, passwords)
- [ ] All tests pass locally
- [ ] Linting passes
- [ ] Type checking passes
- [ ] Build succeeds
- [ ] Commits are logical and atomic
- [ ] Commit messages are clear and descriptive
- [ ] Branch is up to date with main
- [ ] PR description is complete and clear

## Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git Documentation](https://git-scm.com/doc)
- [GitHub Flow Guide](https://guides.github.com/introduction/flow/)
- [Semantic Versioning](https://semver.org/)
