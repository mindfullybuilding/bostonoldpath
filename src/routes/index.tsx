import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <iframe
      src="/bops-homepage-wireframe.html"
      title="BOPS Homepage"
      className="block h-screen w-screen border-0"
    />
  );
}
