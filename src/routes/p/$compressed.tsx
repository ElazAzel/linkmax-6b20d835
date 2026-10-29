import { createFileRoute } from "@tanstack/react-router";
import PublicPage from "@/pages/PublicPage";
import { decompressPageData } from '@/lib/utils/compression';
import { buildPublicPageHead, buildMissingPageHead } from '@/lib/seo/public-page-seo';

export const Route = createFileRoute("/p/$compressed")({
  head: ({ params }) => {
    const page = decompressPageData(params.compressed);
    return page ? buildPublicPageHead(page) : buildMissingPageHead();
  },
  component: PublicPage,
});
