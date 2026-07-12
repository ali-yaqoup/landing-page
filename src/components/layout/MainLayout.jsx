import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Footer from './Footer';

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <style>{`
        .main-content { padding: 1rem; }
        @media (min-width: 640px) {
          .main-content { padding: 1.5rem; }
        }
        @media (min-width: 1024px) {
          .main-content { padding: 2rem; }
        }
      `}</style>

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--bg-card)',
            color: 'var(--text-1)',
            border: '1px solid var(--border)',
            fontFamily: 'var(--font)',
            fontSize: '0.875rem',
          },
        }}
      />

      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', overflowX: 'hidden', minWidth: 0 }}>
          <Navbar onMenuToggle={() => setSidebarOpen(true)} />
          <main style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)' }}>
            <div className="main-content" style={{ minWidth: 0 }}>
              <Outlet />
            </div>
          </main>
          <Footer />
        </div>
      </div>
    </>
  );
}
