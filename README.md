# Mindfulness Communities of Greater Boston

First-party HTML website deployed to the existing Vercel project `bostonoldpath`, with production at https://bostonmindfulness.vercel.app.

## Editing and building

- `DESIGN.md` governs shared spacing, type, color, components, responsive behavior, and editorial rules.
- `scripts/build-site.mjs` contains the shared header/footer and current page copy. Its output is the canonical `public/*.html` site; edit the source and regenerate rather than editing generated HTML.
- `site/content/` holds the practice and facilitator reading pages.
- `site/sanghas.json` preserves the original 13 group records. Organizer details are rendered into HTML so they remain available without JavaScript.
- `site/resources.json` holds resource groups and legacy deep-link identifiers.
- `site/config.mjs` is the single configuration point for the contribution form, contact address, public ICS feed, and optional Google Calendar embed.
- `public/assets/mcgb.css` and `mcgb.js` provide shared styles and progressive interactions.
- `lib/events.mjs` and `api/events.js` implement the fixed-source calendar endpoint. No API credentials or Google account access are required.

Run `npm ci`, `npm run dev`, and open http://127.0.0.1:4173. Run `npm run build` to regenerate HTML and copy public assets into `dist/client`. Vercel uses this same build, existing routing, and the root `/api/events` function. The earlier React/TanStack scaffolding is retained for source history but is not part of the HTML build or production page rendering.

## Verification

Run `npm run lint` and `npm test`. With the preview server running, run `npm run test:browser`, `node tests/states.mjs`, `node tests/enlargement.mjs`, and `node tests/links.mjs`. Browser checks use installed Playwright browsers. `TEST_BASE` can target production for the read-only browser checks. Test fixtures never publish invented calendar events.

Release evidence and limitations: `docs/release-2026-10-19/`. The subsequent background-hero and Boston palette refinement is documented in `docs/hero-refinement-2026-10-19/`. Accessibility verification is not independent certification. Native Safari/VoiceOver testing could not be performed because computer-use access to Safari was denied; WebKit testing is separately identified and is not a substitute for VoiceOver.

## Calendar

Groups.io remains the source. `/api/events` expands the next 180 days with node-ical, including recurrence exceptions and daylight saving. Successful responses cache for five minutes; upstream requests time out after ten seconds. Descriptions render as inert text, and source URLs allow HTTP(S) only.

The supplied imported Google Calendar requires sign-in and has no public-sharing control in the available settings. Following the user’s decision, the public website agenda and ICS subscription instructions are primary; Google Calendar is an optional disclosed signed-in view. No Google account information is stored in this project. The contribution form was verified anonymously without submitting a response.

## Preservation and deployment

The previous source is saved in `design-prototypes/archive/2026-10-19-live/`, with baseline metadata and immutable previous deployment URL in `BASELINE.json`. Git tag: `mcgb-pre-redesign-2026-10-19`. The archive is excluded from deployment and public navigation. Local meeting references and browser output are ignored by Git; the meeting PDF is also excluded from deployment.

Use the existing `.vercel/project.json` link (local and ignored). Do not create a replacement project. Push the tested revision to `main`, then deploy with `npx vercel@latest deploy --prod --yes`; verify the public domain, API, primary journeys, and legacy redirects. The previous ready deployment can be restored with Vercel rollback using the URL recorded in `BASELINE.json`.
