import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";

// Landing is the entry point, so it stays in the main chunk. Everything else is
// split: a school ordering a kit should not download the Lab and the organizer
// console to do it.
import Landing from "./pages/Landing";

const Apen2026 = lazy(() => import("./pages/Apen2026"));
const Store = lazy(() => import("./pages/Store"));
const OrderStatus = lazy(() => import("./pages/OrderStatus"));
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const StudentDashboard = lazy(() => import("./pages/StudentDashboard"));
const TeamSetupPage = lazy(() => import("./pages/TeamSetupPage"));
const JudgeDashboard = lazy(() => import("./pages/JudgeDashboard"));
const OrganizerLogin = lazy(() => import("./pages/OrganizerLogin"));
const OrganizerDashboard = lazy(() => import("./pages/OrganizerDashboard"));
const Privacy = lazy(() => import("./pages/Privacy"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // The kit catalogue changes at most once a season; refetching it on every
      // mount is wasted round trips on a slow connection.
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

const RouteFallback = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
  </div>
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Suspense fallback={<RouteFallback />}>
                <Routes>
                  {/* Shared entry — the STEAM Foundry brand home */}
                  <Route path="/" element={<Landing />} />

                  {/* This year's competition — Store + Lab entry, reached via
                      "Register for a Competition" on the home page */}
                  <Route path="/apen-2026" element={<Apen2026 />} />

                  {/* Store — public, no account needed */}
                  <Route path="/store" element={<Store />} />
                  <Route path="/order" element={<OrderStatus />} />
                  <Route path="/order/:reference" element={<OrderStatus />} />

                  {/* Lab — the competition: submissions, judging, feedback.
                      One sign-in for all four roles; each lands on its own view. */}
                  <Route path="/lab" element={<Login />} />
                  <Route path="/lab/dashboard" element={<Dashboard />} />
                  <Route path="/lab/student" element={<StudentDashboard />} />
                  <Route path="/lab/setup-teams" element={<TeamSetupPage />} />
                  <Route path="/lab/judge" element={<JudgeDashboard />} />

                  {/* Organizer console — Store + Lab admin, Supabase Auth gated */}
                  <Route path="/organizer/login" element={<OrganizerLogin />} />
                  <Route path="/organizer" element={<OrganizerDashboard />} />

                  {/* Legacy paths from the earlier shell */}
                  <Route path="/dashboard" element={<Navigate to="/lab/dashboard" replace />} />
                  <Route path="/admin" element={<Navigate to="/organizer" replace />} />

                  {/* Legal */}
                  <Route path="/privacy" element={<Privacy />} />

                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
