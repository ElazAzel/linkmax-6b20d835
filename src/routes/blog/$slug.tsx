import { buildMarketingHead } from '@/lib/seo/marketing-metadata';
import { createFileRoute, notFound } from "@tanstack/react-router";
import { getBlogPost } from '@/lib/blog-posts';
import BlogPost from "@/pages/BlogPost";

export const Route = createFileRoute("/blog/$slug")({
  beforeLoad: ({ params }) => { if (!getBlogPost(params.slug)) throw notFound(); },
  head: ({ match }) => buildMarketingHead(match),
  component: BlogPost,
});
