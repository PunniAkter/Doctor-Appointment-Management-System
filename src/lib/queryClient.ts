import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,            // cache for 30s
      refetchOnWindowFocus: false,  // optional: don't refetch on focus
    },
  },
});
