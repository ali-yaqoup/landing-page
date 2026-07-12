import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <motion.div
      className="empty-state"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {Icon && <Icon size={40} style={{ color: 'var(--text-3)', marginBottom: '0.5rem' }} />}
      {title && <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-1)' }}>{title}</h3>}
      {description && <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--text-3)' }}>{description}</p>}
      {action && action.to && (
        <Link to={action.to} className="btn-primary" style={{ marginTop: '1rem' }}>
          {action.label}
        </Link>
      )}
      {action && action.onClick && !action.to && (
        <button className="btn-primary" onClick={action.onClick} style={{ marginTop: '1rem' }}>
          {action.label}
        </button>
      )}
    </motion.div>
  );
}
