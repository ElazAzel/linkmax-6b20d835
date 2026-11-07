import { createFileRoute, notFound } from "@tanstack/react-router";
import BlogPost from "@/pages/BlogPost";

export const Route = createFileRoute("/blog/$slug")({
  beforeLoad: async ({ params }) => {
    const { getBlogPost } = await import('@/lib/blog-posts');
    if (!getBlogPost(params.slug)) throw notFound();
  },
  component: BlogPost,
});
