import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LandingPage } from "./components/landing/LandingPage";
import { SignInPage } from "./components/auth/SignInPage";
import { RepoSelection } from "./components/repos/RepoSelection";
import { LoadingAnimation } from "./components/loading/LoadingAnimation";
import { GraphView } from "./components/graph/GraphView";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <AuthProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/repos" element={<ProtectedRoute><RepoSelection /></ProtectedRoute>} />
            <Route path="/loading/:repoId" element={<ProtectedRoute><LoadingAnimation /></ProtectedRoute>} />
            <Route path="/graph/:repoId" element={<ProtectedRoute><GraphView /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </AuthProvider>
);

export default App;
