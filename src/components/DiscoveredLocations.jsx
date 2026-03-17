import Card from './Card';

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
  },
  row: {
    display: 'flex',
    gap: '12px',
    overflowX: 'auto',
    paddingBottom: '4px',
    alignItems: 'flex-start',
  },
};

export default function DiscoveredLocations({ locations, onCardClick, canAct, cardSlots = {}, onCubeDrop }) {
  return (
    <div style={styles.section}>
      <div style={styles.label}>Discovered Locations</div>
      <div style={styles.row}>
        {locations.map((loc) => (
          <Card
            key={loc.id}
            card={loc}
            filledSlots={cardSlots[loc.id] ?? []}
            onClick={canAct ? () => onCardClick?.(loc.id) : undefined}
            highlighted={canAct}
            onCubeDrop={onCubeDrop}
          />
        ))}
      </div>
    </div>
  );
}
