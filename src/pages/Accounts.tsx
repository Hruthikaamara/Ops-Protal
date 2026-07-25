import { useEffect, useState, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, FileText, Clock,
  CheckCircle, AlertCircle, IndianRupee, Wallet, Receipt,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import StatsCard from '@/components/StatsCard';
import Badge from '@/components/Badge';
import Loading from '@/components/Loading';
import EmptyState from '@/components/EmptyState';
import { useRouter } from '@/hooks/useRouter';
import type { Challan, Customer } from '@/lib/types';

export default function Accounts() {
  const { navigate } = useRouter();
  const [challans, setChallans] = useState<Challan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [c, cu] = await Promise.all([
        supabase.from('challans').select('*').order('created_at', { ascending: false }),
        supabase.from('customers').select('*').order('name'),
      ]);
      setChallans(c.data ?? []);
      setCustomers(cu.data ?? []);
      setLoading(false);
    })();
  }, []);

  const stats = useMemo(() => {
    const confirmed = challans.filter((c) => c.status === 'Confirmed');
    const drafts = challans.filter((c) => c.status === 'Draft');
    const cancelled = challans.filter((c) => c.status === 'Cancelled');
    const totalRevenue = confirmed.reduce((s, c) => s + Number(c.total_amount), 0);
    const totalUnits = confirmed.reduce((s, c) => s + c.total_quantity, 0);
    const avgOrderValue = confirmed.length > 0 ? totalRevenue / confirmed.length : 0;

    // Revenue by customer
    const revenueByCustomer = new Map<string, number>();
    confirmed.forEach((c) => {
      const name = c.customer_name;
      revenueByCustomer.set(name, (revenueByCustomer.get(name) ?? 0) + Number(c.total_amount));
    });
    const topCustomers = Array.from(revenueByCustomer.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Revenue by month (last 6)
    const monthly: Record<string, number> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString('en-US', { month: 'short' });
      monthly[key] = 0;
    }
    confirmed.forEach((c) => {
      const d = new Date(c.created_at);
      const key = d.toLocaleDateString('en-US', { month: 'short' });
      if (key in monthly) monthly[key] += Number(c.total_amount);
    });

    return { confirmed, drafts, cancelled, totalRevenue, totalUnits, avgOrderValue, topCustomers, monthly };
  }, [challans]);

  if (loading) return <Loading />;

  const monthlyValues = Object.values(stats.monthly);
  const maxMonthly = Math.max(...monthlyValues, 1);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Accounts Dashboard</h2>
          <p className="page-subtitle">Financial overview, revenue, and receivables</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="Total Revenue" value={`₹${stats.totalRevenue.toLocaleString('en-IN')}`} icon={<DollarSign size={22} />} color="success"
          trend={{ value: `${stats.confirmed.length} orders`, up: true }} />
        <StatsCard label="Avg Order Value" value={`₹${Math.round(stats.avgOrderValue).toLocaleString('en-IN')}`} icon={<Wallet size={22} />} color="primary" />
        <StatsCard label="Units Sold" value={stats.totalUnits} icon={<TrendingUp size={22} />} color="warning" />
        <StatsCard label="Pending Drafts" value={stats.drafts.length} icon={<Clock size={22} />} color="danger" />
      </div>

      {/* Revenue chart (simple bar chart) */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-5">Revenue Trend — Last 6 Months</h3>
        <div className="flex items-end justify-between gap-4 h-48">
          {Object.entries(stats.monthly).map(([month, value]) => (
            <div key={month} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex-1 flex items-end">
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-primary-500 to-primary-400 hover:from-primary-600 hover:to-primary-500 transition-all duration-300 relative group"
                  style={{ height: `${(value / maxMonthly) * 100}%`, minHeight: value > 0 ? '8px' : '2px' }}
                >
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    ₹{value.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 font-medium">{month}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top customers */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Receipt size={16} className="text-primary-600" /> Top Customers by Revenue
          </h3>
          {stats.topCustomers.length === 0 ? (
            <EmptyState title="No confirmed orders yet" />
          ) : (
            <div className="space-y-3">
              {stats.topCustomers.map(([name, rev], i) => {
                const pct = (rev / stats.topCustomers[0][1]) * 100;
                return (
                  <div key={name}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400 w-5">#{i + 1}</span>
                        <p className="text-sm font-medium text-gray-800">{name}</p>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">₹{rev.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-full bg-primary-500 transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent transactions */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText size={16} className="text-primary-600" /> Recent Transactions
          </h3>
          {challans.length === 0 ? (
            <EmptyState title="No transactions yet" />
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {challans.slice(0, 8).map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => navigate('challan-detail', { id: c.id })}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${c.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-600' : c.status === 'Cancelled' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                      {c.status === 'Confirmed' ? <CheckCircle size={16} /> : c.status === 'Cancelled' ? <AlertCircle size={16} /> : <Clock size={16} />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{c.challan_number}</p>
                      <p className="text-xs text-gray-400">{c.customer_name} · {new Date(c.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">₹{Number(c.total_amount).toLocaleString('en-IN')}</p>
                    <Badge variant={c.status === 'Confirmed' ? 'success' : c.status === 'Cancelled' ? 'danger' : 'neutral'}>{c.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Summary footer */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Order Status Summary</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-emerald-50/50 border border-emerald-100">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle size={16} className="text-emerald-600" />
              <p className="text-sm font-medium text-emerald-700">Confirmed</p>
            </div>
            <p className="text-2xl font-bold text-emerald-700">{stats.confirmed.length}</p>
            <p className="text-xs text-emerald-600 mt-1">₹{stats.totalRevenue.toLocaleString('en-IN')} total</p>
          </div>
          <div className="p-4 rounded-lg bg-amber-50/50 border border-amber-100">
            <div className="flex items-center gap-2 mb-1">
              <Clock size={16} className="text-amber-600" />
              <p className="text-sm font-medium text-amber-700">Draft</p>
            </div>
            <p className="text-2xl font-bold text-amber-700">{stats.drafts.length}</p>
            <p className="text-xs text-amber-600 mt-1">₹{stats.drafts.reduce((s, c) => s + Number(c.total_amount), 0).toLocaleString('en-IN')} pending</p>
          </div>
          <div className="p-4 rounded-lg bg-red-50/50 border border-red-100">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle size={16} className="text-red-600" />
              <p className="text-sm font-medium text-red-700">Cancelled</p>
            </div>
            <p className="text-2xl font-bold text-red-700">{stats.cancelled.length}</p>
            <p className="text-xs text-red-600 mt-1">₹{stats.cancelled.reduce((s, c) => s + Number(c.total_amount), 0).toLocaleString('en-IN')} lost</p>
          </div>
        </div>
      </div>
    </div>
  );
}
