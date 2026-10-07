import { QueryClient, QueryCache, MutationCache } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { queryRetryOptions, mutationRetryOptions } from "@/lib/resilience/retry-policy";
import { reportBackendFailure, reportBackendSuccess } from "@/lib/resilience/backend-health";

export const getRouter = () => {
  // ported from App.tsx: resilience-aware cache and retry policy
  const queryClient = new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => reportBackendFailure(error),
      onSuccess: () => reportBackendSuccess(),
    }),
    mutationCache: new MutationCache({
      onError: (error) => reportBackendFailure(error),
      onSuccess: () => reportBackendSuccess(),
    }),
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
        refetchOnWindowFocus: false,
        ...queryRetryOptions,
      },
      mutations: {
        ...mutationRetryOptions,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
