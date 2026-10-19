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
