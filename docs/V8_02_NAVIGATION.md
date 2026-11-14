# V8.02 — context-aware return navigation

Session preparation → manage/add account → save now returns directly to the same session preparation. The in-memory session draft retains account selection, instruments, quantities, SL values, HTF notes and explicit mood ratings across the account reload. New accounts appear unselected so their session risk is deliberately configured. Cancel/back returns to the same preparation; failed saves stay in account management. Ownership and session identity changes invalidate the return context.

Accounts opened from Settings still return to Settings. Top-level Settings remembers its caller. A single fixed bottom back action replaces page-top back links on Session, Reviews, Playbook, Training, Analytics, Settings and Accounts; Entry uses the same action for its preceding step. Content padding, toast and scroll-to-top positions reserve space for the bottom bar and device safe area. Existing review step actions and journal return controls already sit below their content.

Validation: seven focused navigation scenarios pass, including creation, edit, cancellation, failure, settings entry, entry/review back actions and invalidated session identity. Browser QA with isolated synthetic accounts confirms that 3 contracts and a 72-tick draft survive account creation and the new account is available on return. No production account was created for testing. Full automated suite, V8 shared regressions and release integrity checks are run before merging. Native iPhone keyboard/safe-area behavior still requires device confirmation.

V7 files and shared database configuration are unchanged.
