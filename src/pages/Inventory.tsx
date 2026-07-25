import { useEffect, useState } from 'react';
import {
  Plus, Search, Package, AlertTriangle, TrendingUp, TrendingDown, Boxes,
  ArrowDownRight, ArrowUpRight, Filter, MapPin,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from '@/hooks/useRouter';
import Badge from '@/components/Badge';
import Loading from '@/components/Loading';
import EmptyState from '@/components/EmptyState';
import StatsCard from '@/components/StatsCard';
import Modal from '@/components/Modal';
import type { Product } from '@/lib/types';

export default function Inventory() {
  const { profile } = useAuth();
  const { navigate } = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');
  const [adjustModal, setAdjustModal] = useState<Product | null>(null);
  const [adjustQty, setAdjustQty] = useState(0);
  const [adjustType, setAdjustType] = useState<'IN' | 'OUT'>('IN');
  const [adjustReason, setAdjustReason] = useState('');

  useEffect(() => { loadProducts(); }, []);

  async function loadProducts() {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    setProducts(data ?? []);
    setLoading(false);
  }

  const filtered = products.filter((p) => {
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || (filter === 'low' && p.current_stock <= p.min_stock_threshold && p.current_stock > 0) || (filter === 'out' && p.current_stock === 0);
    return matchesSearch && matchesFilter;
  });

  const totalProducts = products.length;
  const lowStockCount = products.filter((p) => p.current_stock <= p.min_stock_threshold && p.current_stock > 0).length;
  const outOfStock = products.filter((p) => p.current_stock === 0).length;
  const totalStockValue = products.reduce((sum, p) => sum + p.current_stock * Number(p.unit_price), 0);

  async function submitAdjust() {
    if (!adjustModal || !profile || adjustQty <= 0) return;
    const newStock = adjustType === 'IN' ? adjustModal.current_stock + adjustQty : adjustModal.current_stock - adjustQty;
    if (newStock < 0) { alert('Insufficient stock!'); return; }
    await supabase.from('products').update({ current_stock: newStock, updated_at: new Date().toISOString() }).eq('id', adjustModal.id);
    await supabase.from('stock_movements').insert({
      product_id: adjustModal.id,
      product_name: adjustModal.name,
      quantity: adjustQty,
      movement_type: adjustType,
      reason: adjustReason || (adjustType === 'IN' ? 'Stock received' : 'Stock issued'),
      created_by: profile.id,
      created_by_name: profile.full_name,
    });
    setAdjustModal(null);
    setAdjustQty(0);
    setAdjustReason('');
    loadProducts();
  }

  if (loading) return <Loading />;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Inventory Management</h2>
          <p className="page-subtitle">Products, stock levels, and reorder thresholds</p>
        </div>
        <button onClick={() => navigate('product-add')} className="btn-primary">
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="Total Products" value={totalProducts} icon={<Package size={22} />} color="primary" />
        <StatsCard label="Low Stock" value={lowStockCount} icon={<AlertTriangle size={22} />} color="warning" />
        <StatsCard label="Out of Stock" value={outOfStock} icon={<TrendingDown size={22} />} color="danger" />
        <StatsCard label="Stock Value" value={`₹${totalStockValue.toLocaleString('en-IN')}`} icon={<TrendingUp size={22} />} color="success" />
      </div>

      {/* Low stock alert banner */}
      {(lowStockCount + outOfStock) > 0 && (profile?.role === 'admin' || profile?.role === 'warehouse') && (
        <div className="card p-4 border-amber-200 bg-amber-50/50 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-100 text-amber-600"><AlertTriangle size={18} /></div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">Stock Reorder Alert</p>
            <p className="text-xs text-gray-500">{lowStockCount + outOfStock} product(s) are at or below their reorder threshold and need attention.</p>
          </div>
          <button onClick={() => setFilter('low')} className="btn-secondary text-amber-700 border-amber-200">View Low Stock</button>
        </div>
      )}

      {/* Filters */}
      <div className="card p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search by name or SKU…" value={search} onChange={(e) => setSearch(e.target.value)} className="form-input pl-10" />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <select value={filter} onChange={(e) => setFilter(e.target.value as 'all' | 'low' | 'out')} className="form-input w-auto">
            <option value="all">All Products</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
          <button onClick={() => navigate('stock-movements')} className="btn-secondary">
            <Boxes size={15} /> Movement Log
          </button>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="card"><EmptyState title="No products found" /></div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Reorder Level</th>
                <th>Location</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const stockStatus = p.current_stock === 0 ? 'out' : p.current_stock <= p.min_stock_threshold ? 'low' : 'ok';
                return (
                  <tr key={p.id} className="cursor-pointer" onClick={() => navigate('product-edit', { id: p.id })}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${stockStatus === 'out' ? 'bg-red-50 text-red-600' : stockStatus === 'low' ? 'bg-amber-50 text-amber-600' : 'bg-primary-50 text-primary-600'}`}>
                          <Package size={16} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{p.name}</p>
                          <p className="text-xs text-gray-400">{p.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td><span className="text-gray-600">{p.category}</span></td>
                    <td><span className="font-medium text-gray-900">₹{Number(p.unit_price).toLocaleString('en-IN')}</span></td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${stockStatus === 'out' ? 'text-red-600' : stockStatus === 'low' ? 'text-amber-600' : 'text-gray-900'}`}>
                          {p.current_stock}
                        </span>
                        {stockStatus !== 'ok' && <Badge variant={stockStatus === 'out' ? 'danger' : 'warning'}>{stockStatus === 'out' ? 'Out' : 'Low'}</Badge>}
                      </div>
                    </td>
                    <td><span className="text-gray-500">{p.min_stock_threshold}</span></td>
                    <td>
                      <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                        <MapPin size={12} className="text-gray-400" />
                        {p.warehouse_location}
                      </div>
                    </td>
                    <td className="text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); setAdjustModal(p); setAdjustType('IN'); setAdjustQty(0); setAdjustReason(''); }}
                        className="btn-ghost text-primary-600"
                      >
                        Adjust Stock
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Adjust stock modal */}
      <Modal
        open={!!adjustModal}
        onClose={() => setAdjustModal(null)}
        title={`Adjust Stock — ${adjustModal?.name ?? ''}`}
        footer={<>
          <button onClick={() => setAdjustModal(null)} className="btn-secondary">Cancel</button>
          <button onClick={submitAdjust} className="btn-primary">Apply Adjustment</button>
        </>}
      >
        {adjustModal && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-between">
              <span className="text-sm text-gray-500">Current Stock</span>
              <span className="text-lg font-bold text-gray-900">{adjustModal.current_stock} units</span>
            </div>
            <div>
              <label className="form-label">Movement Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustType('IN')}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                    adjustType === 'IN' ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <ArrowDownRight size={16} /> Stock In
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType('OUT')}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                    adjustType === 'OUT' ? 'border-red-300 bg-red-50 text-red-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <ArrowUpRight size={16} /> Stock Out
                </button>
              </div>
            </div>
            <div>
              <label className="form-label">Quantity</label>
              <input type="number" min={1} value={adjustQty || ''} onChange={(e) => setAdjustQty(Number(e.target.value))} className="form-input" placeholder="Enter quantity" />
            </div>
            <div>
              <label className="form-label">Reason</label>
              <input value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} className="form-input" placeholder="e.g. New purchase, Damaged, Issued to customer" />
            </div>
            <div className="p-3 rounded-lg bg-primary-50/50 border border-primary-100 text-sm text-primary-700">
              New stock will be: <span className="font-bold">
                {adjustType === 'IN' ? adjustModal.current_stock + adjustQty : Math.max(0, adjustModal.current_stock - adjustQty)} units
              </span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
