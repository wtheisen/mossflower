import Card from './Card';
import Bag from './Bag';
import Band from './Band';

const styles = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  panel: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '12px',
    padding: '24px',
    display: 'flex',
    gap: '20px',
    alignItems: 'flex-start',
    maxWidth: '90vw',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
  },
  cardSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  targetLabel: {
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--text-muted)',
    fontWeight: 600,
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    minWidth: '160px',
  },
};

export default function ActionOverlay({
  targetCard, bag, band, action, busted, bagEmpty, message,
  onDraw, onRecruit, onCancel,
}) {
  if (!action) return null;

  return (
    <div style={styles.backdrop} onClick={onCancel}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div style={styles.cardSection}>
          <div style={styles.targetLabel}>
            {action.type === 'recruit' ? 'Recruiting' : 'Action'}
          </div>
          <Card card={targetCard} selected />
        </div>
        <div style={styles.sidebar}>
          <Bag cubes={bag} />
          <Band
            cubes={band}
            action={action}
            busted={busted}
            bagEmpty={bagEmpty}
            message={message}
            onDraw={onDraw}
            onRecruit={onRecruit}
            onCancel={onCancel}
          />
        </div>
      </div>
    </div>
  );
}
