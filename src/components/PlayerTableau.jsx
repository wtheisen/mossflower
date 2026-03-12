import Card from './Card';

const styles = {
  section: {
    padding: 0,
  },
  label: {
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--text-muted)',
    marginBottom: '10px',
    fontWeight: 600,
  },
  row: {
    display: 'flex',
    gap: '12px',
    overflowX: 'auto',
    paddingBottom: '4px',
    alignItems: 'flex-start',
  },
};

/**
 * Renders the current player's champion + recruited hero cards.
 *
 * @param {object} champion — champion card data
 * @param {Array} tableau — list of hero cards in the tableau
 * @param {object} placements — { cardId: [{type: cubeType}, ...] }
 */
export default function PlayerTableau({ champion, tableau, placements = {}, onCubeDrop, onReturnCube }) {
  return (
    <div style={styles.section}>
      <div style={styles.label}>
        {champion.name} — Tableau
      </div>
      <div style={styles.row}>
        <Card
          card={champion}
          filledSlots={placements[champion.id] ?? []}
          wide
          onCubeDrop={onCubeDrop}
          onSlotClick={onReturnCube ? (slotIdx) => onReturnCube(champion.id, slotIdx) : undefined}
        />
        {tableau.map((hero) => (
          <Card
            key={hero.id}
            card={hero}
            filledSlots={placements[hero.id] ?? []}
            onCubeDrop={onCubeDrop}
            onSlotClick={onReturnCube ? (slotIdx) => onReturnCube(hero.id, slotIdx) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
