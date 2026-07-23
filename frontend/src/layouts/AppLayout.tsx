import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { SystemStatusBar } from '../components/ui/SystemStatusBar';

export const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ background: 'var(--page)' }}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto" style={{ background: 'var(--page)' }}>
          <div className="px-6 py-5 max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
        <SystemStatusBar />
      </div>
    </div>
  );
};
