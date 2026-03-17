import Card from './Card';

const BUST_TYPES_SET = new Set(['inexperience', 'vermin', 'wound']);

const styles = {
  section: {
    padding: '8px 24px 16px',
  },
  label: {
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    color: 'var(--type-location)',
    marginBottom: '10px',
    fontWeight: 700,
    fontFamily: 'var(--font-display)',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  row: {
    display: 'flex',
    gap: '12px',
    overflowX: 'auto',
    paddingBottom: '4px',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
};

export default function DiscoveredLocations({ locations, onCardClick, canAct, cardSlots = {}, onCubeDrop, isDusk, draggedCubeType, playerTokensMap = {} }) {
  const dragging = isDusk && draggedCubeType;
  const locationValid = !dragging || !BUST_TYPES_SET.has(draggedCubeType);

  return (
    <div style={styles.section}>
      <div style={styles.label}>Discovered Locations</div>
      <div style={styles.row}>
        {locations.map((loc) => (
          <div key={loc.id} style={{
            ...(dragging && locationValid ? { boxShadow: '0 0 10px 2px rgba(184, 134, 11, 0.5)' } : {}),
            ...(dragging && !locationValid ? { opacity: 0.4, transition: 'opacity 0.2s' } : {}),
            borderRadius: 'var(--radius)',
          }}>
            <Card
              card={loc}
              filledSlots={cardSlots[loc.id] ?? []}
              onClick={canAct ? () => onCardClick?.(loc.id) : undefined}
              highlighted={canAct}
              onCubeDrop={onCubeDrop}
              playerTokens={playerTokensMap[loc.id]}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
