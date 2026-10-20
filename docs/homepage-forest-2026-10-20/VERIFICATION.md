# Homepage refinement verification — 20 October 2026

## Changes and evidence

The approved greeting and full interfaith introduction remain verbatim. The hero now uses a verified Arnold Arboretum photograph by Daderot (CC0); source, location, processing and public attribution are recorded in ARTWORK.md and the Credits page. The lower bodhi-tree forest extends across the alternating desktop reading composition and becomes denser/darker down the page. Phone content remains in one column with a path along its left edge. Stable 98%-white reading masks retain black text independently of the illustration.

Full sangha schedule is an ordinary button link to Find a Sangha, replacing the duplicate weekly disclosure. The dated daily list and its recurrence logic remain unchanged. Loading, empty and failed daily data leave the directory button usable; it also works without JavaScript. Community Voices exposes only its overview action, with publications retained on the existing pages. Community Events uses the requested sentence verbatim and links to the calendar subscription guide; the actual calendar remains within the finder.

The authoritative calendar API, 13 directory records, canonical standalone pages, mailing addresses, external handoffs and shared blue gloss navigation remain unchanged. The public accessibility statement assessment date is updated. Raw photo downloads, generation masters and browser artifacts remain excluded under outputs; optimized final assets and provenance are versioned.

## Verification performed

- Build and eleven unit tests pass. Targeted ESLint and whitespace checks pass.
- Chromium 148.0.7778.96 and WebKit 26.4: approved introduction, viewport-sized welcome at 1440×1000, 390×844 and 320×844, daily/monthly schedules, uncertain fortnightly group, Boston midnight, full-schedule button keyboard activation, no-script directory route, loading/empty/error states, blocked artwork, forced colors, reduced motion and short landscape checks pass.
- All 18 HTML pages: zero detected axe violations (external iframes excluded); zero horizontal overflow at 320, 390, 430, 768, 820, 1024, 1280 and 1440px. 200% text enlargement passes at 390 and 1440px. This is not a native browser-zoom or screen-reader test.
- Existing navigation journeys pass in both engines, including grouped navigation, finder/contact/directions, events to subscriptions, Voices to publications, mailing selection and standalone guide return links. Local link check: 18 pages, 30 destinations, 92 anchors; no broken local targets.
- Hero white-text/focus worst case remains 6.70:1 under the 64% black scrim. The 98%-white masks guarantee black reading text a background no darker than RGB 249.9 even above black artwork. Buttons retain their existing independently checked surfaces. Print, forced-colors and failed-photo fallbacks remain usable.
- Desktop/mobile hero, schedule and forest screenshots were inspected under ignored outputs/homepage-forest-2026-10-20. The generated artwork loads, text remains clear, the seven existing destinations remain distinct, and removed homepage publication/weekly-schedule interfaces are absent.

## Scope limits and rollout

This report records implementation verification, not independent WCAG certification. Native Safari/VoiceOver, NVDA, iOS VoiceOver and TalkBack were not tested. Historical PDFs and complete third-party Google Maps/Calendar/Forms processes retain previously documented limitations. No Google account was accessed for these changes.

CONTRACT.md records the preserved source, tag and rollback deployment. Rollout requires protected-preview asset/source checks, GitHub main push, explicit production deployment to the same Vercel project, then live browser/API checks and exact source/asset comparison. The resulting deployment identifier and source revision are recorded afterward in ignored outputs/homepage-forest-2026-10-20/release.json; this document does not pre-claim rollout completion.
