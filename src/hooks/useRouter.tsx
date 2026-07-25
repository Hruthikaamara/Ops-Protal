import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { Page } from '@/lib/types';

interface RouterContextType {
  page: Page;
  params: Record<string, string>;
  navigate: (page: Page, params?: Record<string, string>) => void;
}

const RouterContext = createContext<RouterContextType | null>(null);

export function RouterProvider({ children }: { children: ReactNode }) {
  const [page, setPage] = useState<Page>('dashboard');
  const [params, setParams] = useState<Record<string, string>>({});

  function navigate(newPage: Page, newParams: Record<string, string> = {}) {
    setPage(newPage);
    setParams(newParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <RouterContext.Provider value={{ page, params, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter(): RouterContextType {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRouter must be used within RouterProvider');
  return ctx;
}
