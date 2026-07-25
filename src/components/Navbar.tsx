import { Bell, Search, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from '@/hooks/useRouter';
import type { Page } from '@/lib/types';

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  dashboard:        { title: 'Dashboard',        subtitle: 'Overview of your operations' },
  customers:        { title: 'Customers',         subtitle: 'Manage your CRM contacts' },
  'customer-detail':{ title: 'Customer Detail',  subtitle: 'View and manage customer info' },
  'customer-add':   { title: 'Add Customer',      subtitle: 'Create a new customer record' },
  'customer-edit':  { title: 'Edit Customer',    subtitle: 'Update customer information' },
  inventory:        { title: 'Inventory',         subtitle: 'Products and stock levels' },
  'product-add':    { title: 'Add Product',       subtitle: 'Create a new product' },
  'product-edit':   { title: 'Edit Product',      subtitle: 'Update product details' },
  'stock-movements':{ title: 'Stock Movements',   subtitle: 'Audit log of all stock changes' },
  challans:         { title: 'Sales Challans',    subtitle: 'Delivery and order challans' },
  'challan-add':    { title: 'New Challan',       subtitle: 'Create a new sales challan' },
  'challan-detail': { title: 'Challan Detail',    subtitle: 'View challan items and status' },
  accounts:         { title: 'Accounts',          subtitle: 'Financial overview and receivables' },
  reports:          { title: 'Reports & Analytics',subtitle: 'Business intelligence insights' },
  settings:         { title: 'Account Settings',  subtitle: 'Manage your profile and role' },
};

export default function Navbar() {
  const { profile } = useAuth();
  const { page } = useRouter();
  const info = pageTitles[page] ?? { title: 'OpsPortal', subtitle: '' };

  return (
    <header className="glass-nav sticky top-0 z-30 h-16 px-6 flex items-center justify-between">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">{info.title}</h1>
        <p className="text-xs text-gray-500">{info.subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search…"
            className="pl-9 pr-4 py-2 w-56 bg-white/70 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
          />
        </div>

        <button className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
        </button>

        <div className="h-6 w-px bg-gray-200" />

        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-full bg-primary-600 text-white text-xs font-bold">
            {profile?.full_name.charAt(0).toUpperCase() ?? '?'}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-800 leading-tight">{profile?.full_name}</p>
            <div className="flex items-center gap-1">
              <Shield size={10} className="text-primary-500" />
              <p className="text-xs text-gray-500 capitalize">{profile?.role}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
