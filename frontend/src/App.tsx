import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Dashboard } from "./pages/Dashboard";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div style={{ minHeight: "100vh", background: "#f9fafb" }}>
        <Dashboard />
      </div>
    </QueryClientProvider>
  );
}

export default App;
