# Homepage hero and Boston palette refinement — 19 October 2026

The homepage now uses the retained landscape as a decorative full-width background. The greeting can use the full content width; the introduction stays at a 62ch maximum. There is no separate image column or stacked phone image. The hero remains content-driven, with 80px desktop, 64px tablet, and 48px phone padding. At the tested desktop width its height is approximately 430px, bringing the next section upward from the previous image-led layout.

The greeting, introduction, and action labels are unchanged. The image file is unchanged. A 64% black scrim supports white text; even if the underlying photo pixel is pure white, white text contrast is 6.71:1 and the gold focus outline is 3.63:1. Solid-color fallback, image failure, forced-colors mode, print, and responsive text enlargement were checked. Image preload reduces discovery delay.

The standardized brand palette follows the supplied [Boston flag reference](https://www.flagcolorcodes.com/boston):

| Role | Color |
|---|---|
| Header and primary actions | Gold #DFBC1E |
| Large headings and accents | Continental Blue #367BCA |
| Small links, control borders, supporting blue surfaces | Medium blue #355C96 |
| Body text and dark contrast | Dark blue #1D356D |
| Header action and reading surfaces | White #FFFFFF |

Butter yellow is removed. Medium blue is an existing color in the reference palette and provides the stronger contrast needed for small links. Continental Blue on white is 4.34:1, so it is reserved for large text and accents. Decorative borders and the defined pale-blue hover state are functional companion treatments. The gold header was selected to retain warmth and distinguish MCGB from CZC's navy top bar. The photo scrim is a functional neutral overlay.

The previous production source is preserved at commit `8f73b8c`; its immutable deployment is https://bostonoldpath-rifk5q5jv-mindfullybuildings-projects.vercel.app. The original pre-redesign source snapshot and rollback tag also remain intact.

This report supplements the initial release evidence in `docs/release-2026-10-19/`. Automated page/state scans, both-engine keyboard checks, and all-page text enlargement are repeated for this refinement. Native screen-reader checks remain unverified; this change does not establish independent certification.

Verification results: all 17 pages passed the automated page scan with no reported violations; eight viewport widths and all-page 200% text enlargement showed no horizontal overflow. Open/selected/error-state scans and Chromium/WebKit keyboard journeys passed. Machine-readable evidence accompanies this report.
