import type { ReactNode } from 'react';
import { Header } from './Header';
import { BottomNav } from './BottomNav';

interface AppLayoutProps {
  children: ReactNode;
  hideNav?: boolean;
  hideHeader?: boolean;
}

export function AppLayout({ children, hideNav = false, hideHeader = false }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {!hideHeader && <Header />}
      <main className={`flex-1 ${!hideNav ? 'pb-20' : ''}`}>
        {children}
      </main>
      {!hideNav && <BottomNav />}
    </div>
  );
}
