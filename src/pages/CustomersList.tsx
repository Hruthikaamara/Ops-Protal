import { useEffect, useState } from 'react';
import { Plus, Search, Phone, Mail, Building2, Calendar, Filter, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from '@/hooks/useRouter';
import Badge from '@/components/Badge';
import Loading from '@/components/Loading';
import EmptyState from '@/components/EmptyState';
import type { Customer } from '@/lib/types';

export default function CustomersList() {
  const { navigate } = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
      setCustomers(data ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = customers.filter((c) => {
    const matchesSearch = !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.mobile.includes(search) ||
      c.business_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    const matchesType = filterType === 'all' || c.customer_type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  if (loading) return <Loading />;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Customers</h2>
          <p className="page-subtitle">{customers.length} total · {customers.filter(c => c.status === 'Active').length} active</p>
        </div>
        <button onClick={() => navigate('customer-add')} className="btn-primary">
          <Plus size={16} /> Add Customer
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, mobile, or business…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="form-input w-auto">
            <option value="all">All Status</option>
            <option value="Lead">Lead</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="form-input w-auto">
            <option value="all">All Types</option>
            <option value="Retail">Retail</option>
            <option value="Wholesale">Wholesale</option>
            <option value="Distributor">Distributor</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="card"><EmptyState title="No customers found" subtitle="Try adjusting filters or add a new customer" /></div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Business</th>
                <th>Type</th>
                <th>Status</th>
                <th>Follow-up</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="cursor-pointer" onClick={() => navigate('customer-detail', { id: c.id })}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-primary-100 text-primary-700 text-xs font-bold shrink-0">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{c.name}</p>
                        <p className="text-xs text-gray-400">{c.mobile}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Building2 size={13} className="text-gray-400" />
                      {c.business_name || '—'}
                    </div>
                  </td>
                  <td><Badge variant={c.customer_type === 'Distributor' ? 'primary' : c.customer_type === 'Wholesale' ? 'warning' : 'neutral'}>{c.customer_type}</Badge></td>
                  <td>
                    <Badge variant={c.status === 'Active' ? 'success' : c.status === 'Lead' ? 'warning' : 'neutral'}>
                      {c.status}
                    </Badge>
                  </td>
                  <td>
                    {c.follow_up_date ? (
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Calendar size={13} className="text-gray-400" />
                        {new Date(c.follow_up_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="text-right">
                    <button className="btn-ghost" onClick={(e) => { e.stopPropagation(); navigate('customer-detail', { id: c.id }); }}>
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
