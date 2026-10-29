import { buildMarketingHead } from '@/lib/seo/marketing-metadata';
import { createFileRoute, notFound } from "@tanstack/react-router";
import { getBlogPost } from '@/lib/blog-posts';
import BlogPost from "@/pages/BlogPost";

export const Route = createFileRoute("/blog/$slug")({
  head: ({ match }) => buildMarketingHead(match),
  beforeLoad: ({ params }) => { if (!getBlogPost(params.slug)) throw notFound(); },
  component: BlogPost,
});
