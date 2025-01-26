import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Settings from "./pages/Settings";
import { Toaster } from "@/components/ui/toaster";
import { SidebarProvider } from "@/components/ui/sidebar";
import { SubscriptionRequired } from "@/components/SubscriptionRequired";
import "./App.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <SidebarProvider defaultOpen={true}>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/"
              element={
                <SubscriptionRequired>
                  <Index />
                </SubscriptionRequired>
              }
            />
            <Route
              path="/settings"
              element={
                <SubscriptionRequired>
                  <Settings />
                </SubscriptionRequired>
              }
            />
            <Route path="*" element={<Navigate to="/auth" replace />} />
          </Routes>
          <Toaster />
        </SidebarProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;