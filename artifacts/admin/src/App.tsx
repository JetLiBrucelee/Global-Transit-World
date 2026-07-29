import { useEffect, useRef } from 'react';
import { ClerkProvider, SignIn, Show, useClerk, useUser } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { Switch, Route, Redirect, useLocation, Router as WouterRouter } from 'wouter';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import AdminLayout from '@/components/layout/AdminLayout';
import DashboardPage from '@/pages/DashboardPage';
import ShipmentsPage from '@/pages/ShipmentsPage';
import ShipmentDetailPage from '@/pages/ShipmentDetailPage';
import CustomersPage from '@/pages/CustomersPage';
import CustomerDetailPage from '@/pages/CustomerDetailPage';
import QuotesPage from '@/pages/QuotesPage';
import NewsPage from '@/pages/NewsPage';
import UsersPage from '@/pages/UsersPage';
import WarehousesPage from '@/pages/WarehousesPage';
import CarriersPage from '@/pages/CarriersPage';
import AuditLogsPage from '@/pages/AuditLogsPage';
import NotificationsPage from '@/pages/NotificationsPage';
import ReportsPage from '@/pages/ReportsPage';
import SettingsPage from '@/pages/SettingsPage';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

// REQUIRED — copy verbatim
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || '/'
    : path;
}

if (!clerkPubKey) throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY');

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: '#1a2744',
    colorForeground: '#1a2744',
    colorMutedForeground: '#64748b',
    colorDanger: '#ef4444',
    colorBackground: '#ffffff',
    colorInput: '#f1f5f9',
    colorInputForeground: '#1a2744',
    colorNeutral: '#e2e8f0',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    borderRadius: '0.5rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-2xl',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-[#1a2744] font-bold',
    headerSubtitle: 'text-[#64748b]',
    socialButtonsBlockButtonText: 'text-[#1a2744]',
    formFieldLabel: 'text-[#1a2744] font-medium',
    footerActionLink: 'text-[#1a2744] font-semibold',
    footerActionText: 'text-[#64748b]',
    dividerText: 'text-[#64748b]',
    identityPreviewEditButton: 'text-[#1a2744]',
    formFieldSuccessText: 'text-green-600',
    alertText: 'text-[#1a2744]',
    logoBox: 'flex justify-center py-2',
    logoImage: 'h-10',
    socialButtonsBlockButton: 'border border-[#e2e8f0] bg-white',
    formButtonPrimary: 'bg-[#1a2744] hover:bg-[#243256] text-white',
    formFieldInput: 'bg-[#f1f5f9] border-[#e2e8f0] text-[#1a2744]',
    footerAction: 'bg-[#f8fafc]',
    dividerLine: 'bg-[#e2e8f0]',
    alert: 'bg-[#fef2f2]',
    otpCodeFieldInput: 'border-[#e2e8f0] bg-[#f1f5f9]',
    formFieldRow: '',
    main: '',
  },
};

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);
  return null;
}

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#1a2744] to-[#1e3a6e] px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <p className="text-[#94a3b8] text-sm mt-1">Operations Management Portal</p>
        </div>
        {/* No signUpUrl — hides the "create account" link in Clerk UI */}
        <SignIn routing="path" path={`${basePath}/sign-in`} />
      </div>
    </div>
  );
}

function HomeLanding() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#1a2744] to-[#1e3a6e] px-4">
      <img src={`${basePath}/logo.svg`} alt="STG" className="h-14 mb-6" />
      <h1 className="text-3xl font-bold text-white mb-2">Sinovera Transit Global</h1>
      <p className="text-[#94a3b8] mb-8">Operations Management Portal</p>
      <a
        href={`${basePath}/sign-in`}
        className="bg-[#f5a623] text-[#1a2744] font-semibold px-8 py-3 rounded-lg hover:bg-[#e09420] transition-colors"
      >
        Sign In
      </a>
      <p className="text-[#475569] text-xs mt-6">Access is restricted to authorised staff only</p>
    </div>
  );
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in"><Redirect to="/dashboard" /></Show>
      <Show when="signed-out"><HomeLanding /></Show>
    </>
  );
}

function Guard({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Show when="signed-in">
        <AdminLayout>{children}</AdminLayout>
      </Show>
      <Show when="signed-out"><Redirect to="/sign-in" /></Show>
    </>
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
      localization={{
        signIn: { start: { title: 'STG Admin Portal', subtitle: 'Sign in to manage operations' } },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Switch>
            <Route path="/" component={HomeRedirect} />
            <Route path="/sign-in/*?" component={SignInPage} />
            {/* Sign-up is disabled — admin accounts are created by super-admins only */}
            <Route path="/sign-up/*?"><Redirect to="/sign-in" /></Route>
            <Route path="/dashboard">
              <Guard><DashboardPage /></Guard>
            </Route>
            <Route path="/shipments/:id">
              {(p: any) => <Guard><ShipmentDetailPage id={p?.id ?? ''} /></Guard>}
            </Route>
            <Route path="/shipments">
              <Guard><ShipmentsPage /></Guard>
            </Route>
            <Route path="/customers/:id">
              {(p: any) => <Guard><CustomerDetailPage id={p?.id ?? ''} /></Guard>}
            </Route>
            <Route path="/customers">
              <Guard><CustomersPage /></Guard>
            </Route>
            <Route path="/quotes">
              <Guard><QuotesPage /></Guard>
            </Route>
            <Route path="/news">
              <Guard><NewsPage /></Guard>
            </Route>
            <Route path="/users">
              <Guard><UsersPage /></Guard>
            </Route>
            <Route path="/warehouses">
              <Guard><WarehousesPage /></Guard>
            </Route>
            <Route path="/carriers">
              <Guard><CarriersPage /></Guard>
            </Route>
            <Route path="/audit-logs">
              <Guard><AuditLogsPage /></Guard>
            </Route>
            <Route path="/notifications">
              <Guard><NotificationsPage /></Guard>
            </Route>
            <Route path="/reports">
              <Guard><ReportsPage /></Guard>
            </Route>
            <Route path="/settings">
              <Guard><SettingsPage /></Guard>
            </Route>
            <Route component={NotFound} />
          </Switch>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}
