import { createFileRoute, notFound } from "@tanstack/react-router";
import Experts from "@/pages/Experts";
import { buildDirectoryHead, isKnownDirectory, loadExpertDirectory } from '@/lib/seo/directory-seo';
import { requestLanguage } from '@/lib/seo/site-policy';
import { pickLang } from '@/lib/seo/expert-hubs';
import i18n from '@/i18n/config';

export const Route = createFileRoute("/experts/city/$city")({
  loaderDeps: ({ search }) => search,
  loader: ({ params, location }) => {
    const filters = { city: params.city };
    if (!isKnownDirectory(filters)) throw notFound();
    return loadExpertDirectory(filters, new URLSearchParams(location.searchStr));
  },
  head: ({ loaderData, params, match }) => buildDirectoryHead('experts', { city: params.city },
    new URLSearchParams(match.search as Record<string, string>), loaderData?.experts ?? [], pickLang(typeof window === 'undefined' ? requestLanguage(match.pathname, new URLSearchParams(match.search as Record<string, string>).toString()) : i18n.language)),
  component: DirectoryRoute,
});

function DirectoryRoute() {
  return <Experts initialData={Route.useLoaderData()} />;
}
