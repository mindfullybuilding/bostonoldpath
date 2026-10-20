# Participation UI verification — 20 October 2026

## Implemented

Homepage title is the full organization name. Drawer disclosures retain accessible expanded states without helper words; Find a Group uses the established blue primary surface. The approved homepage introduction naturally occupies two lines at 1440px in Chromium and WebKit, without inserted line breaks or reduced font size.

Today's sanghas has a noninteractive light-blue date panel and compact month label. The exact supplied sangha paragraph replaces the old note, and is reused verbatim on Find a Sangha. Phones center the homepage heading, date and schedule action, with the full paragraph behind a labeled native information disclosure. Desktop shows it directly. Date generation and daily/monthly schedule logic remain unchanged.

Finder filters stick below the actual header on desktop, with an internally scrollable height limit and a short-window exception. Phones use a standard Lucide funnel icon at the left of the results toolbar and N of 13 sanghas at the right; Escape closes filters and restores focus. Clearing an empty result set restores focus to a visible control. The map is a normal h2 section on desktop and hidden on mobile. Its heading shares the Community events type scale. Expanded More details summaries preserve rounded borders and bottom spacing beside Contact organizer. Clear filters and Refresh events use shared white controls.

The month calendar and agenda read GET /api/events, whose configured source is the public Groups.io ICS feed. The redundant Google Calendar view is removed, along with obsolete Google recovery text; privacy and accessibility statements match the actual remaining services. The API, feed URL and subscription guide are unchanged.

Community Voices has equally sized publication columns with shared heading, description and action tracks. Latest-cover/date previews are removed. Publication columns use a 48px gap. The contribution title aligns with The Present Moment, and its reading area extends to the poetry column’s outer right edge. The full-width contribution invitation welcomes existing online work or a description of work the community can help share, with the real form button below. This is original invitation copy, not a quotation attributed to Thích Nhất Hạnh. Mobile titles center. The archive link is removed from Mailing Lists; the archive remains available through Community Voices.

## Checks and evidence

- Build and eleven unit tests pass. Targeted ESLint and whitespace checks pass.
- Chromium 148.0.7778.96 and WebKit 26.4 pass the scoped title, two-line intro, mobile disclosure, drawer labels/blue action, exact copy, result filtering/reset/focus, sticky desktop filters, map visibility, expanded details, publication alignment and form/archive destinations checks.
- Existing navigation and homepage loading, empty, error, uncertain recurrence, midnight and no-script journeys pass in both engines. Calendar fixtures verify month navigation and actual event display; error/retained data and subscription-copy recovery remain available. The production feed currently contains no upcoming events; none are fabricated.
- All 18 first-party pages pass automated axe scans with external iframes excluded and overflow checks at 320, 390, 430, 768, 820, 1024, 1280 and 1440px. 200% text enlargement passes at 390/1440px. Native browser zoom and native screen readers are not represented by these checks.
- Open-state axe checks pass for navigation, drawer, filters, details, resource links, subscription tutorials and feed failure. No-script primary navigation, directory details, resources and archive content remain usable.
- Hero scrim keeps white-text/focus worst-case contrast at 6.70:1. New controls reuse the checked white/blue surfaces; the date panel uses black text on pale blue. Forced colors, reduced motion, short windows and photo failure retain functional content.
- Local link check: 18 pages, 30 destinations, 92 anchors; no broken targets. Desktop/mobile screenshots for welcome, schedule, finder and Community Voices are in ignored outputs/directory-polish-2026-10-20 and were visually inspected.

## Limits and release

This is internal implementation verification, not independent accessibility certification. Native Safari/VoiceOver, NVDA, iOS VoiceOver and TalkBack remain untested. Historical PDFs and complete third-party map/form processes retain documented limitations. No Google account was accessed.

CONTRACT.md records the prior revision, preservation tag and previous deployment. Rollout requires a protected preview check, GitHub main push, explicit deployment to the existing Vercel project, live browser/API checks and exact HTML/asset comparison. Final release identifiers are recorded afterward in ignored outputs/directory-polish-2026-10-20/release.json; this document does not pre-claim rollout completion.
