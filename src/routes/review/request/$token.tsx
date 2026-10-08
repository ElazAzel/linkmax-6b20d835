import { createFileRoute } from "@tanstack/react-router";
import ReviewRequest from "@/pages/ReviewRequest";

export const Route = createFileRoute("/review/request/$token")({
  component: ReviewRequest,
});
