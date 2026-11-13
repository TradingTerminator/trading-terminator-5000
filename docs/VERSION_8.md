# Trading Terminator 8.00

V8 replaces the navigation, styling and workflow controller with an independent source and build. It keeps the existing authenticated journal persistence and validated transaction functions. It does not reset or migrate historical records.

## Workflow

- Start displays the next useful action, session state and pending reviews.
- Trade opens session preparation if required, the single running trade directly, or entry preparation.
- Entry order: explicit emotional assessment → setup and idea → account allocation and initial risk. Existing validation, exception recording and atomic entry persistence remain active.
- Session configuration and protected completion are in the preparation workspace. Changing trade defaults still requires explicit unlock.
- Nachbereitung groups Review, Playbook, Training and Auswertung. The Playbook keeps setup criteria and linked real examples; learning remains linked to trades.
- Settings are a small navigation control. No duplicated analysis navigation or global status card.

## Compatibility and limitations

- `src/v8.html`, `src/v8.css`, and `src/v8-workflow.js` are the V8 sources. The CSS replaces all legacy stylesheet blocks; the controller composes the existing journal components into the new workspaces.
- V7.42 HTML and assets remain byte-for-byte available at `v7-test.html`. Root redirects to `v8.html`.
- V8 uses separate `tt8_` browser draft keys. Existing unsynchronized V7 drafts remain accessible in V7; they are not silently migrated or deleted. Both versions use the same authenticated remote journal records.
- Initial-risk calculations, ownership isolation, explicit emotion ratings, immutable entry snapshots, private chart storage, native image paste and review navigation retain their existing safeguards.
- There is no broker/ATAS integration. Journal timestamps are not actual holding-duration evidence. No inferred holding duration is displayed.
- No schema change is included. In particular, the previously declined standalone-idea setup-snapshot migration is not applied.
- Browser verification used synthetic records. Native iOS clipboard behavior still requires a real-device test; desktop browser verification does not establish iPhone Safari support.

## Validation

- 113 JavaScript tests pass, including 9 V8 workflow tests and the frozen V7 regression suite.
- 8 Python backup tests pass.
- Release verification checks syntax, unique IDs, CSP, script integrity hashes, canonical redirects, and the asset manifest.
- Browser walkthrough verified Start, preparation, Nachbereitung, Playbook, the new three-step entry order, setup-to-idea transfer, and locked risk defaults.
