import { logger } from '@/utils/logger'
import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
    defaultOptions:{
        queries: {
            retry: 0, // Disable retries by default
            refetchOnWindowFocus: false, // Disable refetching on window focus
            refetchOnReconnect: false, // Disable refetching on reconnect
                staleTime: 5 * 60 * 1000, // Data is considered fresh for 5 minutes
                gcTime: 10 * 60 * 1000 // Unused data is garbage collected after 10 minutes
        }
    },
    queryCache: new QueryCache({
        onError: (error, query) => {
            logger.warn(error, {
                code: 'QUERY_FAILED',
                extra: { queryKey: query.queryKey },
            })
        },
    }),
    mutationCache: new MutationCache({
        onError: (error, _vars, _ctx, mutation) => {
            logger.error('MUTATION_FAILED', error, {
                extra: { mutationKey: mutation.options.mutationKey },
            })
        },
    }),
})