import { createFileRoute } from "@tanstack/react-router";
import { Saver } from "@/components/saver";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <Saver />;
}
