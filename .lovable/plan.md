## Issue

`src/routes/index.tsx` currently renders placeholder text instead of the wireframe iframe. The static file `public/bops-homepage-wireframe.html` and its `public/assets/*` are still in place, so the fix is purely on the route component.

## Fix

Update `src/routes/index.tsx` so `Index()` returns a full-viewport iframe pointing at `/bops-homepage-wireframe.html`:

- `<iframe src="/bops-homepage-wireframe.html" title="BOPS Homepage Wireframe" className="h-screen w-screen border-0 block" />`
- Remove the placeholder `<main>`/`<section>` markup.

No other files change.
