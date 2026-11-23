# Mindfulness Communities of Greater Boston

The [Boston Mindfulness website](https://bostonmindfulness.vercel.app) is a static HTML site with a Vercel function for the community calendar.

## Local development

Use Node.js 24 and npm. If you use nvm, run `nvm use` from the repository root.

```sh
npm ci
npm run dev
```

Open [http://127.0.0.1:4173](http://127.0.0.1:4173). After changing content or assets, run `npm run build` to refresh the running preview. `npm run preview` serves an existing build.

| Path                                                          | What to edit                                                                                               |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `site/pages/`                                                 | One HTML template per page. Edit `home.html` for the homepage or the file that matches another page’s URL. |
| `site/layouts/`                                               | Shared HTML, header, footer, navigation, and breadcrumbs                                                   |
| `site/page-titles.json`                                       | Page registration and browser tab titles                                                                   |
| `site/sanghas.json`, `site/resources.json`, `site/config.mjs` | Directory records, resource listings, and shared links                                                     |
| `scripts/build-site.mjs`                                      | Reads the templates and data and writes the website                                                        |
| `public/assets/`                                              | Styles, browser JavaScript, images, and public documents                                                   |
| `api/events.js` and `lib/events.mjs`                          | Calendar endpoint and Groups.io feed processing                                                            |
| `vercel.json`                                                 | Build settings, legacy redirects, and response headers                                                     |
| `tests/`                                                      | Unit tests and browser checks                                                                              |
| `dist/`                                                       | Generated website, rebuilt by `npm run build` and ignored by Git                                           |

Page templates use [Mustache](https://github.com/janl/mustache.js/#templates). Edit ordinary HTML for copy and layout. Leave placeholders such as `{{{monthTable}}}` in place unless you’re changing that feature. A matching `.mjs` file contains the data or rendering logic for pages that need it. Repeated sangha cards use `site/pages/partials/sangha-card.html`. To add a page, add its HTML file and an entry in `site/page-titles.json`.

[DESIGN.md](DESIGN.md) covers shared design conventions. [Design prototypes](design-prototypes/) and [release notes](docs/) document earlier iterations. The calligraphy assets used by the site are in `public/assets/`.

## Working on a change

Create a short-lived branch from current `main`, push it, and open a pull request into `main`.

```sh
git switch main
git pull --ff-only
git switch -c fix/example
# Make the change and commit it.
git push -u origin fix/example
```

GitHub Actions runs lint, unit tests, the build, internal link checks, and the fixture-based Plumline browser check for pull requests into `main` and pushes to `main`. Review the diff and checks before squash-merging. For visual changes, record the tested commit, build mode, pages, and screen sizes. The repository's GitHub plan currently requires this review convention to be followed manually.

## First change: update a sangha listing

1. Start a branch from current `main` using the steps above.
2. Open [site/sanghas.json](site/sanghas.json) and find `path-of-peace-sangha` as an example. For a confirmed meeting-time correction, edit `time` and check whether `timeBand` also needs to change. If the meeting day changes, update both the displayed `day` and the `days` array used by the filters. Keep the record’s `id` stable so existing links keep working.
3. Run `npm run dev` and open [Find a Sangha locally](http://127.0.0.1:4173/find-a-sangha.html). Search for the group, expand its card, and check the edited details and relevant filters.
4. Open a pull request with the confirmed change, its source, and what you checked in the preview. The directory, homepage schedule, and browser filters all use the same source data.

If you use VS Code, the [contributor CodeTour](.tours/new-joiner-site.tour) follows a record from source through the build and shows where calendar and deployment changes belong.

## Plumline directory preview

```sh
npm run build:plumline-preview
MCGB_PREVIEW_PORT=4175 npm run preview
```

Open [Find a Sangha with sample data](http://127.0.0.1:4175/find-a-sangha.html) and the [homepage schedule](http://127.0.0.1:4175/). The fixture preview exercises the importer, map, and schedule without contacting Plumline. The `codex/mcgb-plumline-finder` and `codex/mcgb-finder-quality` Vercel previews build from `site/plumline-preview.json`, a committed snapshot of the imported MCGB listings. The normal build uses the editorial directory. With the sample preview running, run `TEST_BASE=http://127.0.0.1:4175 node tests/plumline-finder-browser.mjs` for the focused browser check.

While source records are being corrected, the preview withholds Dandelions’ disputed in-person sitting and links to the [teacher’s schedule](https://www.yenkuei.org/services). The preview includes the [Wake Up Boston organizer’s December 13 sitting](https://bostonwakeup.substack.com/about) if it is missing from the snapshot. The preview uses the same reviewed details in the directory and Today’s Sanghas. These adjustments are scoped to the preview.

After obtaining a key, provide it via the private `PLUMLINE_API_KEY` environment variable and run `node scripts/refresh-plumline.mjs --review-matches`. Check the proposed associations against the public listings and organizer records before adding IDs to `site/plumline-roster.json`. Confirm which venues can be pinned or used for directions. Keep pending or local-only groups on the editorial data until reviewed.

Run `node scripts/refresh-plumline.mjs` to create a private review candidate. To inspect that candidate locally, pass it to `npm run build -- --plumline-snapshot .cache/plumline/candidate.json`. Review missing groups, contact routes, map pins, and schedule exceptions. To update the hosted review branch, copy only the normalized `sanghas` array into `site/plumline-preview.json` and redeploy that branch. After the first live candidate is approved, retain its normalized snapshot as `site/plumline-approved.json` for comparison. Review changed candidates weekly and replace that baseline only with an approved snapshot. A failed check keeps the last approved data available. Production uses the editorial directory until the live cutover is approved.

The **Check Plumline directory** workflow is configured for 10:17 UTC daily. GitHub schedules the workflow after it reaches the default branch. The check requires `PLUMLINE_API_KEY` and compares results with the last approved live snapshot in `site/plumline-approved.json`, when available. The run summary records HTTP 200 or 304 and whether a candidate needs review. A missing key or roster fails the check.

Local imports and scheduled checks send the last applicable ETag in `If-None-Match`. HTTP 304 confirms the upstream response is unchanged. A public repository records pending review after HTTP 304 without another download. A private runner can make one full request to restore a missing pending artifact. Changes to the roster, baseline, or importer trigger a new review of the data. GitHub caches the validator and review metadata. Private repositories can retain a candidate artifact. In this public repository, the summary records that review is pending and the normalized candidate is retrieved locally. Publishing the snapshot is a separate review and deployment step.

## Verification

Run `npm run lint`, `npm test`, and `npm run build`. For browser checks, install Chromium and WebKit with `npx playwright install chromium webkit`, start `npm run preview`, and run `npm run test:browser` in a second terminal.

With the built preview running and Chromium installed, run `npm run test:links` to repeat the CI page and link check. The calendar reads the public Groups.io feed. Browser fixtures simulate calendar responses without publishing events.

## Deployment

The GitHub-linked [bostonoldpath Vercel project](https://vercel.com/mindfullybuildings-projects/bostonoldpath) builds the repository root with `npm ci` and `npm run build`. Vercel uses `main` for production and feature branches for previews. The project serves `dist/` and runs `api/events.js` directly.

The public domain points to the Git-backed `bostonoldpath` project. After a production merge, check the public homepage, directory, calendar API, and any affected redirects.
