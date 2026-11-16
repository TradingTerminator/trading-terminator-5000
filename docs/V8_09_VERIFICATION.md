# V8.09 release verification — 2026-11-16

Source 53e15f09893adc96a1173608a0d152cd8395abba passed Verify release (43962759824) and V8.09 recovery validation (43962759731). Generated release assets were committed as 5677132bf43bb49ee41739aa398348f918f68429.

Validated: 199 Node tests, 99 shared V8 checks (4 V7-only UI contracts excluded), 14 Python checks, production dependency audit, isolated PostgreSQL 17 migration/ownership/CAS/replay/training-source/historical-exit tests, Chromium at 1440x1000, 390x844 and 320x740, real rendered synthetic image crop persistence.

The additive v8_09_learning migration was applied to the connected Supabase project. tests/sql/verify_v809_live.sql passed against its actual permissions using two synthetic identities, and all fixtures were rolled back. Fixture trade insertion runs as administrator because direct authenticated trade INSERT is deliberately revoked; tested application operations run as authenticated.

Still requiring real-device practice: iPhone Safari/PWA/clipboard, real second-user login and end-user trading-session acceptance. Browser network responses are synthetic. These are not claimed as completed.
