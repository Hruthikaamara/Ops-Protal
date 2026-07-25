import { useEffect, useState } from 'react';
import { Plus, FileText, Search, ArrowRight, Calendar, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from '@/hooks/useRouter';
import Badge from '@/components/Badge';
import Loading from '@/components/Loading';
import EmptyState from '@/components/EmptyState';
import StatsCard from '@/components/StatsCard';
import type { Challan } from '@/lib/types';

export default function ChallansList() {
  const { navigate } = useRouter();
  const [challans, setChallans] = useState<Challan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'Draft' | 'Confirmed' | 'Cancelled'>('all');

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('challans').select('*').order('created_at', { ascending: false });
      setChallans(data ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = challans.filter((c) => {
    const matchesSearch = !search || c.challan_number.toLowerCase().includes(search.toLowerCase()) || c.customer_name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || c.status === filter;
    return matchesSearch && matchesFilter;
  });

  if (loading) return <Loading />;

  const totalRevenue = challans.filter(c => c.status === 'Confirmed').reduce((s, c) => s + Number(c.total_amount), 0);
  const draftCount = challans.filter(c => c.status === 'Draft').length;
  const confirmedCount = challans.filter(c => c.status === 'Confirmed').length;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Sales Challans</h2>
          <p className="page-subtitle">Delivery challans and order records</p>
        </div>
        <button onClick={() => navigate('challan-add')} className="btn-primary">
          <Plus size={16} /> New Challan
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard label="Total Challans" value={challans.length} icon={<FileText size={22} />} color="primary" />
        <StatsCard label="Confirmed" value={confirmedCount} icon={<ArrowRight size={22} />} color="success" />
        <StatsCard label="Total Revenue" value={`₹${totalRevenue.toLocaleString('en-IN')}`} icon={<Calendar size={22} />} color="warning" />
      </div>

      <div className="card p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search by challan no. or customer…" value={search} onChange={(e) => setSearch(e.target.value)} className="form-input pl-10" />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value as 'all' | 'Draft' | 'Confirmed' | 'Cancelled')} className="form-input w-auto">
          <option value="all">All Status</option>
          <option value="Draft">Draft</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="card"><EmptyState title="No challans found" subtitle="Create a new sales challan to get started" /></div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Challan No.</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="cursor-pointer" onClick={() => navigate('challan-detail', { id: c.id })}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${c.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-600' : c.status === 'Cancelled' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                        <FileText size={16} />
                      </div>
                      <span className="font-medium text-gray-900">{c.challan_number}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <User size={13} className="text-gray-400" />
                      <div>
                        <p className="text-gray-800">{c.customer_name}</p>
                        <p className="text-xs text-gray-400">{c.customer_business}</p>
                      </div>
                    </div>
                  </td>
                  <td><span className="text-gray-600">{c.total_quantity} units</span></td>
                  <td><span className="font-semibold text-gray-900">₹{Number(c.total_amount).toLocaleString('en-IN')}</span></td>
                  <td className="text-gray-500 whitespace-nowrap">{new Date(c.created_at).toLocaleDateString()}</td>
                  <td>
                    <Badge variant={c.status === 'Confirmed' ? 'success' : c.status === 'Cancelled' ? 'danger' : 'neutral'}>{c.status}</Badge>
                  </td>
                  <td className="text-right">
                    <button className="btn-ghost" onClick={(e) => { e.stopPropagation(); navigate('challan-detail', { id: c.id }); }}>
                      View <ArrowRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
