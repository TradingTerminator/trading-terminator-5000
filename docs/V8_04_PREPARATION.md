# V8.04 – mobile preparation and explicit decisions

- Show the precise release in the header and Start banner.
- Stack HTF labels above full-width controls; compact technical criterion cards.
- Replace the duplicate no-news field/button with an explicit news choice. Changing the choice retains an earlier typed appointment in the draft.
- Replace “Beachtet” with Relevant / Nothing relevant / Unclear. Relevant findings require a concrete observation. Keep optional notes collapsed otherwise. Existing checked snapshots remain explicitly labelled as legacy reviewed values, never inferred as a market finding.
- Store the criterion result alongside the existing checked flag in the immutable plan; display it in HTF Learning. The existing RPC accepts this JSON field; no database or permission changes.
- Critical mental-state confirmation visibly acknowledges the choice and focuses HTF. Pause revokes consent, returns to Start and retains the draft. Changed mood requires a new decision. Trading documentation is not locked by negative mood.
- No/unclear HTF setup produces a contextual warning during preparation and carries into trade preparation and the entry snapshot display.
- Show one accent-coloured preparation confirmation only after explicit mental ratings/decision, news, sentiment, direction, technical results and setup choice are complete. Pending images must be saved or discarded; screenshots themselves remain optional. Missing-item buttons reveal and focus the exact field.
- Preserve owner/session-scoped local drafts, retry identity on save failure, account return navigation, immutable historical evidence and server-enforced two-hour HTF Learning delay.

Validation: 143 application tests, 99 shared V8 business tests (4 V7-only UI contracts skipped), release syntax/CSP/SRI/hash verification, production dependency audit: zero vulnerabilities. Browser QA with a 390 CSS pixel synthetic-data frame verified pause/return, consent, HTF inputs, missing-to-complete transition, missing-setup warning and save-to-trade navigation. This is not a native iPhone Safari test. No real journal data was changed for QA. V7 assets/source and database objects remain unchanged.
