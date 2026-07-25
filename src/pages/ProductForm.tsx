import { useEffect, useState } from 'react';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from '@/hooks/useRouter';
import type { Product } from '@/lib/types';

interface Props {
  mode: 'add' | 'edit';
}

export default function ProductForm({ mode }: Props) {
  const { params, navigate } = useRouter();
  const { profile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<Product>>({
    name: '', sku: '', category: 'General', unit_price: 0,
    current_stock: 0, min_stock_threshold: 10, warehouse_location: 'Main Warehouse', description: '',
  });

  useEffect(() => {
    if (mode === 'edit' && params.id) {
      supabase.from('products').select('*').eq('id', params.id).maybeSingle().then(({ data }) => {
        if (data) setForm(data);
      });
    }
  }, [mode, params.id]);

  function update(field: keyof Product, value: string | number) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      unit_price: Number(form.unit_price),
      current_stock: Number(form.current_stock),
      min_stock_threshold: Number(form.min_stock_threshold),
      updated_at: new Date().toISOString(),
    };
    if (mode === 'add') {
      payload.created_by = profile?.id;
      const { data } = await supabase.from('products').insert(payload).select().single();
      if (data) {
        if (data.current_stock > 0) {
          await supabase.from('stock_movements').insert({
            product_id: data.id, product_name: data.name, quantity: data.current_stock,
            movement_type: 'IN', reason: 'Initial stock', created_by: profile?.id, created_by_name: profile?.full_name,
          });
        }
        navigate('inventory');
      }
    } else {
      await supabase.from('products').update(payload).eq('id', params.id);
      navigate('inventory');
    }
    setSaving(false);
  }

  return (
    <div className="max-w-2xl space-y-5 animate-fade-in">
      <button onClick={() => navigate('inventory')} className="btn-ghost">
        <ArrowLeft size={16} /> Back to Inventory
      </button>

      <form onSubmit={save} className="card p-6 space-y-5">
        <h2 className="text-lg font-semibold text-gray-900">{mode === 'add' ? 'Add New Product' : 'Edit Product'}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="form-label">Product Name *</label>
            <input required value={form.name ?? ''} onChange={(e) => update('name', e.target.value)} className="form-input" placeholder="Premium Steel Pipe 2inch" />
          </div>
          <div>
            <label className="form-label">SKU *</label>
            <input required value={form.sku ?? ''} onChange={(e) => update('sku', e.target.value)} className="form-input" placeholder="PSP-2IN-001" />
          </div>
          <div>
            <label className="form-label">Category</label>
            <input value={form.category ?? ''} onChange={(e) => update('category', e.target.value)} className="form-input" placeholder="Pipes & Fittings" />
          </div>
          <div>
            <label className="form-label">Unit Price (₹) *</label>
            <input type="number" min={0} step="0.01" required value={form.unit_price ?? 0} onChange={(e) => update('unit_price', e.target.value)} className="form-input" />
          </div>
          <div>
            <label className="form-label">Warehouse Location</label>
            <input value={form.warehouse_location ?? ''} onChange={(e) => update('warehouse_location', e.target.value)} className="form-input" placeholder="Warehouse A - Rack 1" />
          </div>
          <div>
            <label className="form-label">Current Stock</label>
            <input type="number" min={0} value={form.current_stock ?? 0} onChange={(e) => update('current_stock', e.target.value)} className="form-input"
              disabled={mode === 'edit'} />
            {mode === 'edit' && <p className="text-xs text-gray-400 mt-1">Use "Adjust Stock" on the inventory page to change stock levels.</p>}
          </div>
          <div>
            <label className="form-label">Reorder Threshold (Min Stock)</label>
            <input type="number" min={0} value={form.min_stock_threshold ?? 10} onChange={(e) => update('min_stock_threshold', e.target.value)} className="form-input" />
          </div>
        </div>

        <div>
          <label className="form-label">Description</label>
          <textarea value={form.description ?? ''} onChange={(e) => update('description', e.target.value)} rows={3} className="form-input" placeholder="Product description" />
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <button type="button" onClick={() => navigate('inventory')} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
            {saving ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : <><Save size={16} /> {mode === 'add' ? 'Create Product' : 'Save Changes'}</>}
          </button>
        </div>
      </form>
    </div>
  );
}
