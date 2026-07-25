import { useEffect, useState } from 'react';
import { ArrowLeft, Plus, Trash2, Save, Loader2, X, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from '@/hooks/useRouter';
import type { Customer, Product } from '@/lib/types';

interface LineItem {
  product_id: string;
  product_name: string;
  sku: string;
  unit_price: number;
  quantity: number;
  available: number;
}

export default function ChallanForm() {
  const { navigate } = useRouter();
  const { profile } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [customerId, setCustomerId] = useState('');
  const [items, setItems] = useState<LineItem[]>([]);
  const [notes, setNotes] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [showProductPicker, setShowProductPicker] = useState(false);

  useEffect(() => {
    (async () => {
      const [c, p] = await Promise.all([
        supabase.from('customers').select('*').order('name'),
        supabase.from('products').select('*').order('name'),
      ]);
      setCustomers(c.data ?? []);
      setProducts(p.data ?? []);
      setLoading(false);
    })();
  }, []);

  const filteredProducts = products.filter((p) =>
    !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.sku.toLowerCase().includes(productSearch.toLowerCase())
  );

  function addProduct(product: Product) {
    if (items.some((i) => i.product_id === product.id)) return;
    setItems([...items, {
      product_id: product.id,
      product_name: product.name,
      sku: product.sku,
      unit_price: Number(product.unit_price),
      quantity: 1,
      available: product.current_stock,
    }]);
    setShowProductPicker(false);
    setProductSearch('');
  }

  function updateItem(index: number, field: keyof LineItem, value: number) {
    const updated = [...items];
    if (field === 'quantity' && value > updated[index].available) {
      alert(`Only ${updated[index].available} units in stock!`);
      return;
    }
    (updated[index] as unknown as Record<string, unknown>)[field] = value;
    setItems(updated);
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  const totalQuantity = items.reduce((s, i) => s + i.quantity, 0);
  const totalAmount = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);

  async function save(status: 'Draft' | 'Confirmed') {
    if (!customerId) { alert('Please select a customer'); return; }
    if (items.length === 0) { alert('Add at least one product'); return; }
    setSaving(true);

    const customer = customers.find((c) => c.id === customerId);
    const challanNumber = `CH-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

    const { data: challan } = await supabase.from('challans').insert({
      challan_number: challanNumber,
      customer_id: customerId,
      customer_name: customer?.name ?? '',
      customer_mobile: customer?.mobile ?? '',
      customer_business: customer?.business_name ?? '',
      total_quantity: totalQuantity,
      total_amount: totalAmount,
      status,
      notes,
      created_by: profile?.id,
      created_by_name: profile?.full_name,
    }).select().single();

    if (challan) {
      await supabase.from('challan_items').insert(items.map((i) => ({
        challan_id: challan.id,
        product_id: i.product_id,
        product_name: i.product_name,
        sku: i.sku,
        unit_price: i.unit_price,
        quantity: i.quantity,
        subtotal: i.unit_price * i.quantity,
      })));

      if (status === 'Confirmed') {
        for (const item of items) {
          await supabase.from('products').update({
            current_stock: item.available - item.quantity,
            updated_at: new Date().toISOString(),
          }).eq('id', item.product_id);

          await supabase.from('stock_movements').insert({
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            movement_type: 'OUT',
            reason: `Challan ${challanNumber}`,
            reference: challanNumber,
            created_by: profile?.id,
            created_by_name: profile?.full_name,
          });
        }
      }

      navigate('challan-detail', { id: challan.id });
    }
    setSaving(false);
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-gray-400" /></div>;

  return (
    <div className="space-y-5 animate-fade-in max-w-4xl">
      <button onClick={() => navigate('challans')} className="btn-ghost">
        <ArrowLeft size={16} /> Back to Challans
      </button>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-5">Create New Sales Challan</h2>

        {/* Customer selection */}
        <div className="mb-5">
          <label className="form-label">Select Customer *</label>
          <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="form-input">
            <option value="">Choose a customer…</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name} — {c.business_name || c.mobile}</option>
            ))}
          </select>
        </div>

        {/* Product picker */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <label className="form-label mb-0">Line Items *</label>
            <button onClick={() => setShowProductPicker(!showProductPicker)} className="btn-secondary text-sm">
              <Plus size={15} /> Add Product
            </button>
          </div>

          {showProductPicker && (
            <div className="mb-3 p-4 rounded-lg border border-gray-200 bg-gray-50/50 animate-slide-down">
              <div className="relative mb-3">
                <input
                  type="text"
                  placeholder="Search products…"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="form-input"
                  autoFocus
                />
                <button onClick={() => setShowProductPicker(false)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={16} />
                </button>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {filteredProducts.map((p) => (
                  <div key={p.id}
                    onClick={() => addProduct(p)}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-gray-100 hover:border-primary-300 hover:bg-primary-50/30 cursor-pointer transition-all">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.sku} · {p.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">₹{Number(p.unit_price).toLocaleString('en-IN')}</p>
                      <p className="text-xs text-gray-400">{p.current_stock} in stock</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Items table */}
          {items.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
              No products added yet. Click "Add Product" to start.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-100">
              <table className="w-full text-sm">
                <thead className="bg-gray-50/60">
                  <tr>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Product</th>
                    <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase">Price</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">Qty</th>
                    <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase">Subtotal</th>
                    <th className="px-3 py-2.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="px-3 py-2.5">
                        <p className="font-medium text-gray-800">{item.product_name}</p>
                        <p className="text-xs text-gray-400">{item.sku} · {item.available} available</p>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <input type="number" min={0} step="0.01" value={item.unit_price}
                          onChange={(e) => updateItem(i, 'unit_price', Number(e.target.value))}
                          className="w-24 px-2 py-1.5 text-right border border-gray-200 rounded-lg text-sm outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-100" />
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <input type="number" min={1} max={item.available} value={item.quantity}
                          onChange={(e) => updateItem(i, 'quantity', Number(e.target.value))}
                          className="w-16 px-2 py-1.5 text-center border border-gray-200 rounded-lg text-sm outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-100" />
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold text-gray-900">
                        ₹{(item.unit_price * item.quantity).toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <button onClick={() => removeItem(i)} className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-50/60">
                    <td colSpan={2} className="px-3 py-3 text-right text-sm font-medium text-gray-600">Total:</td>
                    <td className="px-3 py-3 text-center font-semibold text-gray-900">{totalQuantity}</td>
                    <td className="px-3 py-3 text-right font-bold text-gray-900">₹{totalAmount.toLocaleString('en-IN')}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="mb-5">
          <label className="form-label">Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="form-input" placeholder="Optional notes for this challan" />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button onClick={() => navigate('challans')} className="btn-secondary">Cancel</button>
          <button onClick={() => save('Draft')} disabled={saving} className="btn-secondary disabled:opacity-60">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save as Draft
          </button>
          <button onClick={() => save('Confirmed')} disabled={saving} className="btn-primary disabled:opacity-60">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />} Confirm Challan
          </button>
        </div>
      </div>
    </div>
  );
}
