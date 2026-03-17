import Card from './Card';
import CubeSlots from './CubeSlots';

const styles = {
  section: {
    padding: '16px 24px 8px',
  },
  label: {
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    color: 'var(--accent-red)',
    marginBottom: '10px',
    fontWeight: 700,
    fontFamily: 'var(--font-display)',
    fontStyle: 'italic',
  },
  row: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
  },
  cardWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  clickable: {
    cursor: 'pointer',
    transition: 'transform 0.1s',
  },
  locked: {
    opacity: 0.6,
    position: 'relative',
  },
  lockedBadge: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    background: 'rgba(60, 45, 30, 0.85)',
    color: '#fff',
    padding: '4px 12px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 700,
    fontFamily: 'var(--font-display)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    whiteSpace: 'nowrap',
    zIndex: 2,
  },
  clearedPlaceholder: {
    width: 'var(--card-width)',
    minHeight: 'var(--card-height)',
    background: 'linear-gradient(170deg, var(--bg-elevated) 0%, rgba(139, 104, 66, 0.08) 100%)',
    border: '2px dashed var(--border-subtle)',
    borderRadius: 'var(--radius)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-display)',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  verminSlots: {
    padding: '4px 0',
  },
  verminLabel: {
    fontSize: '9px',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '3px',
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
  },
  deck: {
    width: 'var(--card-width)',
    minHeight: 'var(--card-height)',
    background: 'linear-gradient(170deg, var(--bg-elevated) 0%, rgba(139, 104, 66, 0.08) 100%)',
    border: '2px solid var(--type-fortress)',
    borderRadius: 'var(--radius)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    flexShrink: 0,
    boxShadow: '3px 3px 0 var(--border-subtle), 5px 5px 0 var(--bg-elevated)',
  },
  deckLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontFamily: 'var(--font-display)',
  },
  deckCount: {
    fontSize: '26px',
    fontWeight: 700,
    fontFamily: 'var(--font-display)',
    color: 'var(--text-primary)',
  },
  deckSub: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    fontStyle: 'italic',
  },
  track: {
    width: 'calc(var(--card-width) * 2 + 12px)',
    minHeight: 'var(--card-height)',
    background: 'linear-gradient(170deg, var(--bg-card) 0%, rgba(160, 80, 64, 0.06) 100%)',
    border: '2px solid var(--accent-red)',
    borderRadius: 'var(--radius)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    flexShrink: 0,
    boxShadow: '0 2px 8px rgba(100, 80, 50, 0.12), inset 0 1px 0 rgba(255,255,255,0.4)',
  },
  trackHeader: {
    padding: '10px 12px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  trackBadge: {
    fontSize: '9px',
    fontWeight: 700,
    fontFamily: 'var(--font-display)',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    padding: '2px 8px',
    borderRadius: '10px',
    alignSelf: 'flex-start',
    color: '#fff',
    background: 'var(--accent-red)',
  },
  trackName: {
    fontSize: '14px',
    fontWeight: 600,
    fontFamily: 'var(--font-display)',
    fontStyle: 'italic',
    color: 'var(--text-primary)',
    lineHeight: 1.25,
  },
  trackBody: {
    padding: '0 12px 8px',
    fontSize: '12px',
    color: 'var(--text-secondary)',
    lineHeight: 1.4,
    flex: 1,
    fontStyle: 'italic',
  },
  trackSlots: {
    marginTop: 'auto',
    padding: '6px 12px 12px',
    borderTop: '1px dashed var(--border-subtle)',
  },
  trackSlotsLabel: {
    fontSize: '9px',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '5px',
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
  },
};

export default function HordeArea({
  fortress, fortressDeck = [], fortressCleared, villain,
  conquest = 0, canAct, cardSlots = {},
  onFortressClick, onVillainClick,
}) {
  const filled = Array.from({ length: conquest }, () => ({ type: 'vermin' }));
  const fortressVermin = fortress ? (cardSlots[fortress.id] ?? []) : [];
  const villainVermin = villain ? (cardSlots[villain.id] ?? []) : [];
  const villainLocked = !fortressCleared;

  return (
    <div style={styles.section}>
      <div style={styles.label}>The Horde</div>
      <div style={styles.row}>
        {/* Fortress */}
        <div style={styles.cardWrapper}>
          {fortress ? (
            <div
              style={canAct ? styles.clickable : undefined}
              onClick={canAct && onFortressClick ? () => onFortressClick(fortress.id) : undefined}
            >
              <Card card={fortress} filledSlots={fortressVermin} />
            </div>
          ) : (
            <div style={styles.clearedPlaceholder}>Cleared</div>
          )}
        </div>

        {/* Fortress deck */}
        {fortressDeck.length > 0 && (
          <div style={styles.deck}>
            <div style={styles.deckLabel}>Fortress</div>
            <div style={styles.deckCount}>{fortressDeck.length}</div>
            <div style={styles.deckSub}>remaining</div>
          </div>
        )}

        {/* Villain */}
        <div style={styles.cardWrapper}>
          <div
            style={{
              ...(villainLocked ? styles.locked : {}),
              ...(canAct && !villainLocked ? styles.clickable : {}),
              position: 'relative',
            }}
            onClick={canAct && !villainLocked && onVillainClick ? () => onVillainClick(villain.id) : undefined}
          >
            <Card card={villain} filledSlots={villainVermin} />
            {villainLocked && (
              <div style={styles.lockedBadge}>Locked</div>
            )}
          </div>
        </div>

        {/* Conquest track */}
        <div style={styles.track}>
          <div style={styles.trackHeader}>
            <span style={styles.trackBadge}>Conquest</span>
            <span style={styles.trackName}>Conquest Track</span>
          </div>
          <div style={styles.trackBody}>
            Game ends if this reaches 10.
          </div>
          <div style={styles.trackSlots}>
            <div style={styles.trackSlotsLabel}>
              Vermin ({conquest}/10)
            </div>
            <CubeSlots total={10} filled={filled} />
          </div>
        </div>
      </div>
    </div>
  );
}
