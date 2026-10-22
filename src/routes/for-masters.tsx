import { createFileRoute, redirect } from "@tanstack/react-router";
import ForMasters from "@/pages/ForMasters";

export const Route = createFileRoute("/for-masters")({
  beforeLoad: () => { throw redirect({ href: '/для-бьюти-мастеров', statusCode: 301 }); },
  component: ForMasters,
});
