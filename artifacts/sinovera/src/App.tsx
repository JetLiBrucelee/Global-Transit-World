import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { RootLayout } from '@/components/layout/RootLayout';

import Home from '@/pages/Home';
import Track from '@/pages/Track';
import TrackDetail from '@/pages/TrackDetail';
import Services from '@/pages/Services';
import ServiceDetail from '@/pages/ServiceDetail';
import Quote from '@/pages/Quote';
import About from '@/pages/About';
import Contact from '@/pages/Contact';
import Faq from '@/pages/Faq';
import News from '@/pages/News';
import NewsArticle from '@/pages/NewsArticle';
import Legal from '@/pages/Legal';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <RootLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/track" component={Track} />
        <Route path="/track/:trackingNumber" component={TrackDetail} />
        <Route path="/services" component={Services} />
        <Route path="/services/:slug" component={ServiceDetail} />
        <Route path="/quote" component={Quote} />
        <Route path="/about" component={About} />
        <Route path="/contact" component={Contact} />
        <Route path="/faq" component={Faq} />
        <Route path="/news" component={News} />
        <Route path="/news/:slug" component={NewsArticle} />
        <Route path="/legal/:slug" component={Legal} />
        <Route component={NotFound} />
      </Switch>
    </RootLayout>
  );
}

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
