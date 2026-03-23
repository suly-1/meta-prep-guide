import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import CollabRoom from "@/pages/CollabRoom";
import AdminDisclaimerReport from "@/pages/AdminDisclaimerReport";
import AdminFeedback from "@/pages/AdminFeedback";
import AdminStats from "@/pages/AdminStats";
import AdminAnalytics from "@/pages/AdminAnalytics";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/room/:roomId" component={CollabRoom} />
      <Route path="/admin/disclaimer" component={AdminDisclaimerReport} />
      <Route path="/admin/feedback" component={AdminFeedback} />
      <Route path="/admin/stats" component={AdminStats} />
      <Route path="/admin/analytics" component={AdminAnalytics} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
