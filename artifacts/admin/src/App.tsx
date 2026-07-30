import { Switch, Route, Redirect, useLocation, Router as WouterRouter } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider, useAuth } from '@/lib/auth';
import AdminLayout from '@/components/layout/AdminLayout';
import LoginPage from '@/pages/LoginPage';
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
import ChatPage from '@/pages/ChatPage';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

function Guard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#0f172a]">
        <div className="w-8 h-8 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/sign-in" />;
  }

  return <AdminLayout>{children}</AdminLayout>;
}

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#0f172a]">
        <div className="w-8 h-8 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/sign-in">
        {isAuthenticated ? <Redirect to="/dashboard" /> : <LoginPage />}
      </Route>
      <Route path="/">
        <Redirect to={isAuthenticated ? '/dashboard' : '/sign-in'} />
      </Route>
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
      <Route path="/chat">
        <Guard><ChatPage /></Guard>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <WouterRouter base={basePath}>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <AppRoutes />
            <Toaster />
          </TooltipProvider>
        </QueryClientProvider>
      </AuthProvider>
    </WouterRouter>
  );
}
