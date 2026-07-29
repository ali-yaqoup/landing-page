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
          width: 34,
          height: 34,
          borderRadius: 9,
          background: 'linear-gradient(135deg, #22d3ee, #3b82f6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 18px -6px rgba(6,182,212,0.6)',
        }}
      >
        <Zap size={17} color="#04141b" strokeWidth={2.6} />
      </div>
      <span style={{ fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.02em', color: 'var(--text-1)', fontFamily: 'var(--font-display)' }}>
        ستوك<span style={{ color: 'var(--accent)' }}>فلو</span>
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
  const { dir } = useLanguage();
  const isRTL = dir === 'rtl';
  const offset = isRTL ? 300 : -300;

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
          borderInlineEnd: '1px solid var(--border)',
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
                  inset: 0,
                  background: 'rgba(2,6,23,0.6)',
                  backdropFilter: 'blur(2px)',
                  zIndex: 40,
                }}
              />
              <motion.aside
                initial={{ x: offset }}
                animate={{ x: 0 }}
                exit={{ x: offset }}
                transition={{ type: 'tween', duration: 0.25 }}
                style={{
                  position: 'fixed',
                  insetInlineStart: 0,
                  top: 0,
                  width: 280,
                  height: '100vh',
                  background: 'var(--bg-sidebar)',
                  zIndex: 50,
                  display: 'flex',
                  flexDirection: 'column',
                  overflowY: 'auto',
                  boxShadow: '0 0 40px rgba(0,0,0,0.45)',
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
