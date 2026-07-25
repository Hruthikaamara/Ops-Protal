import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface">
      <Sidebar />
      <div className="ml-64 transition-all">
        <Navbar />
        <main className="p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
