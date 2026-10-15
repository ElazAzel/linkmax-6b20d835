import { QueryClient } from "@tanstack/react-query";
import { createRouter, createRootRouteWithContext, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it, vi } from "vitest";

// Route matching needs the real file tree, not SSR document/providers/startup.
vi.mock('@/routes/__root', () => ({
  Route: createRootRouteWithContext<{ queryClient: QueryClient }>()({}),
}));

import { routeTree } from "@/routeTree.gen";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  it("matches a page for / instead of falling back to not found", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const matches = router.matchRoutes("/");

    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });
});
