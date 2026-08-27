import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";

import Landing from "./pages/Landing";
import Store from "./pages/Store";
import OrderStatus from "./pages/OrderStatus";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import OrganizerLogin from "./pages/OrganizerLogin";
import OrganizerDashboard from "./pages/OrganizerDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Shared entry */}
              <Route path="/" element={<Landing />} />

              {/* Store — public, no account needed */}
              <Route path="/store" element={<Store />} />
              <Route path="/order" element={<OrderStatus />} />
              <Route path="/order/:reference" element={<OrderStatus />} />

              {/* Lab — tier-themed learning space */}
              <Route path="/lab" element={<Login />} />
              <Route path="/lab/dashboard" element={<Dashboard />} />

              {/* Organizer console — Store + Lab admin, Supabase Auth gated */}
              <Route path="/organizer/login" element={<OrganizerLogin />} />
              <Route path="/organizer" element={<OrganizerDashboard />} />

              {/* Legacy paths from the earlier shell */}
              <Route path="/dashboard" element={<Navigate to="/lab/dashboard" replace />} />
              <Route path="/admin" element={<Navigate to="/organizer" replace />} />

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
