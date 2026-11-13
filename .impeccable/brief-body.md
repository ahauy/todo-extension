# Surface brief — Học Đường (Popup + New Tab)

## Scope & mode
Two surfaces, one product: the 360×560 toolbar Popup and the full-window New Tab board.
Mode: **Operate**. A student captures a task in seconds and stamps it done; expression never
obscures the task, its state, or a familiar affordance.

## Audience, job, proof, constraints
Vietnamese students, on a laptop, in daylight or under a desk lamp, often mid-study-session.
Job: write one task fast, see what is due today, close it with a seal, keep a study rhythm.
Proof: the real task store (chrome.storage.sync), real deadlines, real completion marks.
Constraints: MV3, no network at runtime, no new permissions beyond storage/alarms/notifications,
popup opens fast, Vietnamese diacritics must never clip, light tone only.

## Direction contract

THESIS: A student's paper notebook, not a project board. One task is one scroll of paper;
finishing it presses a vermilion seal instead of striking the text through. Refuses the
category default of a white card list with a blue accent and a checkbox column.

OWN-WORLD: Eggshell-ivory canvas (#f6ebd3) with lacquer surfaces one step brighter, gold
double-rule frames, vermilion (#b8381c) reserved for the single primary action and the seal,
brown/umber ink for text. Cormorant Garamond headings, EB Garamond body at 17px, Pirata One
drop caps, Dancing Script only inside the quill field. Hand-drawn 1.5px stroke icons, lotus
and cloud ornaments, eggshell-inlay grain at 3%.

STORY: The visitor reads the greeting, sees today's count, writes a task with a quill that
inks each committed character, watches a new scroll unfurl, presses XONG and sees the seal
strike once, then keeps a Pomodoro session and a seven-day lotus streak.

FIRST VIEWPORT: Popup — 56px header with the lamp mark and three round buttons; the quill row
with GHI beside it; the ribbon tabs; the scroll list; a fixed 76px footer carrying the 96px
dial and seven lotus cells. New Tab — a 1280px double-framed board: 240px bookshelf of subject
spines, a 640px column opening on a 56px greeting with a 72px drop cap and an arched study
window, then the quill and the scrolls; a 320px desk with the 220px dial, streak and maxim;
a one-line colophon closes it.

FORM: The brief pins the world (docs/DESIGN.md, authored by the user). No concept tournament:
a user-pinned direction beats the roll. Build path is code-led — no approved comp exists; the
ambition lives in this FIRST VIEWPORT block and the signature interaction below.

SIGNATURE INTERACTION: the quill. A real `<input>` keeps IME, paste, undo and screen readers;
an aria-hidden ink layer soaks each committed character (opacity + 1px blur, 180ms) and dries
brown→ink over 800ms, while a 28px nib rides the caret, taps 2px per character, and lifts to
rest after 600ms idle. During Telex/VNI composition nothing animates — the composing text is
only underlined in sepia.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the
verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Unresolved decisions
- The manifest cannot un-override the new tab page at runtime. In Popup mode the override page
  renders a quiet greeting instead of the board, and Settings tells the user how to hand the
  tab back to the browser. Disclosed to the user.
- Sound defaults off per DESIGN.md's Known Gaps; a visible bell toggle sits in both headers.