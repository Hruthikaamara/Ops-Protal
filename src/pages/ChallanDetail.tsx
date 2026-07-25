import { useEffect, useState } from 'react';
import {
  ArrowLeft, FileText, User, Phone, Building2, Calendar, CheckCircle,
  XCircle, Printer, Trash2, Package, IndianRupee,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from '@/hooks/useRouter';
import Badge from '@/components/Badge';
import Loading from '@/components/Loading';
import type { Challan, ChallanItem } from '@/lib/types';

export default function ChallanDetail() {
  const { params, navigate } = useRouter();
  const [challan, setChallan] = useState<Challan | null>(null);
  const [items, setItems] = useState<ChallanItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [c, it] = await Promise.all([
        supabase.from('challans').select('*').eq('id', params.id).maybeSingle(),
        supabase.from('challan_items').select('*').eq('challan_id', params.id).order('created_at'),
      ]);
      setChallan(c.data);
      setItems(it.data ?? []);
      setLoading(false);
    })();
  }, [params.id]);

  async function updateStatus(status: 'Confirmed' | 'Cancelled') {
    if (!challan) return;
    await supabase.from('challans').update({ status, updated_at: new Date().toISOString() }).eq('id', challan.id);
    if (status === 'Confirmed') {
      for (const item of items) {
        const { data: product } = await supabase.from('products').select('current_stock').eq('id', item.product_id).maybeSingle();
        if (product) {
          await supabase.from('products').update({
            current_stock: product.current_stock - item.quantity,
            updated_at: new Date().toISOString(),
          }).eq('id', item.product_id);
          await supabase.from('stock_movements').insert({
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            movement_type: 'OUT',
            reason: `Challan ${challan.challan_number}`,
            reference: challan.challan_number,
          });
        }
      }
    }
    navigate('challans');
  }

  async function deleteChallan() {
    if (!confirm('Delete this challan?')) return;
    await supabase.from('challans').delete().eq('id', params.id);
    navigate('challans');
  }

  if (loading) return <Loading />;
  if (!challan) return <div className="card p-8 text-center text-gray-500">Challan not found.</div>;

  return (
    <div className="space-y-5 animate-fade-in max-w-4xl">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('challans')} className="btn-ghost">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex items-center gap-2">
          <button onClick={() => window.print()} className="btn-secondary"><Printer size={15} /> Print</button>
          {challan.status === 'Draft' && (
            <>
              <button onClick={() => updateStatus('Confirmed')} className="btn-primary">
                <CheckCircle size={15} /> Confirm
              </button>
              <button onClick={() => updateStatus('Cancelled')} className="btn-danger">
                <XCircle size={15} /> Cancel
              </button>
            </>
          )}
          <button onClick={deleteChallan} className="btn-ghost text-red-500"><Trash2 size={15} /></button>
        </div>
      </div>

      {/* Challan document */}
      <div className="card p-8">
        {/* Header */}
        <div className="flex items-start justify-between pb-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary-600 text-white shadow-lg shadow-primary-600/30">
              <FileText size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Delivery Challan</h2>
              <p className="text-sm text-gray-500">{challan.challan_number}</p>
            </div>
          </div>
          <div className="text-right">
            <Badge variant={challan.status === 'Confirmed' ? 'success' : challan.status === 'Cancelled' ? 'danger' : 'neutral'}>
              {challan.status}
            </Badge>
            <p className="text-xs text-gray-400 mt-2">
              {new Date(challan.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Customer info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-6 border-b border-gray-100">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Billed To</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm text-gray-800"><User size={14} className="text-gray-400" /> {challan.customer_name}</div>
              <div className="flex items-center gap-2 text-sm text-gray-600"><Phone size={14} className="text-gray-400" /> {challan.customer_mobile || '—'}</div>
              <div className="flex items-center gap-2 text-sm text-gray-600"><Building2 size={14} className="text-gray-400" /> {challan.customer_business || '—'}</div>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Challan Details</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm text-gray-600"><Calendar size={14} className="text-gray-400" /> {new Date(challan.created_at).toLocaleString()}</div>
              <div className="flex items-center gap-2 text-sm text-gray-600"><Package size={14} className="text-gray-400" /> {challan.total_quantity} units total</div>
              <div className="flex items-center gap-2 text-sm text-gray-600"><FileText size={14} className="text-gray-400" /> Created by {challan.created_by_name || 'System'}</div>
            </div>
          </div>
        </div>

        {/* Items table */}
        <div className="py-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Product</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase">SKU</th>
                <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Price</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Qty</th>
                <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-gray-50">
                  <td className="px-3 py-3 font-medium text-gray-800">{item.product_name}</td>
                  <td className="px-3 py-3 text-gray-500">{item.sku}</td>
                  <td className="px-3 py-3 text-right text-gray-600">₹{Number(item.unit_price).toLocaleString('en-IN')}</td>
                  <td className="px-3 py-3 text-center text-gray-700">{item.quantity}</td>
                  <td className="px-3 py-3 text-right font-semibold text-gray-900">₹{Number(item.subtotal).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200">
                <td colSpan={3} className="px-3 py-4 text-right text-sm font-medium text-gray-600">Total Quantity:</td>
                <td className="px-3 py-4 text-center font-bold text-gray-900">{challan.total_quantity}</td>
                <td className="px-3 py-4"></td>
              </tr>
              <tr>
                <td colSpan={4} className="px-3 py-3 text-right text-base font-semibold text-gray-700">Grand Total:</td>
                <td className="px-3 py-3 text-right text-lg font-bold text-primary-700 flex items-center justify-end gap-1">
                  <IndianRupee size={16} />{Number(challan.total_amount).toLocaleString('en-IN')}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {challan.notes && (
          <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
            <p className="text-xs font-semibold text-gray-500 mb-1">Notes</p>
            <p className="text-sm text-gray-700">{challan.notes}</p>
          </div>
        )}

        {/* Signature line */}
        <div className="grid grid-cols-2 gap-8 pt-8 mt-6 border-t border-gray-100">
          <div>
            <div className="border-t border-gray-300 pt-2">
              <p className="text-xs text-gray-500">Authorized Signature</p>
            </div>
          </div>
          <div>
            <div className="border-t border-gray-300 pt-2">
              <p className="text-xs text-gray-500">Received By</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
