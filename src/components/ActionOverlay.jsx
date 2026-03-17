import Card from './Card';
import Bag from './Bag';
import Band from './Band';

const styles = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(60, 45, 30, 0.5)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  panel: {
    background: 'linear-gradient(170deg, var(--bg-surface) 0%, var(--bg-elevated) 100%)',
    border: '2px solid var(--border-card)',
    borderRadius: '14px',
    padding: '28px',
    display: 'flex',
    gap: '24px',
    alignItems: 'flex-start',
    maxWidth: '90vw',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 8px 32px rgba(80, 60, 30, 0.25), 0 0 0 1px var(--border-subtle)',
  },
  cardSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
  },
  targetLabel: {
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    color: 'var(--text-muted)',
    fontWeight: 600,
    fontFamily: 'var(--font-display)',
    fontStyle: 'italic',
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
  power, bustThreshold, bustCount, drawBonuses,
  onDraw, onRecruit, onResolveCombat, onCancel,
}) {
  if (!action) return null;

  const isCombat = action.type === 'combat';
  const label = isCombat ? 'Combat' : action.type === 'recruit' ? 'Recruiting' : 'Action';

  return (
    <div style={styles.backdrop} onClick={isCombat ? undefined : onCancel}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div style={styles.cardSection}>
          <div style={styles.targetLabel}>{label}</div>
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
            power={power}
            bustThreshold={bustThreshold}
            bustCount={bustCount}
            drawBonuses={drawBonuses}
            onDraw={onDraw}
            onRecruit={onRecruit}
            onResolveCombat={onResolveCombat}
            onCancel={onCancel}
          />
        </div>
      </div>
    </div>
  );
}
