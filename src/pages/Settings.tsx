import { useEffect, useState } from 'react';
import {
  User, Mail, Phone, Shield, Save, Loader2, Check, Lock, Calendar,
  ChevronRight, AlertCircle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import Badge from '@/components/Badge';
import Loading from '@/components/Loading';
import type { Role } from '@/lib/types';

const roleOptions: { value: Role; label: string; description: string; color: string }[] = [
  { value: 'admin',    label: 'Admin',     description: 'Full access to all modules and settings', color: 'text-primary-600 bg-primary-50' },
  { value: 'sales',    label: 'Sales',     description: 'Manage customers, challans, and view reports', color: 'text-emerald-600 bg-emerald-50' },
  { value: 'warehouse',label: 'Warehouse', description: 'Manage inventory, stock movements, and products', color: 'text-amber-600 bg-amber-50' },
  { value: 'accounts', label: 'Accounts',  description: 'View accounts dashboard and financial reports', color: 'text-blue-600 bg-blue-50' },
];

export default function Settings() {
  const { profile, refreshProfile, signOut } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>('sales');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name);
      setPhone(profile.phone);
      setSelectedRole(profile.role);
      setLoading(false);
    }
  }, [profile]);

  async function saveProfile() {
    if (!profile) return;
    setSaving(true);
    setSaved(false);
    await supabase.from('profiles').update({
      full_name: fullName,
      phone,
      role: selectedRole,
    }).eq('id', profile.id);
    await refreshProfile();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (loading || !profile) return <Loading />;

  return (
    <div className="max-w-3xl space-y-5 animate-fade-in">
      {/* Profile header card */}
      <div className="card p-6">
        <div className="flex items-center gap-4">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white text-2xl font-bold shadow-lg shadow-primary-600/30">
            {profile.full_name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">{profile.full_name}</h2>
            <p className="text-sm text-gray-500">{profile.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="primary">
                <Shield size={11} className="mr-1" /> {profile.role}
              </Badge>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <Calendar size={12} /> Joined {new Date(profile.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Profile info form */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <User size={16} className="text-primary-600" /> Personal Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Full Name</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="form-input pl-10" />
            </div>
          </div>
          <div>
            <label className="form-label">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={profile.email} disabled className="form-input pl-10 bg-gray-50 text-gray-400" />
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="form-label">Phone</label>
            <div className="relative">
              <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className="form-input pl-10" placeholder="9876543210" />
            </div>
          </div>
        </div>
      </div>

      {/* Role selector */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <Shield size={16} className="text-primary-600" /> Role & Permissions
        </h3>
        <p className="text-xs text-gray-500 mb-4">Select the role that determines what modules you can access. Changes take effect immediately on save.</p>

        <div className="space-y-2.5">
          {roleOptions.map((opt) => {
            const active = selectedRole === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setSelectedRole(opt.value)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                  active ? 'border-primary-300 bg-primary-50/40 shadow-sm' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50/50'
                }`}
              >
                <div className={`p-2.5 rounded-lg ${opt.color}`}>
                  <Shield size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{opt.label}</p>
                  <p className="text-xs text-gray-500">{opt.description}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  active ? 'border-primary-600 bg-primary-600' : 'border-gray-300'
                }`}>
                  {active && <Check size={12} className="text-white" />}
                </div>
              </button>
            );
          })}
        </div>

        {selectedRole !== profile.role && (
          <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2">
            <AlertCircle size={16} className="text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700">
              You are about to change your role from <strong>{profile.role}</strong> to <strong>{selectedRole}</strong>.
              This will change which modules you can access in the sidebar.
            </p>
          </div>
        )}
      </div>

      {/* Security */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Lock size={16} className="text-primary-600" /> Security
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
            <div className="flex items-center gap-3">
              <Lock size={16} className="text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-800">Password</p>
                <p className="text-xs text-gray-400">Change your account password</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-gray-300" />
          </div>
          <button onClick={signOut} className="w-full flex items-center justify-between p-3 rounded-lg border border-red-100 hover:bg-red-50 cursor-pointer transition-colors">
            <div className="flex items-center gap-3">
              <Lock size={16} className="text-red-400" />
              <div className="text-left">
                <p className="text-sm font-medium text-red-600">Sign Out</p>
                <p className="text-xs text-gray-400">Log out of your account</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-gray-300" />
          </button>
        </div>
      </div>

      {/* Save bar */}
      <div className="card p-4 flex items-center justify-between sticky bottom-4">
        <div>
          {saved && (
            <p className="text-sm text-emerald-600 flex items-center gap-1.5 animate-fade-in">
              <Check size={16} /> Profile updated successfully!
            </p>
          )}
        </div>
        <button onClick={saveProfile} disabled={saving} className="btn-primary disabled:opacity-60">
          {saving ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : <><Save size={16} /> Save Changes</>}
        </button>
      </div>
    </div>
  );
}
