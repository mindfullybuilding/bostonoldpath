# Accessibility verification — 19 October 2026

This is an internal implementation verification report against relevant WCAG 2.2 A/AA requirements. It is not an independent certificate, a full conformance claim, or evidence that all 55 criteria have passed. The criterion matrix distinguishes checked implementation evidence, limited coverage, unverified assistive-technology behavior, and criteria not applicable to first-party content.

## Scope and inventory

17 first-party HTML pages: homepage; New here; Our practice; Our community; Find a Sangha; Resources; Community Voices; newsletter archive; mailing lists; Sangha overview; Sangha facilitation; Minding the Bell; Meeting and Bell Minding Flow; Dharma sharing guidelines; accessibility statement; photo credits; privacy/site information.

State coverage: desktop Resources/Our community disclosures; compact drawer; filter selections; no matching groups; group details/contact; all resource disclosures; subscription-provider instructions; successful clipboard copy and clipboard rejection; calendar loading, empty, loaded/paginated fixture, initial feed failure, refresh failure retaining results; blocked map and calendar embeds; resource deep links; resize from an open mobile drawer to desktop; short landscape drawer scrolling; reduced motion; no-JavaScript destination fallback.

Preserved historical PDFs and external Google Forms/Google Calendar/Google Maps processes were not comprehensively evaluated. Links and handoffs were checked. Full-page WCAG conformance cannot be inferred from a first-party agenda alternative to an external iframe.

## Coverage and method

- Chromium 148.0.7778.96, automated browser and keyboard checks.
- Playwright WebKit 26.4, keyboard/interaction checks. WebKit used Option+Tab for link navigation, reflecting Safari’s all-controls keyboard behavior. This is not a native Safari or VoiceOver test.
- axe-core via @axe-core/playwright 4.14, WCAG 2 A/AA, 2.1 AA, and 2.2 AA rule tags. Every page scanned; open/selected/error states scanned separately.
- Viewports: 320, 390, 430, 768, 820, 1024, 1280, 1440 CSS px. A 320 CSS px viewport checks the reflow width equivalent to a 1280 px desktop at 400% zoom. Actual browser zoom was not independently operated.
- All rendered text sizes were doubled on every page at 390 and 1440 px. Separate text-spacing overrides checked 1.5 line height, 2em paragraph separation, .12em letter spacing, and .16em word spacing in the homepage interaction suite. Full all-page manual text-spacing review remains unperformed.
- Native Safari/VoiceOver: attempted access; computer-use permission denied. No screen-reader pass is claimed and no version was inferred.
- NVDA/Windows, real iOS VoiceOver, Android TalkBack, switch devices: unavailable/not tested.

## Results and retests

No axe violations remain in the scanned first-party pages and tested states. No horizontal page overflow remained at the eight viewport widths or in all-page 200% text enlargement checks. Both browser engines completed the tested keyboard journeys without page script errors. First-party asset links and meaningful resource anchors resolved.

Findings corrected and retested:

1. Narrow homepage heading overflow at 320 px: removed a missing whitespace/joined-word condition and allowed oversized text to wrap.
2. Calendar auxiliary text contrast was 4.46:1 on the tinted band: darkened the shared muted token to #625F58 and used 16px calendar labels.
3. Native modal tabbing could reach browser chrome between cycles: added explicit first/last focus wrapping, retaining native modal isolation and Escape support.
4. Enlarged text overflowed long email links/grid items: allowed wrapping and set content grid children to min-width:0; header height follows content and short windows use a non-sticky header.
5. Footer focus needed stronger contrast on ink: changed the footer focus outline to yellow.
6. Google calendar was viewable only in an existing signed-in session. Anonymous testing redirected to sign-in; its read-only imported-calendar settings had no public-sharing control. User chose a public first-party agenda with optional signed-in Google view. The Google account was subsequently signed out at the user’s request. No account information is saved in the site or report.
7. Responsive breakpoint changes could blur a desktop navigation or filter control before the resize handler observed it. Remembered the focus origin and moved it to the equivalent visible control; both resize directions passed in Chromium and WebKit.
8. The inherited Mountain Bell record contained placeholder organizer addresses. The original record remains preserved in source; the visible action routes to MCGB’s confirmed public contact for current organizer information.

## Remaining limitations

- Screen-reader testing remains unverified. Semantic markup, labels, focus and status behavior were checked programmatically and through browser accessibility output, but these are not substitutes for spoken output and real user journeys.
- The optional Google Calendar view requires sign-in/access. It is closed by default at every width, clearly labeled, and unnecessary for public calendar reading/subscription.
- Original newsletter PDFs may lack tagging, reading order, and other accessibility features. Assistance contact is present on archive and accessibility pages.
- External submission, mailing-list confirmation, and calendar-provider subscription processes were not completed with real submissions, emails, or account changes.
- The original landscape’s provenance was not newly established. It is retained from the previous site; new lineage photos have explicit licenses and attribution.

## Independent certification path

A qualified external evaluator should perform WCAG-EM sampling and complete-process review, criterion-by-criterion manual assessment, native assistive-technology testing, and disabled-user task evaluation; record findings, remediation, and retest results; then issue a dated scoped conformance report/attestation. Include historical documents if they are to be covered. Do not issue a sitewide compliance badge based on these automated checks.

References: [WCAG 2.2](https://www.w3.org/TR/WCAG22/), [W3C conformance evaluation](https://www.w3.org/WAI/test-evaluate/conformance/), [automated-tool limitations](https://www.w3.org/WAI/test-evaluate/tools/selecting/).

Public feedback contact: plumvillageboston@gmail.com.

Evidence files: `automated.json` (page scans and responsive widths), `states.json` (open/error states), `interactions.json` (two-engine keyboard journeys), `enlargement.json` (all-page doubled-text checks), `links.json` (29 first-party destinations and 112 anchors), `contrast.json`, `WCAG-MATRIX.csv`, and `screenshots/`. Additional no-JavaScript checks passed for the homepage, finder, resources, and Community Voices.
