import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ChatContainer from './components/ChatContainer/ChatContainer.tsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retryDelay: 1500,
      refetchOnReconnect: true,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <a href="#main-content" className="sr-only">Skip to main content</a>
      <ChatContainer />
    </QueryClientProvider>
  )
}

export default App
