# MCGB water-gloss design QA — 19 October 2026

final result: passed

## Comparison target and evidence

Selected source: `docs/water-gloss-2026-10-19/selected-reference.png`. This is a component-style reference, not a request to reproduce Togetherness branding, profile controls, or destinations. The approved plan supplies MCGB's content and responsive layout.

Source and implementation were viewed together in `docs/water-gloss-2026-10-19/header-comparison.png`. The reference's 1140px component and MCGB's full-width header differ intentionally in dimensions and branding. Desktop/mobile newcomer proofs and actual UI states were also inspected, including the in-app browser at 1280px and 390px. Automated captures cover 1440px and 390px.

## Findings, fixes, and retest

- P1: WebKit blurred the disclosure trigger on pointer-down without focusing the clicked link, closing the panel before pointer-up. Fix: retain a pointer-hovered panel through null-related-target blur; continue closing for outside focus, Escape and outside clicks. Retest: complete Chromium and WebKit navigation journeys pass.
- P2: initial narrow mobile rendering elongated the stones. Fix: wider natural-proportion river crop at the left margin, with a soft horizontal mask; adjacent segments alternate orientation to join without a visible tile cut. Retest: mobile proof inspected; text and buttons remain outside the artwork.
- P2: Community Voices and Mailing Lists inherited centered reading introductions above wide editorial layouts. Fix: align those introductions with their content grid. Retest: final desktop/mobile captures show a consistent left edge.
- P2: newcomer introduction lacked an intentional axis. User selected a short italic river quotation. Fix: center title/quote above the desktop river; left-align on mobile. Retest: rendered alignment assertions and final screenshots pass.

## Required fidelity surfaces

- Typography: system sans serif retained; Georgia remains the approved homepage greeting exception. Heading hierarchy, natural wrapping, 16px minimum controls and 18px desktop body retained. The newcomer quote is italic; no extra slogan.
- Spacing: shared 1160px content grid, 24/16px gutters, content-driven header and controls. Dropdown rows >=48px; drawer rows >=56px. Quiet reading surfaces, top-aligned editorial columns, larger year-grouped publication covers.
- Color/depth: exact #367BCA base, curved upper reflection, darker white-label zone, deeper lower rim, rounded surfaces and shadows. The darker text region is an intentional accessibility adaptation of the brighter source. Rendered text-zone contrast passes in header, hover/selected navigation, primary buttons, compact header and expanded drawer.
- Assets: retained landscape and actual newsletter covers; generated raster river with disclosed provenance. No invented community art or photographs. The reference avatar and Togetherness identity are intentionally absent.
- Content: exact approved homepage greeting/intro preserved. Five-stop newcomer copy connects real destinations. “Go as a river” is source-backed in Plum Village's Four Dharma Seals; the contextual YouTube video is not linked. Real editions, original subscription addresses, directory contacts and calendar source preserved.
- Responsive/interactions: arrow-free desktop disclosures, grouped mobile drawer, keyboard focus/Escape, real link destinations, selectable mailing lists/copy fallback, no-script archive and directory. Image failure preserves all newcomer content; forced colors removes decoration.

## Open questions and follow-up polish

No unresolved P0/P1/P2 visual findings. This is design QA, not independent WCAG certification. Native screen-reader combinations, external map/form processes and historical PDF limitations remain documented separately.
