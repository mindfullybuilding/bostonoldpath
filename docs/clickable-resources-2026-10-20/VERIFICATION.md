# Whole resource tiles and guide reading — 20 October 2026

All 27 published resource tiles are now native anchors covering the visible tile, including its heading, description and padding. Each has one keyboard stop and an accessible name from its title. No nested links or JavaScript navigation are used. All resource destinations are unchanged, including the genuine email action for builder inquiries and legacy mentoring/update anchors. Existing blue surfaces, padding, heading treatment and responsive grids remain. Keyboard focus outlines the whole tile; hover applies to its whole area.

The repeated bottom sibling-guide navigation is removed from all five Community Builder articles. Top breadcrumbs and the resource index remain usable. The Dharma Sharing opening paragraph matches the user’s replacement exactly; other substantive source copy and source formatting are preserved.

## Verification

- Build, targeted ESLint and whitespace checks pass.
- Chromium 148.0.7778.96 and WebKit 26.4 pass real clicks in the bottom padding of all five guide tiles, standalone guide reading and breadcrumb return journeys. The exact Dharma Sharing paragraph is verified in the rendered page; repeated bottom guide navigation is absent.
- All 27 tiles are native links, without nested anchors. Resource-page destination sets match the previous release exactly. Tab and Shift+Tab move between whole tiles as expected. Desktop/mobile tile and focus proofs at 1440×1000 and 390×844 are under ignored outputs/clickable-resources-2026-10-20 and were visually inspected.
- Automated first-party axe checks pass across all 18 pages, with third-party frames excluded. Responsive overflow checks at 320,390,430,768,820,1024,1280,1440px and 200% text enlargement at 390/1440px pass. Open navigation, forced-colors, image-failure and 320px reflow checks remain passing.
- Shared blue resource heading contrast remains at least 6.34:1 normally and 7.12:1 on hover. The visible whole-tile keyboard outline is retained around the full rounded surface.
- Link check: 18 pages, 30 destinations, 92 anchors; no broken local targets. Existing guide, legacy-resource, subscription and primary-navigation journeys pass.

The hit-area test targets visible bottom padding away from the rounded transparent corner, rather than outside the painted tile. Existing checks were updated from title-link selectors to native whole-tile anchors and from four repeated guide links to their intended absence.

This is internal implementation verification, not independent accessibility certification. Native screen readers remain untested; historical PDF and third-party service limitations remain separately documented.

CONTRACT.md records the prior source, preservation tag and deployment. Rollout requires protected preview verification, main push, explicit deployment to the existing Vercel project, then public file/API and browser checks. Final release identifiers are recorded afterward in ignored outputs/clickable-resources-2026-10-20/release.json.
