import { useEffect, type ReactNode } from 'react'
import { BrowserRouter } from 'react-router'
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query'

import { AppRoutes } from '@/routes'
import { setSessionClearedHandler } from '@/shared/store/authStore'

import './shellCards.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function SessionCacheBridge({ children }: { children: ReactNode }) {
  const client = useQueryClient()

  useEffect(() => {
    setSessionClearedHandler(() => {
      client.clear()
    })
    return () => setSessionClearedHandler(null)
  }, [client])

  return children
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionCacheBridge>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </SessionCacheBridge>
    </QueryClientProvider>
  )
}
