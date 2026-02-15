import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes (User requirement)
            gcTime: 1000 * 60 * 30, // 30 minutes (User requirement "cacheTime", now called gcTime in v5)
            refetchOnMount: false,
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
            retry: 2,
        },
    },
});
