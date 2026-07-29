import { Link, useLocation } from 'wouter';
import { useClerk, useUser } from '@clerk/react';
import {
  LayoutDashboard, Package, Users, FileText, Newspaper,
  UserCog, Warehouse, Truck, ClipboardList, LogOut, ChevronRight,
  Bell, BarChart2, Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

const nav = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Package, label: 'Shipments', href: '/shipments' },
  { icon: Users, label: 'Customers', href: '/customers' },
  { icon: FileText, label: 'Quotes', href: '/quotes' },
  { icon: Newspaper, label: 'News & CMS', href: '/news' },
  { icon: UserCog, label: 'Staff Users', href: '/users' },
  { icon: Warehouse, label: 'Warehouses', href: '/warehouses' },
  { icon: Truck, label: 'Carriers', href: '/carriers' },
  { icon: Bell, label: 'Notifications', href: '/notifications' },
  { icon: BarChart2, label: 'Reports', href: '/reports' },
  { icon: ClipboardList, label: 'Audit Logs', href: '/audit-logs' },
  { icon: Settings, label: 'Settings', href: '/settings' },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { signOut } = useClerk();
  const { user } = useUser();

  return (
    <aside className="w-60 flex-shrink-0 bg-sidebar flex flex-col h-full border-r border-sidebar-border">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center">
            <span className="text-[10px] font-black text-sidebar">STG</span>
          </div>
          <div>
            <div className="text-sidebar-foreground font-bold text-sm leading-tight">Sinovera Transit</div>
            <div className="text-[#64748b] text-[10px] leading-tight">Admin Portal</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map(({ icon: Icon, label, href }) => {
          const active = location === href || location.startsWith(href + '/');
          return (
            <Link key={href} href={href}>
              <a
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors group',
                  active
                    ? 'bg-sidebar-accent text-sidebar-foreground'
                    : 'text-[#94a3b8] hover:bg-sidebar-accent hover:text-sidebar-foreground'
                )}
              >
                <Icon size={16} className={active ? 'text-secondary' : 'text-[#64748b] group-hover:text-[#94a3b8]'} />
                {label}
                {active && <ChevronRight size={12} className="ml-auto text-secondary" />}
              </a>
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center flex-shrink-0">
            {user?.imageUrl ? (
              <img src={user.imageUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <span className="text-xs font-semibold text-sidebar-foreground">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sidebar-foreground text-xs font-semibold truncate">
              {user?.firstName} {user?.lastName}
            </div>
            <div className="text-[#64748b] text-[10px] truncate">
              {user?.primaryEmailAddress?.emailAddress}
            </div>
          </div>
          <button
            onClick={() => signOut({ redirectUrl: basePath || '/' })}
            className="text-[#64748b] hover:text-red-400 transition-colors"
            title="Sign out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
