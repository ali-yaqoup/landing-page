import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, FolderOpen, Truck, Users, ShoppingCart, Receipt, BarChart3, Settings, Zap, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';

const NAV = [
  { to: '/dashboard', key: 'nav.dashboard', Icon: LayoutDashboard },
  { to: '/products', key: 'nav.products', Icon: Package },
  { to: '/categories', key: 'nav.categories', Icon: FolderOpen },
  { to: '/suppliers', key: 'nav.suppliers', Icon: Truck },
  { to: '/customers', key: 'nav.customers', Icon: Users },
  { to: '/sales', key: 'nav.sales', Icon: ShoppingCart },
  { to: '/expenses', key: 'nav.expenses', Icon: Receipt },
  { to: '/reports', key: 'nav.reports', Icon: BarChart3 },
  { to: '/settings', key: 'nav.settings', Icon: Settings },
];

function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Zap size={16} color="#fff" strokeWidth={2.5} />
      </div>
      <span style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.03em', color: 'var(--text-1)' }}>
        Stock<span style={{ color: 'var(--accent)' }}>Flow</span>
      </span>
    </div>
  );
}

function NavItems({ onItemClick }) {
  const { t } = useLanguage();
  return (
    <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: 2 }}>
      {NAV.map(({ to, key, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end
          className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          onClick={onItemClick}
        >
          <Icon size={17} />
          {t(key)}
        </NavLink>
      ))}
    </nav>
  );
}

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      <style>{`
        .sidebar-desktop { display: none; }
        .sidebar-mobile-overlay { display: block; }
        @media (min-width: 1024px) {
          .sidebar-desktop { display: flex !important; }
          .sidebar-mobile-overlay { display: none !important; }
        }
      `}</style>

      {/* Desktop sidebar */}
      <aside
        className="sidebar-desktop"
        style={{
          width: 240,
          flexShrink: 0,
          borderRight: '1px solid var(--border)',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflowY: 'auto',
          background: 'var(--bg-sidebar)',
        }}
      >
        <div style={{ padding: '1.5rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
          <Logo />
        </div>
        <NavItems />
      </aside>

      {/* Mobile overlay */}
      <div className="sidebar-mobile-overlay">
        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0,0,0,0.5)',
                  zIndex: 40,
                }}
              />
              <motion.aside
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: 'tween', duration: 0.25 }}
                style={{
                  position: 'fixed',
                  left: 0,
                  top: 0,
                  width: 280,
                  height: '100vh',
                  background: 'var(--bg-sidebar)',
                  zIndex: 50,
                  display: 'flex',
                  flexDirection: 'column',
                  overflowY: 'auto',
                  boxShadow: '4px 0 24px rgba(0,0,0,0.2)',
                }}
              >
                <div
                  style={{
                    padding: '1.5rem 1.25rem',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Logo />
                  <button
                    onClick={onClose}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 4,
                    }}
                  >
                    <X size={20} />
                  </button>
                </div>
                <NavItems onItemClick={onClose} />
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
