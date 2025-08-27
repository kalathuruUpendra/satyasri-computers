import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthService } from "@/lib/auth";
import LoadingPage from "@/pages/loading";
import LoginPage from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import NotFound from "@/pages/not-found";

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      // Simulate loading time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check authentication
      try {
        if (AuthService.isAuthenticated()) {
          await AuthService.verifyToken();
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Authentication verification failed:', error);
        AuthService.clearAuth();
        setIsAuthenticated(false);
      }
      
      setIsLoading(false);
    };

    initializeApp();
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  if (isLoading) {
    return <LoadingPage />;
  }

  if (!isAuthenticated) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <LoginPage onLogin={handleLogin} />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Switch>
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/tech-dashboard" component={Dashboard} />
          <Route path="/add-ticket" component={Dashboard} />
          <Route path="/orders" component={Dashboard} />
          <Route path="/completed-orders" component={Dashboard} />
          <Route path="/customers" component={Dashboard} />
          <Route path="/reports" component={Dashboard} />
          <Route path="/assigned-orders" component={Dashboard} />
          <Route path="/service-notes" component={Dashboard} />
          <Route path="/" component={Dashboard} />
          <Route component={NotFound} />
        </Switch>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
