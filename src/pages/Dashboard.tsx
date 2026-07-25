import { useEffect, useState } from 'react';
import {
  Users, Package, FileText, AlertTriangle, TrendingUp, DollarSign,
  ShoppingCart, ArrowUpRight, ArrowDownRight, Clock,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from '@/hooks/useRouter';
import StatsCard from '@/components/StatsCard';
import Badge from '@/components/Badge';
import Loading from '@/components/Loading';
import EmptyState from '@/components/EmptyState';
import type { Customer, Product, Challan, StockMovement } from '@/lib/types';

export default function Dashboard() {
  const { profile } = useAuth();
  const { navigate } = useRouter();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [challans, setChallans] = useState<Challan[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);

  useEffect(() => {
    (async () => {
      const [c, p, ch, m] = await Promise.all([
        supabase.from('customers').select('*').order('created_at', { ascending: false }),
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('challans').select('*').order('created_at', { ascending: false }),
        supabase.from('stock_movements').select('*').order('created_at', { ascending: false }).limit(8),
      ]);
      setCustomers(c.data ?? []);
      setProducts(p.data ?? []);
      setChallans(ch.data ?? []);
      setMovements(m.data ?? []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <Loading />;
  if (!profile) return null;

  const lowStock = products.filter((p) => p.current_stock <= p.min_stock_threshold);
  const activeCustomers = customers.filter((c) => c.status === 'Active');
  const confirmedChallans = challans.filter((c) => c.status === 'Confirmed');
  const totalRevenue = confirmedChallans.reduce((sum, c) => sum + Number(c.total_amount), 0);
  const pendingFollowups = customers.filter((c) => c.follow_up_date && new Date(c.follow_up_date) <= new Date(Date.now() + 7 * 86400000));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome banner */}
      <div className="card p-6 bg-gradient-to-r from-primary-600 to-primary-700 text-white border-0">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold">Welcome back, {profile.full_name.split(' ')[0]}!</h2>
            <p className="text-primary-100 text-sm mt-1">
              Here's what's happening in your operations today.
            </p>
          </div>
          <div className="flex items-center gap-2 text-primary-100 text-sm">
            <Clock size={16} />
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="Total Customers" value={customers.length} icon={<Users size={22} />} color="primary"
          trend={{ value: `${activeCustomers.length} active`, up: true }} />
        <StatsCard label="Products in Stock" value={products.length} icon={<Package size={22} />} color="success"
          trend={{ value: `${lowStock.length} low stock`, up: lowStock.length === 0 }} />
        <StatsCard label="Sales Challans" value={challans.length} icon={<FileText size={22} />} color="warning"
          trend={{ value: `${confirmedChallans.length} confirmed`, up: true }} />
        <StatsCard label="Total Revenue" value={`₹${totalRevenue.toLocaleString('en-IN')}`} icon={<DollarSign size={22} />} color="danger"
          trend={{ value: 'This period', up: true }} />
      </div>

      {/* Low stock alert */}
      {lowStock.length > 0 && (profile.role === 'admin' || profile.role === 'warehouse') && (
        <div className="card p-5 border-amber-200 bg-amber-50/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
              <AlertTriangle size={18} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Low Stock Alerts</h3>
              <p className="text-xs text-gray-500">{lowStock.length} product(s) need restocking</p>
            </div>
          </div>
          <div className="space-y-2">
            {lowStock.slice(0, 5).map((p) => (
              <div key={p.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2.5 border border-amber-100">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.sku} · {p.warehouse_location}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-amber-600">{p.current_stock} units</p>
                  <p className="text-xs text-gray-400">Min: {p.min_stock_threshold}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent challans */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Recent Sales Challans</h3>
            <button onClick={() => navigate('challans')} className="text-xs text-primary-600 font-medium hover:text-primary-700">
              View all →
            </button>
          </div>
          {challans.length === 0 ? (
            <EmptyState title="No challans yet" subtitle="Create your first sales challan" />
          ) : (
            <div className="space-y-2">
              {challans.slice(0, 5).map((ch) => (
                <div key={ch.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => navigate('challan-detail', { id: ch.id })}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${ch.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-600' : ch.status === 'Cancelled' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                      <FileText size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{ch.challan_number}</p>
                      <p className="text-xs text-gray-400">{ch.customer_name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">₹{Number(ch.total_amount).toLocaleString('en-IN')}</p>
                    <Badge variant={ch.status === 'Confirmed' ? 'success' : ch.status === 'Cancelled' ? 'danger' : 'neutral'}>
                      {ch.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent stock movements */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Recent Stock Movements</h3>
            <button onClick={() => navigate('stock-movements')} className="text-xs text-primary-600 font-medium hover:text-primary-700">
              View all →
            </button>
          </div>
          {movements.length === 0 ? (
            <EmptyState title="No movements yet" />
          ) : (
            <div className="space-y-2">
              {movements.slice(0, 6).map((m) => (
                <div key={m.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${m.movement_type === 'IN' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                      {m.movement_type === 'IN' ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{m.product_name}</p>
                      <p className="text-xs text-gray-400">{m.reason || m.movement_type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${m.movement_type === 'IN' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {m.movement_type === 'IN' ? '+' : '−'}{m.quantity}
                    </p>
                    <p className="text-xs text-gray-400">{new Date(m.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Follow-ups (sales/admin) */}
      {(profile.role === 'sales' || profile.role === 'admin') && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-primary-600" />
              <h3 className="text-sm font-semibold text-gray-900">Upcoming Follow-ups</h3>
            </div>
            <button onClick={() => navigate('customers')} className="text-xs text-primary-600 font-medium hover:text-primary-700">
              View customers →
            </button>
          </div>
          {pendingFollowups.length === 0 ? (
            <EmptyState title="No upcoming follow-ups" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {pendingFollowups.slice(0, 6).map((c) => (
                <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-primary-200 hover:bg-primary-50/30 transition-all cursor-pointer"
                  onClick={() => navigate('customer-detail', { id: c.id })}>
                  <div className="p-2 rounded-full bg-primary-100 text-primary-700 text-xs font-bold">
                    {c.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{c.name}</p>
                    <p className="text-xs text-gray-400">{c.business_name || c.mobile}</p>
                  </div>
                  <Badge variant={c.status === 'Active' ? 'success' : 'warning'}>
                    {c.follow_up_date ? new Date(c.follow_up_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
