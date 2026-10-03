import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <iframe
      src="/mcgb-homepage-wireframe-feedback-2.html"
      title="MCGB Beginner's Mind Feedback"
      className="block h-screen w-screen border-0"
    />
  );
}
