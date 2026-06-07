## Goal

Display the existing `design-prototypes/bops-homepage-wireframe.html` (2,212 lines, self-contained HTML/CSS/JS) as the homepage at `/`.

## Approach

The wireframe is a fully self-contained static HTML file with inline styles and scripts. The cleanest way to "showcase" it without losing fidelity is to serve it as a static asset and render it on the React route — no need to port the markup into JSX (which would be a big, error-prone rewrite).

### Steps

1. **Copy the wireframe to `public/`** so Vite serves it at a stable URL:
   - `public/bops-homepage-wireframe.html`
   - Also copy any referenced assets (e.g. `assets/intro-page-hero.jpg`) into `public/assets/` so the `url("assets/...")` references resolve.

2. **Update `src/routes/index.tsx`** to render a full-viewport `<iframe>` pointing at `/bops-homepage-wireframe.html`. This shows the wireframe pixel-perfect inside the app.
   - `min-h-screen w-screen` iframe, no border, `title="BOPS Homepage"`.

3. **Update the root `head()` title/description** in `src/routes/__root.tsx` is already "Boston Old Path Sangha" — leave as is.

## Open question

Do you want this to be a **temporary showcase** (iframe of the static prototype, quickest path), or should I **port the wireframe into real React components** with TanStack routing, semantic design tokens in `src/styles.css`, and the shadcn UI kit (slower, but becomes the actual app you can iterate on)?

I'll proceed with the **iframe showcase** unless you say otherwise — it's the fastest way to see the wireframe live at `/`, and we can port it to React after.
