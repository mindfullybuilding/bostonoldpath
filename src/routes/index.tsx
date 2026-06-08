import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <main className="min-h-screen bg-background px-6 py-16 text-foreground">
      <section className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Boston Old Path Sangha
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
          Mindfulness in Boston and everywhere.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
          This app shell is intentionally minimal while the BOPS homepage experience is being
          prototyped in standalone HTML.
        </p>
        <p className="mt-8 rounded-md border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          Prototype artifact:{" "}
          <code className="font-mono text-foreground">
            design-prototypes/bops-homepage-wireframe.html
          </code>
        </p>
      </section>
    </main>
  );
}
