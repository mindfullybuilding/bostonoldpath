import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <iframe
      src="/bops-homepage-wireframe-6.15.26.html"
      title="BOPS Homepage Wireframe"
      className="block h-screen w-screen border-0"
    />
  );
}
