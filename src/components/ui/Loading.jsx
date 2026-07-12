export default function Loading({ size = 32, text }) {
  return (
    <>
      <style>{`
        @keyframes sf-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '2rem' }}>
        <div
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            border: `3px solid var(--border)`,
            borderTopColor: 'var(--accent)',
            animation: 'sf-spin 0.6s linear infinite',
          }}
        />
        {text && (
          <span style={{ fontSize: '0.85rem', color: 'var(--text-3)' }}>{text}</span>
        )}
      </div>
    </>
  );
}
