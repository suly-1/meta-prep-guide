/**
 * Standalone App — uses hash-based routing so it works from any CDN URL.
 * e.g. https://cdn.example.com/guide.html#/ instead of /
 */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Router, Switch } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import ErrorBoundary from "./components/ErrorBoundary";
import StandaloneAdminGate from "./components/StandaloneAdminGate";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      {/* Admin routes: PIN gate that redirects to metaguide.one on correct PIN */}
      <Route path="/admin" component={StandaloneAdminGate} />
      <Route path="/admin/:rest*" component={StandaloneAdminGate} />
      {/* Fallback */}
      <Route component={Home} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable>
        <TooltipProvider>
          <Toaster />
          {/* Use hash location so the app works from any CDN path */}
          <Router hook={useHashLocation}>
            <AppRouter />
          </Router>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
