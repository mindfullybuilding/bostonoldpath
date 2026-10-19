# Water-gloss release verification — 19 October 2026

This is implementation evidence, not independent accessibility certification or a claim that every WCAG criterion passes. See `PRESERVATION.md` for the rollback revision/deployment and the accompanying 55-criterion matrix for coverage boundaries.

## Implemented behavior and copy changes

Restored About / Get Involved / Community Voices disclosures without arrows; Mailing Lists and Find a Group remain direct destinations. The mobile drawer has the same hierarchy. Existing canonical pages and resource anchors remain. Gather with Friends and the confirmed Poetry Exchange are clearly identified external destinations.

The homepage greeting and source introduction remain verbatim. New content consists of the five-stop newcomer journey and factual publication/submission descriptions. The newcomer quotation is _“Go as a river” — Thích Nhất Hạnh_, centered with the title on desktop and left-aligned on mobile. Its community meaning is documented by [Plum Village's Four Dharma Seals](https://plumvillage.org/articles/the-four-dharma-seals-of-plum-village). The supplied YouTube URL is context only and is not included on the site.

Restored year-grouped newsletter covers and the earlier Choose → Send → Confirm subscription approach. The form URL, two subscription addresses, 13 sangha records, five standalone guides, event API and Groups.io source remain unchanged. The Google calendar remains an optional signed-in view; no Google account was accessed.

## Page/state inventory and results

| Coverage                             | Result and evidence                                                                                                                                                                        |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| All 17 canonical first-party pages   | Automated axe WCAG A/AA scan: zero detected violations, excluding external iframes.                                                                                                        |
| 320,390,430,768,820,1024,1280,1440px | No horizontal page overflow across the 17-page inventory.                                                                                                                                  |
| All pages at 200% text enlargement   | No horizontal overflow at 390 and 1440px. 320px also models 400% reflow from 1280px.                                                                                                       |
| Three open desktop dropdowns         | Zero axe violations; keyboard Enter/Space, Tab, ArrowDown, Escape, focus return and real destinations checked.                                                                             |
| Mobile drawer                        | Closed/open/expanded group, Escape, keyboard containment, focus restoration, breakpoint changes and short-screen scrolling checked.                                                        |
| Finder/calendar/resources            | Filtering, no matches, details, contact/directions, deep links, all resource disclosures, all provider guides, failed feed/clipboard, blocked embeds and partial refresh behavior checked. |
| Mailing Lists                        | Both/one/no choices, original mailto destinations, copy feedback and fallback; no messages sent or subscriptions submitted.                                                                |
| Newcomers                            | Five ordered stops, desktop centering/mobile left alignment, masked river, image failure, forced colors and reduced motion checked.                                                        |
| No JavaScript                        | Seven core pages, including newsletter PDFs, newcomer actions and both mailing addresses remain usable.                                                                                    |
| Links                                | 17 pages, 28 internal destinations and 89 anchors checked without broken destinations. Poetry Exchange anonymous HTTP 200.                                                                 |
| Event logic                          | Five tests pass: all-day dates, DST/recurrence/exclusions/overrides/cancellations, safe links, timeout/failure and cache behavior.                                                         |

Browsers: Chromium 148.0.7778.96 and Playwright WebKit 26.4. In-app browser used for visual review and a manual Space → Tab → Escape disclosure/focus check. WebKit is not a native Safari/VoiceOver test.

Actual rendered gradient backgrounds were sampled across the complete label rectangles after hiding glyphs for measurement. Minimum observed: 5.49:1 across desktop identity, 5.65:1 compact identity, 5.96:1 normal navigation, 6.95:1 selected navigation, 6.06:1 primary button and expanded drawer, 6.71:1 hovered primary button, and 18.92:1 white header action. Reading text remains black on white. This avoids treating the base swatch's insufficient white contrast as the rendered result.

## Fix and retest record

The WebKit pointer/focus race, stretched initial mobile artwork, misaligned editorial introductions and newcomer heading alignment were fixed and retested. See root `design-qa.md` and the final screenshots. The wider mobile artwork is a masked natural-proportion crop, not an elongated decorative stripe.

## Accessibility boundaries

- Native Safari/VoiceOver, NVDA/Windows, real iOS VoiceOver, Android TalkBack and switch-device evaluation were not performed. Do not mark them passed.
- Historical PDFs remain unremediated. Their cover/link navigation was tested, not every PDF's reading order.
- Previously recorded Google Maps accessibility defects remain third-party limitations; first-party tests explicitly exclude the frame. Directory/contact/directions remain usable independently.
- Optional signed-in Calendar and Google Form have separate external processes; this release does not certify them. Anonymous form destination was previously verified; no submission was made.
- Public accessibility statement retains scope, date, limitations and plumvillageboston@gmail.com feedback contact.

## Reproduction and rollout evidence

Run `npm test`, `npm run build`, and the browser scripts `browser-check`, `navigation`, `interactions`, `states`, `enlargement`, `no-script`, `links`, `hero`, and `gloss` in `tests/`. Machine output is retained locally under `outputs/release-verification/` and `outputs/water-gloss-2026-10-19/`; selected evidence is versioned here. Browser profiles, output captures, credentials and private reference documents are excluded from Git/deployment.

The release sequence is a verified Vercel preview, push to GitHub main, explicit deployment through the existing bostonoldpath Vercel project, then `tests/production.mjs` and live navigation journeys against bostonmindfulness.vercel.app. The final source/deployment identifiers and production results are recorded in local `outputs/water-gloss-2026-10-19/release.json` after deployment. This pre-release document does not pre-claim that sign-off.
