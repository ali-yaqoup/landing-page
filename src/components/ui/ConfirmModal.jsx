import Modal from './Modal';

export default function ConfirmModal({ isOpen, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', busy, onConfirm, onCancel }) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title || 'Confirm action'}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <p style={{ margin: 0, color: 'var(--text-2)', lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-ghost"
            onClick={onCancel}
            disabled={busy}
            style={{ padding: '0.75rem 1rem' }}
          >
            {cancelLabel}
          </button>
          <button type="button" className="btn-danger" onClick={onConfirm} disabled={busy}>
            {busy ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
