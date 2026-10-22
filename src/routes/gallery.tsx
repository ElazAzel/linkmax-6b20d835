import { createFileRoute } from "@tanstack/react-router";
import Gallery from "@/pages/Gallery";
import { getGalleryPages } from '@/services/gallery';
import { buildDirectoryHead } from '@/lib/seo/directory-seo';
import { requestLanguage } from '@/lib/seo/site-policy';
import { pickLang } from '@/lib/seo/expert-hubs';
import i18n from '@/i18n/config';

export const Route = createFileRoute("/gallery")({
  loader: () => getGalleryPages(undefined, undefined, { throwOnError: true }),
  head: ({ loaderData, match }) => buildDirectoryHead('gallery', {}, new URLSearchParams(match.search as Record<string, string>), loaderData ?? [], pickLang(typeof window === 'undefined' ? requestLanguage(match.pathname, new URLSearchParams(match.search as Record<string, string>).toString()) : i18n.language)),
  component: GalleryRoute,
});

function GalleryRoute() {
  return <Gallery initialPages={Route.useLoaderData()} />;
}
