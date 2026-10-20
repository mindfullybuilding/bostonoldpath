# Homepage release verification — 19 October 2026

## Result and scope

The homepage now opens with the shared navigation and a viewport-sized photograph containing the approved greeting, complete interfaith introduction and two actions. This follows the first-screen proportion observed at Cambridge Zen while retaining MCGB's own content, landscape, typography, colors and controls.

Immediately below are today's regular sanghas and an expandable full weekly schedule. The remaining existing destinations follow a decorative dirt path with bodhi trees: Our Practice, Greater Boston Community, Gather with Friends, Resources, Community Voices, Community Events and Mailing Lists. The original everyday-practice introduction and publication preview remain. No substantive introductory passage was rewritten. Existing standalone pages and canonical URLs remain.

`DESIGN.md` and the local contract define the viewport minimum, text overflow, schedule source/rules, path composition and failure states. Old homepage-only grid styles were removed. Working artwork drafts, browser captures and machine output remain excluded by `.gitignore` and `.vercelignore`. The shipped PNG is intentional public artwork with generation provenance and prompt history in `ARTWORK.md` and the public Credits page.

## Schedule accuracy and limits

The same 13 organizer-provided directory records supply both today's list and the full schedule. Ordinal weekday rules are explicit in `public/assets/sangha-schedule.js`: Wake Up Boston second/fourth Wednesdays; Joyful Lotus first Wednesday; Tree House first/third Mondays; Mountain Bell second/fourth Sundays. Lotus Pond's every-other-Thursday pattern lacks an anchor date, so it is shown separately as requiring confirmation rather than assigned invented dates. Keep these rules synchronized when directory schedules change.

Today's date uses America/New_York and updates when returning to the page or within a minute of Boston midnight. It includes that day's regular meetings even if their listed time has already passed. This is not live attendance or a cancellation-aware event service; visible copy asks visitors to confirm changes/joining details with organizers. The Groups.io events API, Google view and subscription tutorials remain unchanged.

Without JavaScript or if today's data fails, the full schedule and links to individual directory records remain ordinary HTML. Loading and completion use status announcements; native screen-reader behavior has not been manually evaluated.

## Checks and evidence

- Build passes. Eleven unit tests pass, including ICS/cache/failure coverage plus ordinal weekdays, fifth-week exclusion, unanchored fortnightly schedules, Boston midnight/DST, time sorting and inert rendered text.
- Chromium 148.0.7778.96 and WebKit 26.4 pass the homepage's full-screen composition, complete introduction, daily/ordinal schedules, midnight change, expanded schedule, record deep links, loading/empty/error/partial states, image failure, forced colors and short landscape checks.
- Header plus hero ends at the viewport bottom at normal text size for 1440×1000, 390×844 and 320×844. Short windows and enlarged text extend the hero naturally; essential text and actions are not clipped.
- All 18 first-party pages have zero detected axe violations, excluding external iframes. No horizontal page overflow across 320,390,430,768,820,1024,1280,1440px. All 18 pages at 200% text enlargement pass at 390 and 1440px. The expanded weekly schedule also passes axe checks.
- Existing navigation journeys pass in both engines; directory filtering/contact/directions, resource anchors, subscription copy/fallback and external handoffs remain working. Local link check: 18 pages, 30 destinations, 110 anchors; no broken local targets.
- Hero white-text worst-case contrast remains 6.70:1 with the retained 64% black scrim. Header/action/resource gradient sampling remains passing. Print, forced colors and failed hero-image checks retain readable content.
- Desktop/mobile proofs for hero, schedule and path are in ignored `outputs/homepage-path-2026-10-19/`. The rendered artwork and reading columns were inspected: desktop alternating content, phone single column with a masked margin, no artwork over text or controls. Soft masks prevent sharp canopy crop edges. Decorative repetition is not a factual map or numbered process.

The original hero regression test supplied viewport options to a page creation method that ignored them. Its viewport is now set explicitly; the actual 1000px viewport and measured 89px header produce a 911px hero. The new cross-engine tests independently verify the whole first-screen boundary.

## Accessibility boundaries and release

This is implementation verification, not independent WCAG certification. Native Safari/VoiceOver, NVDA, iOS VoiceOver and TalkBack were not tested. Existing map, optional Google Calendar, external form and historical PDF limitations remain as documented in earlier reports and the public accessibility statement.

`PRESERVATION.md` records the previous source/tag/deployment. Release proceeds through protected Vercel preview verification, GitHub main push, explicit production deployment to the existing project, live browser checks and source/asset byte comparison. Final deployment and source identifiers are recorded afterward in ignored local `outputs/homepage-path-2026-10-19/release.json`; this document does not pre-claim completion of rollout.
