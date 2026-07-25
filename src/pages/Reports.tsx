import { useEffect, useState, useMemo } from 'react';
import {
  BarChart3, TrendingUp, Package, Users, FileText, IndianRupee,
  Download, Calendar, ArrowUpRight, ArrowDownRight, PieChart,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import StatsCard from '@/components/StatsCard';
import Loading from '@/components/Loading';
import EmptyState from '@/components/EmptyState';
import type { Challan, Product, Customer, StockMovement } from '@/lib/types';

export default function Reports() {
  const [challans, setChallans] = useState<Challan[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [c, p, cu, m] = await Promise.all([
        supabase.from('challans').select('*').order('created_at', { ascending: false }),
        supabase.from('products').select('*'),
        supabase.from('customers').select('*'),
        supabase.from('stock_movements').select('*').order('created_at', { ascending: false }),
      ]);
      setChallans(c.data ?? []);
      setProducts(p.data ?? []);
      setCustomers(cu.data ?? []);
      setMovements(m.data ?? []);
      setLoading(false);
    })();
  }, []);

  const analytics = useMemo(() => {
    const confirmed = challans.filter((c) => c.status === 'Confirmed');
    const totalRevenue = confirmed.reduce((s, c) => s + Number(c.total_amount), 0);

    // Sales by category
    const categoryRevenue = new Map<string, number>();
    confirmed.forEach((c) => {
      // We don't have items joined here, approximate by product categories via movements
    });

    // Product performance (from movements)
    const productOut = movements.filter((m) => m.movement_type === 'OUT');
    const productPerf = new Map<string, { qty: number; revenue: number }>();
    productOut.forEach((m) => {
      const existing = productPerf.get(m.product_name) ?? { qty: 0, revenue: 0 };
      productPerf.set(m.product_name, { qty: existing.qty + m.quantity, revenue: existing.revenue + m.quantity * (products.find(p => p.id === m.product_id)?.unit_price ?? 0) });
    });
    const topProducts = Array.from(productPerf.entries())
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 5);

    // Customer type distribution
    const typeDist = { Retail: 0, Wholesale: 0, Distributor: 0 };
    customers.forEach((c) => { typeDist[c.customer_type]++; });

    // Status distribution
    const statusDist = { Draft: 0, Confirmed: 0, Cancelled: 0 };
    challans.forEach((c) => { statusDist[c.status]++; });

    // Stock health
    const stockHealth = {
      healthy: products.filter((p) => p.current_stock > p.min_stock_threshold).length,
      low: products.filter((p) => p.current_stock <= p.min_stock_threshold && p.current_stock > 0).length,
      out: products.filter((p) => p.current_stock === 0).length,
    };

    // Monthly sales
    const monthly: Record<string, { revenue: number; count: number }> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString('en-US', { month: 'short' });
      monthly[key] = { revenue: 0, count: 0 };
    }
    confirmed.forEach((c) => {
      const key = new Date(c.created_at).toLocaleDateString('en-US', { month: 'short' });
      if (key in monthly) {
        monthly[key].revenue += Number(c.total_amount);
        monthly[key].count++;
      }
    });

    return { totalRevenue, topProducts, typeDist, statusDist, stockHealth, monthly, confirmedCount: confirmed.length };
  }, [challans, products, customers, movements]);

  if (loading) return <Loading />;

  const monthlyValues = Object.values(analytics.monthly).map(m => m.revenue);
  const maxMonthly = Math.max(...monthlyValues, 1);
  const totalStock = analytics.stockHealth.healthy + analytics.stockHealth.low + analytics.stockHealth.out;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title flex items-center gap-2"><BarChart3 size={20} className="text-primary-600" /> Reports & Analytics</h2>
          <p className="page-subtitle">Business intelligence and performance insights</p>
        </div>
        <button onClick={() => window.print()} className="btn-secondary">
          <Download size={15} /> Export Report
        </button>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="Total Revenue" value={`₹${analytics.totalRevenue.toLocaleString('en-IN')}`} icon={<IndianRupee size={22} />} color="success" />
        <StatsCard label="Confirmed Orders" value={analytics.confirmedCount} icon={<FileText size={22} />} color="primary" />
        <StatsCard label="Total Customers" value={customers.length} icon={<Users size={22} />} color="warning" />
        <StatsCard label="Products Tracked" value={products.length} icon={<Package size={22} />} color="danger" />
      </div>

      {/* Revenue + Order chart */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-gray-900">Sales Performance — 6 Month Trend</h3>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-primary-500" /> Revenue</span>
            <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-emerald-400" /> Orders</span>
          </div>
        </div>
        <div className="flex items-end justify-between gap-4 h-56">
          {Object.entries(analytics.monthly).map(([month, data]) => (
            <div key={month} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex-1 flex items-end gap-1">
                <div className="flex-1 rounded-t-lg bg-primary-500 hover:bg-primary-600 transition-colors relative group"
                  style={{ height: `${(data.revenue / maxMonthly) * 100}%`, minHeight: data.revenue > 0 ? '8px' : '2px' }}>
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    ₹{data.revenue.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="flex-1 rounded-t-lg bg-emerald-400 hover:bg-emerald-500 transition-colors"
                  style={{ height: `${(data.count / Math.max(...Object.values(analytics.monthly).map(m => m.count), 1)) * 100}%`, minHeight: data.count > 0 ? '8px' : '2px' }} />
              </div>
              <p className="text-xs text-gray-500 font-medium">{month}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top products */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-primary-600" /> Top Performing Products
          </h3>
          {analytics.topProducts.length === 0 ? (
            <EmptyState title="No sales data yet" />
          ) : (
            <div className="space-y-3">
              {analytics.topProducts.map(([name, perf], i) => {
                const maxRev = analytics.topProducts[0][1].revenue || 1;
                const pct = (perf.revenue / maxRev) * 100;
                return (
                  <div key={name}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400 w-5">#{i + 1}</span>
                        <p className="text-sm font-medium text-gray-800">{name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">₹{Math.round(perf.revenue).toLocaleString('en-IN')}</p>
                        <p className="text-xs text-gray-400">{perf.qty} units</p>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-400 transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Customer type distribution */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <PieChart size={16} className="text-primary-600" /> Customer Type Distribution
          </h3>
          <div className="space-y-4">
            {Object.entries(analytics.typeDist).map(([type, count]) => {
              const pct = customers.length > 0 ? (count / customers.length) * 100 : 0;
              const colors: Record<string, string> = {
                Retail: 'bg-primary-500', Wholesale: 'bg-amber-500', Distributor: 'bg-emerald-500',
              };
              return (
                <div key={type}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-700">{type}</p>
                    <p className="text-sm text-gray-500">{count} ({pct.toFixed(0)}%)</p>
                  </div>
                  <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                    <div className={`h-full rounded-full ${colors[type]} transition-all duration-500`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stock health */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Package size={16} className="text-primary-600" /> Stock Health
          </h3>
          <div className="flex items-center justify-center mb-4">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" strokeWidth="12" />
                {analytics.stockHealth.healthy > 0 && (
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#10B981" strokeWidth="12"
                    strokeDasharray={`${(analytics.stockHealth.healthy / totalStock) * 251.2} 251.2`} strokeDashoffset="0" />
                )}
                {analytics.stockHealth.low > 0 && (
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#F59E0B" strokeWidth="12"
                    strokeDasharray={`${(analytics.stockHealth.low / totalStock) * 251.2} 251.2`}
                    strokeDashoffset={`-${(analytics.stockHealth.healthy / totalStock) * 251.2}`} />
                )}
                {analytics.stockHealth.out > 0 && (
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#EF4444" strokeWidth="12"
                    strokeDasharray={`${(analytics.stockHealth.out / totalStock) * 251.2} 251.2`}
                    strokeDashoffset={`-${((analytics.stockHealth.healthy + analytics.stockHealth.low) / totalStock) * 251.2}`} />
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-2xl font-bold text-gray-900">{totalStock}</p>
                <p className="text-xs text-gray-400">Products</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-lg bg-emerald-50">
              <div className="w-2 h-2 rounded-full bg-emerald-500 mx-auto mb-1" />
              <p className="text-sm font-bold text-emerald-700">{analytics.stockHealth.healthy}</p>
              <p className="text-xs text-gray-500">Healthy</p>
            </div>
            <div className="p-2 rounded-lg bg-amber-50">
              <div className="w-2 h-2 rounded-full bg-amber-500 mx-auto mb-1" />
              <p className="text-sm font-bold text-amber-700">{analytics.stockHealth.low}</p>
              <p className="text-xs text-gray-500">Low</p>
            </div>
            <div className="p-2 rounded-lg bg-red-50">
              <div className="w-2 h-2 rounded-full bg-red-500 mx-auto mb-1" />
              <p className="text-sm font-bold text-red-700">{analytics.stockHealth.out}</p>
              <p className="text-xs text-gray-500">Out</p>
            </div>
          </div>
        </div>

        {/* Order status distribution */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText size={16} className="text-primary-600" /> Order Status Breakdown
          </h3>
          <div className="space-y-4">
            {Object.entries(analytics.statusDist).map(([status, count]) => {
              const pct = challans.length > 0 ? (count / challans.length) * 100 : 0;
              const colors: Record<string, string> = {
                Confirmed: 'bg-emerald-500', Draft: 'bg-amber-500', Cancelled: 'bg-red-500',
              };
              return (
                <div key={status}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-700">{status}</p>
                    <p className="text-sm text-gray-500">{count} ({pct.toFixed(0)}%)</p>
                  </div>
                  <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                    <div className={`h-full rounded-full ${colors[status]} transition-all duration-500`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
