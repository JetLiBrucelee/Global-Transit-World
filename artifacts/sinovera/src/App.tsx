import { useEffect, useRef } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from 'wouter';
import { QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { queryClient } from '@/lib/queryClient';
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
import NotFound from '@/pages/not-found';

import PortalDashboard from '@/pages/portal/PortalDashboard';
import ShipmentHistory from '@/pages/portal/ShipmentHistory';
import Notifications from '@/pages/portal/Notifications';
import PortalSettings from '@/pages/portal/PortalSettings';
import PortalSupport from '@/pages/portal/PortalSupport';
import ChatWidget from '@/components/ChatWidget';

// ── Clerk config ──────────────────────────────────────────────────────────────
// REQUIRED — copy verbatim. Resolves the key from window.location.hostname so
// the same build serves multiple Clerk custom domains.
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

// REQUIRED — copy verbatim. Empty in dev (Clerk hits dev FAPI directly),
// auto-set in prod. Do NOT gate on NODE_ENV.
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

// Clerk passes full paths; wouter's setLocation prepends the base — strip it.
function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || '/'
    : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY');
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: '#132143',
    colorForeground: '#132143',
    colorMutedForeground: '#6b7794',
    colorDanger: '#ef4444',
    colorBackground: '#ffffff',
    colorInput: '#eef2f8',
    colorInputForeground: '#132143',
    colorNeutral: '#dce4ef',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    borderRadius: '0.5rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-[#132143] font-bold',
    headerSubtitle: 'text-[#6b7794]',
    socialButtonsBlockButtonText: 'text-[#132143] font-medium',
    formFieldLabel: 'text-[#132143] font-medium',
    footerActionLink: 'text-[#132143] font-semibold hover:text-[#F59E0B]',
    footerActionText: 'text-[#6b7794]',
    dividerText: 'text-[#6b7794]',
    identityPreviewEditButton: 'text-[#132143]',
    formFieldSuccessText: 'text-green-600',
    alertText: 'text-[#132143]',
    logoBox: 'flex justify-center py-1',
    logoImage: 'w-14 h-14',
    socialButtonsBlockButton: 'border border-[#dce4ef] hover:border-[#132143] bg-white',
    formButtonPrimary: 'bg-[#132143] hover:bg-[#1e3260] text-white font-bold',
    formFieldInput: 'border-[#dce4ef] bg-[#eef2f8] text-[#132143]',
    footerAction: 'bg-transparent',
    dividerLine: 'bg-[#dce4ef]',
    alert: 'border-[#dce4ef]',
    otpCodeFieldInput: 'border-[#dce4ef] bg-[#eef2f8] text-[#132143]',
    formFieldRow: '',
    main: '',
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-slate-50 px-4 py-12">
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
      />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-slate-50 px-4 py-12">
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
      />
    </div>
  );
}

function PortalGuard({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Show when="signed-in">{children}</Show>
      <Show when="signed-out">
        <Redirect to="/sign-in" />
      </Show>
    </>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function PublicRoutes() {
  return (
    <RootLayout>
      <ChatWidget />
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
        <Route path="/portal">
          <PortalGuard><PortalDashboard /></PortalGuard>
        </Route>
        <Route path="/portal/shipments">
          <PortalGuard><ShipmentHistory /></PortalGuard>
        </Route>
        <Route path="/portal/notifications">
          <PortalGuard><Notifications /></PortalGuard>
        </Route>
        <Route path="/portal/settings">
          <PortalGuard><PortalSettings /></PortalGuard>
        </Route>
        <Route path="/portal/support">
          <PortalGuard><PortalSupport /></PortalGuard>
        </Route>
        <Route component={NotFound} />
      </Switch>
    </RootLayout>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: 'Welcome back',
            subtitle: 'Sign in to your Sinovera account',
          },
        },
        signUp: {
          start: {
            title: 'Create your account',
            subtitle: 'Track shipments, save bookmarks, and more',
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Switch>
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            <Route component={PublicRoutes} />
          </Switch>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <HelmetProvider>
      <WouterRouter base={basePath}>
        <ClerkProviderWithRoutes />
      </WouterRouter>
    </HelmetProvider>
  );
}

export default App;
