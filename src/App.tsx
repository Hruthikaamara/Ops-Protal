import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { RouterProvider, useRouter } from '@/hooks/useRouter';
import AppLayout from '@/components/AppLayout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import CustomersList from '@/pages/CustomersList';
import CustomerDetail from '@/pages/CustomerDetail';
import CustomerForm from '@/pages/CustomerForm';
import Inventory from '@/pages/Inventory';
import ProductForm from '@/pages/ProductForm';
import StockMovements from '@/pages/StockMovements';
import ChallansList from '@/pages/ChallansList';
import ChallanForm from '@/pages/ChallanForm';
import ChallanDetail from '@/pages/ChallanDetail';
import Accounts from '@/pages/Accounts';
import Reports from '@/pages/Reports';
import Settings from '@/pages/Settings';
import { Lock } from 'lucide-react';
import type { Role } from '@/lib/types';

function AppContent() {
  const { profile, loading } = useAuth();
  const { page } = useRouter();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading OpsPortal…</p>
        </div>
      </div>
    );
  }

  if (!profile) return <Login />;

  // Role-based access control
  const roleAccess: Record<string, Role[]> = {
    customers:        ['admin', 'sales'],
    'customer-detail':['admin', 'sales'],
    'customer-add':   ['admin', 'sales'],
    'customer-edit':  ['admin', 'sales'],
    inventory:        ['admin', 'warehouse'],
    'product-add':    ['admin', 'warehouse'],
    'product-edit':   ['admin', 'warehouse'],
    'stock-movements':['admin', 'warehouse'],
    challans:         ['admin', 'sales'],
    'challan-add':    ['admin', 'sales'],
    'challan-detail': ['admin', 'sales'],
    accounts:         ['admin', 'accounts'],
  };

  const allowedRoles = roleAccess[page];
  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return (
      <AppLayout>
        <div className="card p-12 text-center">
          <div className="p-4 rounded-2xl bg-red-50 text-red-600 w-fit mx-auto mb-4">
            <Lock size={32} />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Access Restricted</h2>
          <p className="text-sm text-gray-500 mt-1">
            Your role ({profile.role}) doesn't have permission to view this page.
          </p>
        </div>
      </AppLayout>
    );
  }

  const renderPage = () => {
    switch (page) {
      case 'dashboard':         return <Dashboard />;
      case 'customers':         return <CustomersList />;
      case 'customer-detail':   return <CustomerDetail />;
      case 'customer-add':      return <CustomerForm mode="add" />;
      case 'customer-edit':     return <CustomerForm mode="edit" />;
      case 'inventory':         return <Inventory />;
      case 'product-add':       return <ProductForm mode="add" />;
      case 'product-edit':      return <ProductForm mode="edit" />;
      case 'stock-movements':   return <StockMovements />;
      case 'challans':          return <ChallansList />;
      case 'challan-add':       return <ChallanForm />;
      case 'challan-detail':    return <ChallanDetail />;
      case 'accounts':          return <Accounts />;
      case 'reports':           return <Reports />;
      case 'settings':          return <Settings />;
      default:                  return <Dashboard />;
    }
  };

  return <AppLayout>{renderPage()}</AppLayout>;
}

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider>
        <AppContent />
      </RouterProvider>
    </AuthProvider>
  );
}
