---
name: resume
description: "Làm tiếp việc đang dở từ session trước: đọc Run Journal (.context/runs/) của activeWorkItem → reconcile với đĩa (git status/log, evidence) → in Resume Briefing → thực hiện next. KHÔNG classify/phase-plan lại. Trigger: /resume, 'làm tiếp', 'resume', 'tiếp tục việc dở'."
---

# /resume — bridge từ opencode command

1. Đọc TOÀN BỘ `.opencode/command/resume.md` và làm theo đúng protocol trong đó.
2. Đĩa là sự thật, pointer là hint — reconcile `git status --short`, `git log --oneline`, evidence report trước khi làm.
3. Adapt cho Qoder: subagent opencode (`task` tool) → Agent tool của Qoder hoặc thực thi inline.
4. Redo policy: bước bị cancel → redo nguyên bước trên đĩa (đọc file + git diff trước khi sửa), không revert.
