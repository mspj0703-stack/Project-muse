# HANDOFF — Project MUSE

## CHECKPOINT
- ID: MUSE-ALPHA02-WEB-001
- Version: 0.2.0
- Date: 2026-11-14 (Asia/Seoul)
- Based on: MUSE-ALPHA01-ENGINE-001 (TypeScript core preserved in `engine/`)

## CONTEXT
- Goal: lightweight J-POP/anime/vocaloid/game OST music discovery website.
- This ZIP is a **functioning front-end prototype**; it does NOT deploy a live website.
- Tech: Vanilla HTML/CSS/ES modules + Alpha 0.1 compiled engine, no npm install needed.
- Canonical entrypoints: `index.html` (serve via localhost), `MUSE_Offline_Demo.html` (open directly).
- Music catalog: 52 curated names; manually assigned *placeholder* features and tags, **not** measured features.
- State: local browser only. No login, external API, database or audio streaming.

## DONE
1. Mobile-first `/select`-equivalent song search/filter and 5–10 seed selection.
2. `/probe`-equivalent adaptive 10-question listening preference survey, separate skip.
3. `/results`-equivalent top 10 recommendations, profile bars and feedback-based rerank.
4. 52 songs with title, artist, category, aliases, manual provisional tag/feature metadata.
5. Offline single HTML build script and original/expanded automated tests.

## VALIDATION
- Original core tests: 14/14 pass.
- Catalog/integration Node tests: 4/4 pass.
- Chromium in-memory UI flow: choose 5, rate 10, result 10, rerank on feedback, mobile no horizontal overflow. No runtime page errors.
- Local Chromium direct URL navigation is blocked by this runtime's administrator policy. **HTTP module version E2E navigation and localStorage across reloads are unverified.**
- No external metadata accuracy audit / production deployment tests.

## NEXT 3 TASKS
1. Validate song records against trusted official catalogs and replace placeholder numeric features with reviewed tag data.
2. Pilot actual user listening tests, investigate recommendations that collapse into same preset templates.
3. Migrate UI to Next.js once dependencies are installable; optionally add Supabase and server-side music API routes.

## GUARDRAILS
- Never represent pilot preset values as audio measurement or AI predictions.
- Scores are relative rankings, not preference probabilities.
- `skip` is not dislike.
- No external music service keys in browser.
- Do not claim DB migration was executed or 52 songs externally verified.
- Keep report and user-facing texts in Korean.
