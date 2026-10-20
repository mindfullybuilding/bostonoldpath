# Resources, copy and desktop navigation verification — 20 October 2026

Community Members now has five peer tiles in the shared blue resource grid: 5 Mindfulness Trainings, Order of Interbeing, Fourteen Mindfulness Trainings, Retreats and Practice Centers. Collection wrappers and generic Introduction labels are removed. Community Builders has nine peer tiles: the seven existing guides/materials plus community-builder inquiries and Brown Jackets. The redundant Sangha Resources heading and description are removed. Existing published descriptions and destinations remain; unavailable draft content is not published.

The old resource-sangha-resources anchor remains on the flat builder grid, and five-mindfulness-trainings, order-of-interbeing, retreats, mentoring and update anchors still resolve. All five standalone guide pages and their return navigation remain available. All cards now use the same h3 title, description, padding, border, blue surface and responsive grid as the other sections. Removed collection CSS no longer introduces extra nesting or space.

The homepage Community Voices sentence, subscription-page introduction and finder calendar paragraph match the user’s supplied replacements verbatim. No new photo, resource URL, contribution or event is invented.

Desktop About is now a normal link to Greater Boston Community; Get Involved is a normal link to Find a Sangha. Click and Enter follow the parent destination without interception. Hover and keyboard focus expose the existing arrow-free dropdowns; Arrow Down enters child links. Escape dismisses the panel and restores parent focus without reopening it. Focus-out, pointer dismissal and responsive focus restoration remain. Mobile drawer groups retain their existing button behavior. The mobile homepage date is now centered on its own row above the heading/info group; its 44px info button expands the full paragraph beneath it. Spacing is reduced to 32px section padding, 12px between date and heading and 24px before the list. Desktop and no-script introductions remain visible. Expanded mobile finder filters now have a visible top-right close button that preserves selected filters and restores focus to the toolbar icon; Escape remains available.

## Evidence

- Build, targeted ESLint, whitespace checks and eleven unit tests pass.
- Chromium 148.0.7778.96 and WebKit 26.4 pass direct parent navigation, dropdown keyboard/Escape behavior, mobile drawer journeys, responsive focus restoration, finder/contact/calendar handoffs and all five standalone guide-to-resource return paths. No JavaScript errors detected in interaction checks.
- Desktop/mobile captures at 1440×1000 and 390×844 show five member tiles and nine builder tiles sharing the same grid; no collection wrappers remain. All three exact text replacements were verified. Mobile date/info placement, expansion, filter-close selection preservation and focus restoration passed in both engines. Captures are stored under ignored outputs/resource-tiles-2026-10-20.
- Automated first-party accessibility checks exclude third-party frames. Existing full-page scans, open-dropdown scans and 320–1440px reflow checks pass. 200% text enlargement at 390/1440 passes. Forced colors, image failure and responsive navigation checks pass. Shared blue resource-label contrast remains at least 6.34:1 in the sampled normal state and 7.12:1 on hover.
- Local link check covers 18 pages, 30 destinations and 92 anchors with no broken targets. Existing resource destinations and legacy anchors remain functional.

This is internal implementation verification, not independent accessibility certification. Native screen readers remain untested; historical PDF and external map/form limitations remain as documented. No Google account was accessed.

CONTRACT.md records the baseline source, preservation tag and prior deployment. Release requires protected-preview checks, GitHub main push, explicit deployment through the existing Vercel project, and public browser/API/source comparisons. Final identifiers are recorded afterward in ignored outputs/resource-tiles-2026-10-20/release.json rather than pre-claimed here.
