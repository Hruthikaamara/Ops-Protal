import { useEffect, useState } from 'react';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from '@/hooks/useRouter';
import type { Customer } from '@/lib/types';

interface Props {
  mode: 'add' | 'edit';
}

export default function CustomerForm({ mode }: Props) {
  const { params, navigate } = useRouter();
  const { profile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<Customer>>({
    name: '', mobile: '', email: '', business_name: '', gst_number: '',
    customer_type: 'Retail', address: '', status: 'Lead', follow_up_date: '', notes: '',
  });

  useEffect(() => {
    if (mode === 'edit' && params.id) {
      supabase.from('customers').select('*').eq('id', params.id).maybeSingle().then(({ data }) => {
        if (data) setForm({
          ...data,
          follow_up_date: data.follow_up_date ? data.follow_up_date.split('T')[0] : '',
        });
      });
    }
  }, [mode, params.id]);

  function update(field: keyof Customer, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      follow_up_date: form.follow_up_date || null,
      updated_at: new Date().toISOString(),
    };
    if (mode === 'add') {
      payload.created_by = profile?.id;
      const { data } = await supabase.from('customers').insert(payload).select().single();
      if (data) navigate('customer-detail', { id: data.id });
    } else {
      await supabase.from('customers').update(payload).eq('id', params.id);
      navigate('customer-detail', { id: params.id });
    }
    setSaving(false);
  }

  return (
    <div className="max-w-2xl space-y-5 animate-fade-in">
      <button onClick={() => navigate(mode === 'add' ? 'customers' : 'customer-detail', { id: params.id })} className="btn-ghost">
        <ArrowLeft size={16} /> Back
      </button>

      <form onSubmit={save} className="card p-6 space-y-5">
        <h2 className="text-lg font-semibold text-gray-900">{mode === 'add' ? 'Add New Customer' : 'Edit Customer'}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Full Name *</label>
            <input required value={form.name ?? ''} onChange={(e) => update('name', e.target.value)} className="form-input" placeholder="John Doe" />
          </div>
          <div>
            <label className="form-label">Mobile *</label>
            <input required value={form.mobile ?? ''} onChange={(e) => update('mobile', e.target.value)} className="form-input" placeholder="9876543210" />
          </div>
          <div>
            <label className="form-label">Email</label>
            <input type="email" value={form.email ?? ''} onChange={(e) => update('email', e.target.value)} className="form-input" placeholder="john@example.com" />
          </div>
          <div>
            <label className="form-label">Business Name</label>
            <input value={form.business_name ?? ''} onChange={(e) => update('business_name', e.target.value)} className="form-input" placeholder="Acme Industries" />
          </div>
          <div>
            <label className="form-label">GST Number</label>
            <input value={form.gst_number ?? ''} onChange={(e) => update('gst_number', e.target.value)} className="form-input" placeholder="27AABCU9603R1ZM" />
          </div>
          <div>
            <label className="form-label">Follow-up Date</label>
            <input type="date" value={form.follow_up_date ?? ''} onChange={(e) => update('follow_up_date', e.target.value)} className="form-input" />
          </div>
          <div>
            <label className="form-label">Customer Type</label>
            <select value={form.customer_type} onChange={(e) => update('customer_type', e.target.value)} className="form-input">
              <option value="Retail">Retail</option>
              <option value="Wholesale">Wholesale</option>
              <option value="Distributor">Distributor</option>
            </select>
          </div>
          <div>
            <label className="form-label">Status</label>
            <select value={form.status} onChange={(e) => update('status', e.target.value)} className="form-input">
              <option value="Lead">Lead</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div>
          <label className="form-label">Address</label>
          <textarea value={form.address ?? ''} onChange={(e) => update('address', e.target.value)} rows={2} className="form-input" placeholder="Full address" />
        </div>
        <div>
          <label className="form-label">Notes</label>
          <textarea value={form.notes ?? ''} onChange={(e) => update('notes', e.target.value)} rows={3} className="form-input" placeholder="Internal notes about this customer" />
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <button type="button" onClick={() => navigate(mode === 'add' ? 'customers' : 'customer-detail', { id: params.id })} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
            {saving ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : <><Save size={16} /> {mode === 'add' ? 'Create Customer' : 'Save Changes'}</>}
          </button>
        </div>
      </form>
    </div>
  );
}
