import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowDownRight, ArrowUpRight, Filter, Boxes } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from '@/hooks/useRouter';
import Badge from '@/components/Badge';
import Loading from '@/components/Loading';
import EmptyState from '@/components/EmptyState';
import type { StockMovement } from '@/lib/types';

export default function StockMovements() {
  const { navigate } = useRouter();
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'IN' | 'OUT'>('all');

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('stock_movements').select('*').order('created_at', { ascending: false });
      setMovements(data ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = filter === 'all' ? movements : movements.filter((m) => m.movement_type === filter);

  if (loading) return <Loading />;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('inventory')} className="btn-ghost">
          <ArrowLeft size={16} /> Back to Inventory
        </button>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <select value={filter} onChange={(e) => setFilter(e.target.value as 'all' | 'IN' | 'OUT')} className="form-input w-auto">
            <option value="all">All Movements</option>
            <option value="IN">Stock In Only</option>
            <option value="OUT">Stock Out Only</option>
          </select>
        </div>
      </div>

      <div className="page-header">
        <div>
          <h2 className="page-title flex items-center gap-2"><Boxes size={20} className="text-primary-600" /> Stock Movement Log</h2>
          <p className="page-subtitle">Complete audit trail of all stock changes</p>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card"><EmptyState title="No stock movements recorded" subtitle="Stock adjustments will appear here" /></div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Product</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Reason</th>
                <th>By</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id}>
                  <td className="text-gray-500 whitespace-nowrap">{new Date(m.created_at).toLocaleString()}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${m.movement_type === 'IN' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                        {m.movement_type === 'IN' ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                      </div>
                      <span className="font-medium text-gray-800">{m.product_name}</span>
                    </div>
                  </td>
                  <td>
                    <Badge variant={m.movement_type === 'IN' ? 'success' : 'danger'}>
                      {m.movement_type === 'IN' ? 'Stock In' : 'Stock Out'}
                    </Badge>
                  </td>
                  <td>
                    <span className={`font-semibold ${m.movement_type === 'IN' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {m.movement_type === 'IN' ? '+' : '−'}{m.quantity}
                    </span>
                  </td>
                  <td className="text-gray-600">{m.reason || '—'}</td>
                  <td className="text-gray-500">{m.created_by_name || 'System'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
