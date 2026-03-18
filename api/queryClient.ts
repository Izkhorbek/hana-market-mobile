import { QueryClient } from "@tanstack/react-query"

export const queryClient = new QueryClient({
    defaultOptions:{
        queries: {
            retry: 0, // Disable retries by default
            refetchOnWindowFocus: false, // Disable refetching on window focus
            refetchOnReconnect: false, // Disable refetching on reconnect
                staleTime: 5 * 60 * 1000, // Data is considered fresh for 5 minutes
                gcTime: 10 * 60 * 1000 // Unused data is garbage collected after 10 minutes
        }
    }
})