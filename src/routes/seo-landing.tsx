import { createFileRoute, redirect } from '@tanstack/react-router';
export const Route = createFileRoute('/seo-landing')({
  beforeLoad: () => { throw redirect({ href: '/', statusCode: 301 }); },
});
