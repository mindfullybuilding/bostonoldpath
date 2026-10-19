# Release record

Existing project: `bostonoldpath` / `prj_SNzjYjxE1A8MB6MpNBhx0iAkj9s4`.
Production alias: https://bostonmindfulness.vercel.app.
Baseline source: `4c70a36`, tag `mcgb-pre-redesign-2026-10-19`.
Prior ready deployment: `dpl_B65NWTLY4HcSmwDSA6gtFeapuGTY`.
Rollback URL: https://bostonoldpath-3wx6bad7g-mindfullybuildings-projects.vercel.app.
Snapshot: `design-prototypes/archive/2026-10-19-live/` (not deployed; not publicly linked).

The first protected preview built successfully and its `/api/events` endpoint returned valid JSON with an empty upcoming list, consistent with the source containing only a past test event. Final preview and production IDs and HTTP results are recorded in the production verification artifact after deployment. No new project, domain, Google calendar synchronization service, or duplicate event data was created.

Release changes include generated HTML pages, shared design system, updated directory presentation and progressive filters, Community Voices handoff, newsletter archive, subscription instructions, fixed-source calendar API, public accessibility statement, licensed photos, and legacy redirects.

Source security: compatible dependency updates resolved the initial high/moderate advisories. A low-severity advisory remains in the retained unused Vite development toolchain (Windows dev-server file-read advisory); the HTML build and runtime do not use that server. No credentials or Google account data are included. `.gitignore` excludes local browser outputs, environment files, project credentials, and working-group reference material, including the reference inside the dated archive. `.vercelignore` excludes the full archive and local audit material.

To roll back a blocking production regression, use the existing Vercel project and the prior deployment URL above. Do not replace the production domain or create another project. Recheck public root, finder, `/api/events`, and canonical legacy redirects after rollback.

Final preview: `dpl_5YJpjX1nneDcSwZauwhsAmgvroLi` / https://bostonoldpath-n37lkv3cr-mindfullybuildings-projects.vercel.app. Authenticated project CLI checks verified the canonical root HTML and the calendar API. The preview itself retains existing Vercel preview protection. Anonymous Google Form access was checked separately.

## Production verification

Main source revision `21bbdd7` was pushed to GitHub before explicit production deployment. Production deployment `dpl_CtP3vfVCsmUR3kiwaKweastr6NbK` / https://bostonoldpath-15jel0jlx-mindfullybuildings-projects.vercel.app reached READY and was aliased to https://bostonmindfulness.vercel.app.

Anonymous production checks at 2026-10-19 16:53 UTC passed: all 17 release pages returned 200; calendar API returned valid empty-upcoming JSON; licensed photo assets returned 200; tested legacy URLs returned 308 to canonical destinations; the excluded meeting PDF returned 404. The exact greeting, butter header/white button, hamburger drawer, directory filtering/contact details, calendar copy action, and contribution URL were verified in the live browser. See `production.json` and live screenshots. No rollback was necessary.

This production record is committed separately from the implementation; the final documentation revision is pushed to main and explicitly redeployed afterward. Production smoke checks are repeated after that deployment.
