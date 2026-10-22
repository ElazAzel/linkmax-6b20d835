import { createFileRoute, notFound, redirect } from '@tanstack/react-router';
import PublicServicePage from '@/components/screens/PublicServicePage';
import { fetchPublicPageSnapshot } from '@/lib/seo/public-page-snapshot';
import { resolvePublicService, buildServiceHead } from '@/lib/seo/service-page';

export const Route = createFileRoute("/$slug/services/$serviceSlug")({
  loader: async ({ params }) => {
    const snapshot = await fetchPublicPageSnapshot(params.slug);
    if (snapshot.status === 'missing') throw notFound();
    if (snapshot.status === 'error') throw new Error('Public service temporarily unavailable');
    const page = resolvePublicService(snapshot.page, params.serviceSlug);
    if (page.status === 'redirect') throw redirect({ href: `/${encodeURIComponent(params.slug)}`, statusCode: 301 });
    if (page.status !== 'ok') throw notFound();
    return page;
  },
  staleTime: 60_000,
  head: ({ loaderData }) => loaderData ? buildServiceHead(loaderData) : {},
  component: ServiceRoute,
});

function ServiceRoute() { return <PublicServicePage page={Route.useLoaderData()} />; }
