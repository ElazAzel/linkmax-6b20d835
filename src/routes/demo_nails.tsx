import { createFileRoute, redirect } from "@tanstack/react-router";
import { CanonicalDemoRedirect as CanonicalDemoRedirect } from "@/components/routing/CanonicalDemoRedirect";

export const Route = createFileRoute("/demo_nails")({
  beforeLoad: ({ location }) => { throw redirect({ href: `/demo-nails${location.searchStr}`, statusCode: 301 }); },
  component: CanonicalDemoRedirect,
});
