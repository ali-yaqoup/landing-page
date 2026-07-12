import { Zap } from 'lucide-react';

export default function Footer() {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--border)',
        background: 'var(--bg-card)',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.5rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Zap size={12} color="#fff" strokeWidth={2.5} />
        </div>
        <span style={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: '-0.03em', color: 'var(--text-3)' }}>
          Stock<span style={{ color: 'var(--accent)' }}>Flow</span>
        </span>
      </div>
      <span style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>Smart business management system</span>
      <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>© 2026 StockFlow</span>
      <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>Built by StockFlow Studio</span>
    </footer>
  );
}
