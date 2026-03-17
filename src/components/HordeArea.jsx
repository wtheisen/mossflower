import Card from './Card';

const styles = {
  section: {
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
  label: {
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    color: 'var(--accent-red)',
    fontWeight: 700,
    fontFamily: 'var(--font-display)',
    fontStyle: 'italic',
    textAlign: 'center',
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
  deckBadge: {
    fontSize: '11px',
    fontWeight: 600,
    fontFamily: 'var(--font-display)',
    color: 'var(--text-secondary)',
    textAlign: 'center',
    padding: '4px 0',
  },
};

export default function HordeArea({
  fortress, fortressDeck = [], fortressCleared, villain,
  canAct, cardSlots = {},
  onFortressClick, onVillainClick, playerTokensMap = {},
}) {
  const fortressVermin = fortress ? (cardSlots[fortress.id] ?? []) : [];
  const villainVermin = villain ? (cardSlots[villain.id] ?? []) : [];
  const villainLocked = !fortressCleared;

  return (
    <div style={styles.section}>
      <div style={styles.label}>The Horde</div>

      {/* Fortress */}
      <div style={styles.cardWrapper}>
        {fortress ? (
          <div
            style={canAct ? styles.clickable : undefined}
            onClick={canAct && onFortressClick ? () => onFortressClick(fortress.id) : undefined}
          >
            <Card card={fortress} filledSlots={fortressVermin} playerTokens={playerTokensMap[fortress.id]} />
          </div>
        ) : (
          <div style={styles.clearedPlaceholder}>Cleared</div>
        )}
      </div>

      {/* Fortress deck count */}
      {fortressDeck.length > 0 && (
        <div style={styles.deckBadge}>
          Fortress deck: {fortressDeck.length} left
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
          <Card card={villain} filledSlots={villainVermin} playerTokens={playerTokensMap[villain.id]} />
          {villainLocked && (
            <div style={styles.lockedBadge}>Locked</div>
          )}
        </div>
      </div>
    </div>
  );
}
