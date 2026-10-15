import { createFileRoute } from "@tanstack/react-router";
import { BookingManagement as BookingManagement } from "@/pages/BookingManagement";

export const Route = createFileRoute("/booking/manage/$token")({
  component: BookingManagement,
});
