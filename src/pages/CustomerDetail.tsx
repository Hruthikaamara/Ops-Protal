import { useEffect, useState } from 'react';
import {
  ArrowLeft, Phone, Mail, Building2, MapPin, Calendar, FileText,
  Edit, Plus, MessageSquare, Trash2, User,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from '@/hooks/useRouter';
import Badge from '@/components/Badge';
import Loading from '@/components/Loading';
import Modal from '@/components/Modal';
import type { Customer, CustomerNote, Challan } from '@/lib/types';

export default function CustomerDetail() {
  const { params, navigate } = useRouter();
  const { profile } = useAuth();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [notes, setNotes] = useState<CustomerNote[]>([]);
  const [challans, setChallans] = useState<Challan[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteModal, setNoteModal] = useState(false);
  const [newNote, setNewNote] = useState('');

  async function loadData() {
    const [c, n, ch] = await Promise.all([
      supabase.from('customers').select('*').eq('id', params.id).maybeSingle(),
      supabase.from('customer_notes').select('*').eq('customer_id', params.id).order('created_at', { ascending: false }),
      supabase.from('challans').select('*').eq('customer_id', params.id).order('created_at', { ascending: false }),
    ]);
    setCustomer(c.data);
    setNotes(n.data ?? []);
    setChallans(ch.data ?? []);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, [params.id]);

  async function addNote() {
    if (!newNote.trim() || !profile) return;
    await supabase.from('customer_notes').insert({
      customer_id: params.id,
      note: newNote.trim(),
      created_by: profile.id,
      created_by_name: profile.full_name,
    });
    setNewNote('');
    setNoteModal(false);
    loadData();
  }

  async function deleteNote(id: string) {
    await supabase.from('customer_notes').delete().eq('id', id);
    loadData();
  }

  async function deleteCustomer() {
    if (!confirm('Delete this customer and all related data?')) return;
    await supabase.from('customers').delete().eq('id', params.id);
    navigate('customers');
  }

  if (loading) return <Loading />;
  if (!customer) return <div className="card p-8 text-center text-gray-500">Customer not found.</div>;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Back + header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('customers')} className="btn-ghost">
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      <div className="card p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-primary-100 text-primary-700 text-xl font-bold">
              {customer.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{customer.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={customer.status === 'Active' ? 'success' : customer.status === 'Lead' ? 'warning' : 'neutral'}>
                  {customer.status}
                </Badge>
                <Badge variant={customer.customer_type === 'Distributor' ? 'primary' : customer.customer_type === 'Wholesale' ? 'warning' : 'neutral'}>
                  {customer.customer_type}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('customer-edit', { id: customer.id })} className="btn-secondary">
              <Edit size={15} /> Edit
            </button>
            <button onClick={deleteCustomer} className="btn-danger">
              <Trash2 size={15} /> Delete
            </button>
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          <InfoRow icon={<Phone size={15} />} label="Mobile" value={customer.mobile} />
          <InfoRow icon={<Mail size={15} />} label="Email" value={customer.email || '—'} />
          <InfoRow icon={<Building2 size={15} />} label="Business" value={customer.business_name || '—'} />
          <InfoRow icon={<FileText size={15} />} label="GST Number" value={customer.gst_number || '—'} />
          <InfoRow icon={<MapPin size={15} />} label="Address" value={customer.address || '—'} />
          <InfoRow icon={<Calendar size={15} />} label="Follow-up Date" value={customer.follow_up_date ? new Date(customer.follow_up_date).toLocaleDateString() : '—'} />
        </div>

        {customer.notes && (
          <div className="mt-4 p-3 rounded-lg bg-gray-50 border border-gray-100">
            <p className="text-xs font-semibold text-gray-500 mb-1">Notes</p>
            <p className="text-sm text-gray-700">{customer.notes}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Notes */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <MessageSquare size={16} className="text-primary-600" /> Follow-up Notes
            </h3>
            <button onClick={() => setNoteModal(true)} className="btn-ghost text-primary-600">
              <Plus size={15} /> Add Note
            </button>
          </div>
          {notes.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No notes yet.</p>
          ) : (
            <div className="space-y-3">
              {notes.map((n) => (
                <div key={n.id} className="p-3 rounded-lg bg-gray-50 border border-gray-100 group">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-gray-700 flex-1">{n.note}</p>
                    <button onClick={() => deleteNote(n.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <User size={12} className="text-gray-400" />
                    <p className="text-xs text-gray-400">{n.created_by_name || 'Unknown'}</p>
                    <span className="text-gray-300">·</span>
                    <p className="text-xs text-gray-400">{new Date(n.created_at).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Challans */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText size={16} className="text-primary-600" /> Customer Challans
          </h3>
          {challans.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No challans for this customer.</p>
          ) : (
            <div className="space-y-2">
              {challans.map((ch) => (
                <div key={ch.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => navigate('challan-detail', { id: ch.id })}>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{ch.challan_number}</p>
                    <p className="text-xs text-gray-400">{new Date(ch.created_at).toLocaleDateString()}</p>
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
      </div>

      <Modal open={noteModal} onClose={() => setNoteModal(false)} title="Add Follow-up Note"
        footer={<>
          <button onClick={() => setNoteModal(false)} className="btn-secondary">Cancel</button>
          <button onClick={addNote} className="btn-primary">Save Note</button>
        </>}>
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          rows={4}
          className="form-input"
          placeholder="Enter your follow-up note…"
          autoFocus
        />
      </Modal>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50/60 border border-gray-100">
      <div className="p-2 rounded-lg bg-white text-gray-400 shadow-sm">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p className="text-sm text-gray-800 truncate">{value}</p>
      </div>
    </div>
  );
}
