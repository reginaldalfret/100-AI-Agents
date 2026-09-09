import React, { useEffect } from 'react';
// Fallback Outlet component for compatibility
const Outlet: React.FC = () => null;
import { Sidebar } from '../navigation/Sidebar';
import { useAppStore } from '../../store/useAppStore';

export interface AppShellProps {
  children?: React.ReactNode;
  activeView?: string;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { isMobileSidebarOpen, toggleMobileSidebar, setMobileSidebarOpen, fetchAgents } = useAppStore();

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  return (
    <div className="app-shell-root" style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      {/* 1. Atmospheric RGB Neon Background */}
      <div className="ambient-background" aria-hidden="true">
        <div className="ambient-orb orb-blue" />
        <div className="ambient-orb orb-violet" />
        <div className="ambient-orb orb-cyan" />
        <div className="ambient-orb orb-magenta" />
        <div className="bg-mesh" />
      </div>

      {/* 2. Mobile Backdrop for Slide-out Drawer */}
      {isMobileSidebarOpen && (
        <div
          className="sidebar-backdrop active"
          onClick={() => setMobileSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            zIndex: 90,
            cursor: 'pointer'
          }}
          aria-label="Close navigation drawer"
        />
      )}

      {/* 3. Main App Layout (Sidebar + Main Workspace) */}
      <div className="app-layout" data-ui-build="liquid-glass-v2">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Right Main Workspace */}
        <main className="main-workspace" style={{ position: 'relative', flex: 1, minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Mobile hamburger toggle button */}
          <button
            className="mobile-hamburger-btn"
            onClick={toggleMobileSidebar}
            aria-label="Toggle navigation menu"
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              zIndex: 80,
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              color: 'var(--text-primary)',
              display: 'none', // Shown in CSS media queries @media (max-width: 900px)
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 0 12px rgba(6, 182, 212, 0.3)'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          {/* Active View Route Content */}
          <div style={{ flex: 1, minHeight: 0, width: '100%', display: 'flex', flexDirection: 'column' }}>
            {children ? children : <Outlet />}
          </div>
        </main>
      </div>

      {/* Responsive Media Style Support */}
      <style>{`
        @media (max-width: 900px) {
          .mobile-hamburger-btn {
            display: flex !important;
          }
          .sidebar {
            position: fixed !important;
            top: 0;
            bottom: 0;
            left: 0;
            width: 300px !important;
            max-width: 80vw !important;
            transform: translateX(-105%);
            transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 100 !important;
            box-shadow: 0 0 40px rgba(0, 0, 0, 0.9) !important;
          }
          .sidebar.mobile-open {
            transform: translateX(0) !important;
          }
          .app-layout {
            padding: 8px !important;
            gap: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};
