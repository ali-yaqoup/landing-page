import { useContext } from 'react';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../lib/firebase';
import { AuthContext } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useBusiness } from '../../hooks/useBusiness';
import { useLanguage } from '../../context/LanguageContext';
import { Sun, Moon, LogOut, Menu, Languages } from 'lucide-react';

export default function Navbar({ onMenuToggle }) {
  const { user } = useContext(AuthContext);
  const { dark, toggle } = useTheme();
  const {
    business,
    branches,
    warehouses,
    activeBranchId,
    setActiveBranchId,
    activeWarehouseId,
    setActiveWarehouseId,
  } = useBusiness();
  const { language, setLanguage, t, dir } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <>
      <style>{`
        .hamburger-btn { display: flex; }
        @media (min-width: 1024px) {
          .hamburger-btn { display: none !important; }
        }
        @media (max-width: 639px) {
          .user-info-section { display: none !important; }
        }
      `}</style>

      <header
        style={{
          height: 56,
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1rem',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        {/* Left side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            className="hamburger-btn"
            onClick={onMenuToggle}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 4,
            }}
          >
            <Menu size={22} />
          </button>
          <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-2)', marginRight: '0.5rem' }}>
            {business?.name || 'StockFlow'}
          </span>

          {/* Branch Dropdown */}
          {branches.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-3)', fontWeight: 500 }}>
                {language === 'ar' ? 'الفرع:' : 'Branch:'}
              </span>
              <select
                value={activeBranchId}
                onChange={(e) => setActiveBranchId(e.target.value)}
                style={{
                  height: 30,
                  padding: '0 1.5rem 0 0.5rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  width: 'auto',
                  maxWidth: 160,
                  cursor: 'pointer',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-body)',
                  color: 'var(--text-1)',
                  borderRadius: 6,
                  outline: 'none',
                }}
              >
                <option value="all">{language === 'ar' ? "الكل" : "All Branches"}</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Warehouse Dropdown */}
          {warehouses.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-3)', fontWeight: 500 }}>
                {language === 'ar' ? 'المستودع:' : 'Warehouse:'}
              </span>
              <select
                value={activeWarehouseId}
                onChange={(e) => setActiveWarehouseId(e.target.value)}
                style={{
                  height: 30,
                  padding: '0 1.5rem 0 0.5rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  width: 'auto',
                  maxWidth: 160,
                  cursor: 'pointer',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-body)',
                  color: 'var(--text-1)',
                  borderRadius: 6,
                  outline: 'none',
                }}
              >
                <option value="all">{language === 'ar' ? "الكل" : "All Warehouses"}</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Language Switcher */}
          <button
            onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
            style={{
              background: 'none',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '0 0.625rem',
              height: 34,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-1)',
              fontSize: '0.8rem',
              fontWeight: 600,
              gap: 4,
            }}
            title={language === 'ar' ? 'Switch to English' : 'التحويل للعربية'}
          >
            <Languages size={15} className="text-cyan-400" />
            <span>{language === 'ar' ? 'EN' : 'عربي'}</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggle}
            style={{
              background: 'none',
              border: '1px solid var(--border)',
              borderRadius: 8,
              width: 34,
              height: 34,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-2)',
            }}
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* User Info */}
          <div
            className="user-info-section"
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: dir === 'rtl' ? 'flex-start' : 'flex-end', 
              gap: 2 
            }}
          >
            <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>
              {language === 'ar' ? 'المستخدم' : 'User'}
            </span>
            <span
              style={{
                fontSize: '0.8rem',
                fontWeight: 500,
                color: 'var(--text-1)',
                maxWidth: 150,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user?.email}
            </span>
          </div>

          {/* Divider */}
          <div style={{ height: 20, width: 1, background: 'var(--border)' }} />

          {/* Logout */}
          <button
            onClick={handleLogout}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-2)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#f87171')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-2)')}
          >
            <LogOut size={16} />
            <span>{t('nav.logout')}</span>
          </button>
        </div>
      </header>
    </>
  );
}
