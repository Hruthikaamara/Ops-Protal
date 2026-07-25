import {
  LayoutDashboard, Users, Package, FileText, BarChart3, Settings,
  Warehouse, Shield, ChevronLeft, Boxes, TrendingUp,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from '@/hooks/useRouter';
import type { Page, Role } from '@/lib/types';
import { useState } from 'react';

interface NavItem {
  page: Page;
  label: string;
  icon: React.ReactNode;
  roles: Role[];
}

const navItems: NavItem[] = [
  { page: 'dashboard',       label: 'Dashboard',       icon: <LayoutDashboard size={18} />, roles: ['admin','sales','warehouse','accounts'] },
  { page: 'customers',        label: 'Customers',        icon: <Users size={18} />,           roles: ['admin','sales'] },
  { page: 'inventory',       label: 'Inventory',        icon: <Package size={18} />,          roles: ['admin','warehouse'] },
  { page: 'stock-movements',  label: 'Stock Movements',  icon: <Boxes size={18} />,            roles: ['admin','warehouse'] },
  { page: 'challans',         label: 'Sales Challans',  icon: <FileText size={18} />,         roles: ['admin','sales'] },
  { page: 'accounts',        label: 'Accounts',         icon: <TrendingUp size={18} />,       roles: ['admin','accounts'] },
  { page: 'reports',         label: 'Reports',          icon: <BarChart3 size={18} />,        roles: ['admin','accounts','sales'] },
  { page: 'settings',        label: 'Settings',         icon: <Settings size={18} />,         roles: ['admin','sales','warehouse','accounts'] },
];

export default function Sidebar() {
  const { profile } = useAuth();
  const { page, navigate } = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  if (!profile) return null;
  const items = navItems.filter((i) => i.roles.includes(profile.role));

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-sidebar text-white flex flex-col z-40 transition-all duration-200 ${
        collapsed ? 'w-[68px]' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-white/5 shrink-0">
        <div className="p-2 rounded-lg bg-primary-600 shadow-lg shadow-primary-600/30">
          <Warehouse size={20} className="text-white" />
        </div>
        {!collapsed && (
          <div className="flex-1">
            <p className="text-sm font-bold tracking-tight">OpsPortal</p>
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Mini ERP</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {!collapsed && (
          <p className="px-3 mb-2 text-[10px] font-semibold text-gray-600 uppercase tracking-wider">Menu</p>
        )}
        {items.map((item) => (
          <div
            key={item.page}
            className={`sidebar-item ${page === item.page || page === `${item.page}-detail` ? 'active' : ''}`}
            onClick={() => navigate(item.page)}
            title={collapsed ? item.label : undefined}
          >
            <span className="shrink-0">{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </div>
        ))}
      </nav>

      {/* User card */}
      <div className="px-3 py-3 border-t border-white/5">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/5 cursor-pointer" onClick={() => navigate('settings')}>
          <div className="p-2 rounded-full bg-primary-600 text-white text-xs font-bold shrink-0">
            {profile.full_name.charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-200 truncate">{profile.full_name}</p>
              <p className="text-xs text-gray-500 capitalize">{profile.role}</p>
            </div>
          )}
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 p-1.5 rounded-full bg-white shadow-card-md border border-gray-100 text-gray-500 hover:text-primary-600 transition-colors"
      >
        <ChevronLeft size={14} className={`transition-transform ${collapsed ? 'rotate-180' : ''}`} />
      </button>
    </aside>
  );
}
