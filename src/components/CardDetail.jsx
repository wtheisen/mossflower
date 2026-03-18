import Card from './Card';

const styles = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(30, 20, 10, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    animation: 'fadeInBackdrop 0.15s ease-out both',
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    animation: 'fadeInPage 0.2s ease-out both',
    /* Force full desktop card size */
    '--card-width': '170px',
    '--card-height': '220px',
    '--cube-size': '22px',
    '--slot-size': '20px',
    '--radius': '10px',
    '--radius-sm': '6px',
  },
  actions: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  actionBtn: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 700,
    fontFamily: 'var(--font-display)',
    color: '#fff',
    background: 'var(--accent-gold)',
    border: '2px solid rgba(255,255,255,0.3)',
    borderRadius: '8px',
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    boxShadow: '0 2px 8px rgba(100, 80, 50, 0.3)',
    minWidth: '100px',
    minHeight: '44px',
  },
  dismissHint: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    fontStyle: 'italic',
    fontFamily: 'var(--font-body)',
  },
};

export default function CardDetail({ card, filledSlots = [], onClose, actions = [], wide = false, playerTokens }) {
  return (
    <div className="card-detail-backdrop" style={styles.backdrop} onClick={onClose}>
      <div className="card-detail" style={styles.container} onClick={(e) => e.stopPropagation()}>
        <Card
          card={card}
          filledSlots={filledSlots}
          wide={wide}
          playerTokens={playerTokens}
        />
        {actions.length > 0 && (
          <div style={styles.actions}>
            {actions.map((a) => (
              <button key={a.label} style={styles.actionBtn} onClick={a.handler}>
                {a.label}
              </button>
            ))}
          </div>
        )}
        <span style={styles.dismissHint}>Tap outside to dismiss</span>
      </div>
    </div>
  );
}
