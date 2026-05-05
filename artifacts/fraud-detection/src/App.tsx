import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout";
import Dashboard from "@/pages/dashboard";
import AlertsDashboard from "@/pages/alerts";
import CasesInterface from "@/pages/cases";
import RulesBuilder from "@/pages/rules";
import UsersScoring from "@/pages/users";
import MerchantsManager from "@/pages/merchants";
import SARPortal from "@/pages/sar";
import AnalyticsExplorer from "@/pages/analytics";
import ModelPerformance from "@/pages/model-performance";
import InvestigationTimeline from "@/pages/investigation";
import CommunicationsPanel from "@/pages/communications";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/alerts" component={AlertsDashboard} />
        <Route path="/cases" component={CasesInterface} />
        <Route path="/rules" component={RulesBuilder} />
        <Route path="/users" component={UsersScoring} />
        <Route path="/merchants" component={MerchantsManager} />
        <Route path="/sar" component={SARPortal} />
        <Route path="/analytics" component={AnalyticsExplorer} />
        <Route path="/model-performance" component={ModelPerformance} />
        <Route path="/investigation" component={InvestigationTimeline} />
        <Route path="/communications" component={CommunicationsPanel} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
