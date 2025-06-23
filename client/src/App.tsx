import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { useIsTablet } from "@/hooks/use-tablet";
import AuthPage from "@/pages/auth-page";
import Home from "@/pages/Home";
import Chat from "@/pages/Chat";
import Management from "@/pages/Management";
import MasterAdmin from "@/pages/MasterAdmin";
import TabletLayout from "@/components/TabletLayout";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const isTablet = useIsTablet();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <>
          <Route path="/auth" component={AuthPage} />
          <Route path="*">
            {() => {
              window.location.replace("/auth");
              return null;
            }}
          </Route>
        </>
      ) : (
        <>
          <Route path="/master-admin" component={MasterAdmin} />
          
          {isTablet ? (
            <>
              <Route path="/" component={TabletLayout} />
              <Route path="/chat/:agentId" component={TabletLayout} />
              <Route path="/management" component={TabletLayout} />
              <Route path="/management/:agentId" component={TabletLayout} />
            </>
          ) : (
            <>
              <Route path="/" component={Home} />
              <Route path="/chat/:agentId" component={Chat} />
              <Route path="/management" component={Home} />
              <Route path="/management/:agentId" component={Management} />
            </>
          )}
        </>
      )}
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}

export default App;