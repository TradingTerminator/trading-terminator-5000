# V8.03 — Handelssession, HTF preparation and delayed learning

## Delivered flow

- Handelssession displays its start date and time in Europe/Berlin, including seconds. The preparation action confirms preparation and opens Trade preparation.
- The end-session panel appears after the current-session trade list, never below preparation. Home provides a direct “Trades & Handelssession” destination, including a zero-trade session that the user wants to end.
- Session mood reacts to low focus (1–3), high pressure, fatigue or urge (7–10). These are explicit product thresholds, not a clinical assessment. It asks whether the user feels able to act with concentration and discipline; conscious continuation is possible. No negative-rating trading lock is introduced.
- HTF sequence: News/Macro → Sentiment → Technical direction and observations → Recognizable setup with real catalog/reference image selection → Screenshots → Confirm preparation.
- “Beachtet” records examination separately from the actual observation. Unchecked criteria are not silently turned into observed signals. No recognizable setup and an unclear/neutral bias are valid analysis outcomes.
- Additional technical points can be added to the current analysis; Settings stores the owner's reusable template for future analyses. Current and historical saved definitions are preserved.
- Each confirmed HTF stand has a server-created timestamp and an immutable original plan/setup snapshot. Its direction and snapshot are attached to later trade entry context. Original HTF screenshots are shown with that entry's review evidence.
- HTF-Learning is a separate session-level destination in Nachbereitung. The server rejects reviews until captured_at + two hours; trading is unaffected. Reviews store confirmed/partial/invalidated/unclear plus a concrete learning point. Reviewed setup examples/counterexamples can deliberately enter Playbook, including archived setup snapshots.
- Multiple HTF screenshots are retained rather than replacing/deleting previous evidence. Selected but unsaved files prevent preparation confirmation until explicitly saved, so they cannot be silently omitted.
- V8 backup adds both new tables, retains owner-scoped image export and validates with `scripts/restore-backup-v8.py`. Legacy export/restore implementations and V7 assets are unchanged.

## Database implementation

`db/v8_htf_learning.sql` is the canonical fresh-schema definition. Applied through migrations `v803_htf_snapshots_and_delayed_learning` and `v803_htf_retry_consistency_and_mental_snapshot` (the latter tightens retry comparison and adds mental context to the original snapshot). `db/v8_htf_backup.sql` was applied as `v803_include_htf_learning_in_v8_backup`.

Two additive V8 tables have RLS. Assessments allow authenticated owner SELECT only; writes occur through two narrowly scoped SECURITY DEFINER functions with empty search_path, explicit ownership checks, locked session rows, optimistic context checks, validated setup/image ownership and server time checks. Preferences have owner-only RLS for read/write. The new export RPC is SECURITY INVOKER. Existing V7/shared functions, grants, policies and triggers were not redefined.

Repeated identical save requests are idempotent. Reusing a request ID with changed plan or mental inputs is rejected. Changes in the client reset the request ID. A newer HTF stand never overwrites an earlier plan; review updates only its retrospective fields.

## Evidence and limits

- `tests/sql/verify_htf_learning.sql`: 21 live-database assertions passed using fully rolled-back synthetic sessions, setups and HTF stands. Includes pre-two-hour rejection, boundary acceptance, cross-owner denial, denied direct timestamp editing, immutable original plan/setup after catalog edit, foreign image-reference denial, idempotency/conflicting retry checks, critical-mood continuation, intentional Playbook inclusion and backup completeness.
- V8 HTF tests cover ordered UI, Berlin timestamps, mood warning/continuation, failure/retry preservation, image setup selection, two-hour UI boundary, settings templates, account detours, local draft reconstruction, multiple image handling, learning draft preservation, end-session placement, logout cleanup and ZIP validation including the new tables.
- Browser QA at 390 CSS pixels used isolated synthetic local data: critical ratings → conscious continuation → News/Sentiment/direction/real image-card selection → save → visible HTF bias in trade preparation → locked fresh stand and available older stand → learning and Playbook selection saved.
- Images are placed before evaluation controls. Long HTF lists use expandable stands rather than a page of open forms. Narrow navigation avoids breaking “Nachbereitung” into two lines.
- Release syntax, CSP/SRI/hash checks, shared V8 business regressions, standard tests, Python backup tests and production dependency audit are run before publication.
- Advisors flag the two intentional new authenticated SECURITY DEFINER APIs, in addition to the two pre-existing warnings. The new APIs were inspected and behavior-tested as above. The pre-existing leaked-password-protection warning remains outside this V8 change.
- No real trade/account was modified during testing. Database fixtures were rolled back. No real iPhone/Safari keyboard/clipboard verification or administrative restoration into another hosted project was performed; the narrow browser test is not a native-device test.
