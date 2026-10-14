import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <iframe
      src="/home.html"
      title="Mindfulness Communities of Greater Boston"
      className="block h-screen w-screen border-0"
    />
  );
}
