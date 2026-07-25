import { useState } from 'react';
import { Warehouse, Mail, Lock, User, Shield, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const demoAccounts = [
  { email: 'admin@opsportal.demo',    password: 'demo1234', role: 'Admin',    color: 'text-primary-600' },
  { email: 'sales@opsportal.demo',    password: 'demo1234', role: 'Sales',    color: 'text-emerald-600' },
  { email: 'warehouse@opsportal.demo',password: 'demo1234', role: 'Warehouse',color: 'text-amber-600' },
  { email: 'accounts@opsportal.demo', password: 'demo1234', role: 'Accounts', color: 'text-blue-600' },
];

export default function Login() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('sales');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPass, setShowPass] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    if (mode === 'signin') {
      const err = await signIn(email, password);
      if (err) setError(err);
    } else {
      const err = await signUp(email, password, fullName, role);
      if (err) setError(err);
    }
    setBusy(false);
  }

  function quickFill(acc: typeof demoAccounts[0]) {
    setEmail(acc.email);
    setPassword(acc.password);
    setMode('signin');
    setError('');
  }

  return (
    <div className="min-h-screen flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex w-1/2 bg-sidebar relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'radial-gradient(circle at 20% 20%, #4F46E5 0%, transparent 40%), radial-gradient(circle at 80% 80%, #6366f1 0%, transparent 40%)'
        }} />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary-600 shadow-lg shadow-primary-600/30">
              <Warehouse size={24} />
            </div>
            <div>
              <p className="text-lg font-bold">OpsPortal</p>
              <p className="text-xs text-gray-400">Mini ERP + CRM</p>
            </div>
          </div>

          <div className="max-w-md">
            <h2 className="text-3xl font-bold leading-tight">Manage your entire<br/>distribution business<br/>in one place.</h2>
            <p className="text-gray-400 mt-4 text-sm leading-relaxed">
              Customers, inventory, sales challans, accounts, and analytics — built for wholesale and distribution teams.
            </p>
            <div className="flex items-center gap-6 mt-8">
              {['CRM', 'Inventory', 'Challans', 'Accounts'].map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm text-gray-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-400" />
                  {f}
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-gray-500">© 2026 OpsPortal. All rights reserved.</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-surface">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="p-2.5 rounded-xl bg-primary-600 shadow-lg">
              <Warehouse size={22} className="text-white" />
            </div>
            <p className="text-lg font-bold text-gray-900">OpsPortal</p>
          </div>

          <h2 className="text-2xl font-bold text-gray-900">
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {mode === 'signin' ? 'Sign in to your OpsPortal account' : 'Get started with OpsPortal in minutes'}
          </p>

          {/* Demo accounts */}
          {mode === 'signin' && (
            <div className="mt-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Quick demo access</p>
              <div className="grid grid-cols-2 gap-2">
                {demoAccounts.map((acc) => (
                  <button
                    key={acc.email}
                    onClick={() => quickFill(acc)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:border-primary-300 hover:bg-primary-50/50 transition-all text-left group"
                  >
                    <Shield size={14} className={acc.color} />
                    <div>
                      <p className="text-xs font-semibold text-gray-700">{acc.role}</p>
                      <p className="text-[10px] text-gray-400">{acc.email}</p>
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-center text-[11px] text-gray-400 mt-2">Click a role to auto-fill, then Sign In</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="form-label">Full Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="form-input pl-10"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="form-label">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input pl-10"
                  placeholder="you@company.com"
                />
              </div>
            </div>

            <div>
              <label className="form-label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={password ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input pl-10 pr-10"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <div>
                <label className="form-label">Role</label>
                <select value={role} onChange={(e) => setRole(e.target.value)} className="form-input">
                  <option value="admin">Admin</option>
                  <option value="sales">Sales</option>
                  <option value="warehouse">Warehouse</option>
                  <option value="accounts">Accounts</option>
                </select>
              </div>
            )}

            {error && (
              <div className="px-3 py-2.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 animate-fade-in">
                {error}
              </div>
            )}

            <button type="submit" disabled={busy} className="btn-primary w-full justify-center py-2.5 disabled:opacity-60">
              {busy
                ? <><Loader2 size={16} className="animate-spin" /> Please wait…</>
                : <>{mode === 'signin' ? 'Sign In' : 'Create Account'} <ArrowRight size={16} /></>
              }
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}
              className="text-primary-600 font-semibold hover:text-primary-700"
            >
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
