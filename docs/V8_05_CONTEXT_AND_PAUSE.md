# V8.05 – emotional context, voluntary breaks and HTF direction

- Contextual mental-state advice reflects each explicit scale, severity and combinations. Strong focus is never labelled as weak. Advice is a reflection prompt, not a diagnosis or trading lock.
- Voluntary pause opens a duration choice (5/10/15 minutes or 1–180 custom whole minutes), then a neutral full-screen countdown. Early exit and Escape remain available. Absolute deadline survives reload and background suspension. Owner/session-scoped local state; logout removes the visible overlay. Closing a running break returns to the retained preparation; negative scales can still be consciously acknowledged.
- Manual news has separate title and native time controls in Europe/Berlin, plus explicit unknown time. Macro has its own direction; sentiment has a short “why” field. All travel with the immutable assessment and appear in HTF Learning.
- Sticky compact direction panels show Macro / Sentiment / Technical independently, flag opposed long/short views, and retain the exact entry snapshot. No majority vote or automatic trade signal. Missing legacy values remain visibly missing.
- HTF asks for a planned scenario using a Playbook pattern and future condition. This is distinct from confirming the concrete entry setup. No scenario is not equivalent to an invalid trade. Existing historical assessments remain intact.
- Public-source calendar: BLS ICS and BEA machine-readable release dates, with source links, Berlin conversion and freshness status. Explicitly excludes Fed/ISM/earnings and forecasts/actuals. Users select relevant events; nothing silently declares “no news”. Selected dates/source/fetched-at are snapshotted without erasing manual notes.
- A scheduled GitHub workflow refreshes public data roughly every six hours and explicitly requests a Pages build (token commits do not trigger one automatically). It only commits data/macro-calendar.json, never force-pushes; a concurrent code push fails safely. Failed sources retain their last valid rows and get marked unavailable/stale. This dataset is intentionally outside immutable code asset hashes and is packaged in dist and allowlisted by the optional header gateway.

## Sources verified 14 November 2026

- https://www.bls.gov/help/hlpiCAL.htm
- https://www.bls.gov/schedule/news_release/bls.ics
- https://www.bls.gov/opub/copyright-information.htm (public-domain data, attribution requested; no logo used)
- https://www.bea.gov/news/schedule/icalendar
- https://apps.bea.gov/API/signup/release_dates.json
- https://www.bea.gov/help/faq/147 (public-domain data unless stated otherwise)
- https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax
- https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site

## Verification

151 application tests and 99 shared V8 business regressions (4 legacy-only UI contracts skipped); 14 Python tests including DST conversion, invalid feeds, duplicate dates and failed-source retention. Production dependency audit: zero vulnerabilities. Release syntax/CSP/SRI/hash checks passed. Browser QA at 390 CSS pixels used synthetic account/session data and real public calendar data: pause choose/start/early exit, source schedule selection, sentiment reason, conflicting directions, preparation save and entry context display. Not a native iPhone Safari test. No real journal rows, V7 source/assets, database objects or authentication settings changed.

The calendar workflow also runs on changes to its own file on main, enabling an immediate end-to-end check after initial release without a separate workflow-dispatch permission. Calendar-only commits do not match that trigger, preventing a loop.
