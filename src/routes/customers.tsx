import { createFileRoute } from "@tanstack/react-router";
import Customers from "@/pages/Customers";

export const Route = createFileRoute("/customers")({
  component: Customers,
});
