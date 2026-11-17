#!/usr/bin/env node
process.stdout.write(JSON.stringify({
  continue: true,
  systemMessage: [
    'Session handoff (bắt buộc): sau compact phải re-read Run Journal `.context/runs/<type>-<slug>-<phaseTask>.md` từ đĩa trước khi tiếp tục.',
    'Đĩa là sự thật; `.context/progress.json` chỉ là hint. Xem `AGENTS.md` § Session Handoff.',
  ].join(' '),
}));
process.exit(0);
