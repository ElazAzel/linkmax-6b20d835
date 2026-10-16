import { createFileRoute } from "@tanstack/react-router";
import { fetchPublicPageSnapshot } from "@/lib/seo/public-page-snapshot";
import { buildProfileMarkdown } from "@/lib/seo/profile-markdown";

// Markdown twin of a public page for LLM crawlers; linked from the page head.
export const Route = createFileRoute("/$slug/llms.txt")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const snapshot = await fetchPublicPageSnapshot(params.slug);
        if (snapshot.status === "missing") {
          return new Response("Not found\n", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });
        }
        if (snapshot.status !== "ok" || snapshot.page.isIndexable === false) {
          return new Response("Unavailable\n", { status: snapshot.status === "ok" ? 404 : 503, headers: { "content-type": "text/plain; charset=utf-8" } });
        }
        return new Response(buildProfileMarkdown(snapshot.page), {
          headers: {
            "content-type": "text/markdown; charset=utf-8",
            "cache-control": "public, max-age=300, s-maxage=3600",
            "x-robots-tag": "noindex",
          },
        });
      },
    },
  },
});
