import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

// We will create these pages next
import Home from "@/pages/Home";
import Assessment from "@/pages/Assessment";
import Chatbot from "@/pages/Chatbot";
import Education from "@/pages/Education";
import EducationModule from "@/pages/EducationModule";
import Clinics from "@/pages/Clinics";

const queryClient = new QueryClient();

function Router() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/evaluacion" component={Assessment} />
          <Route path="/chatbot" component={Chatbot} />
          <Route path="/educacion" component={Education} />
          <Route path="/educacion/:moduleId" component={EducationModule} />
          <Route path="/recursos" component={Clinics} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
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
