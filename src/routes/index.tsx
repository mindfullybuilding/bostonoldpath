import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <iframe
      src="/bops-homepage-wireframe-feedback-1.html"
      title="BOPS Beginner's Mind Feedback"
      className="block h-screen w-screen border-0"
    />
  );
}
