import Card from './Card';

const styles = {
  section: {
    padding: '16px 20px',
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
  deck: {
    width: 'var(--card-width)',
    minHeight: 'var(--card-height)',
    background: 'var(--bg-elevated)',
    border: '2px solid var(--border-card)',
    borderRadius: 'var(--radius)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    flexShrink: 0,
    position: 'relative',
    boxShadow: '4px 4px 0 var(--bg-card), 6px 6px 0 var(--border-subtle)',
  },
  deckLabel: {
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  deckCount: {
    fontSize: '24px',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  deckSub: {
    fontSize: '10px',
    color: 'var(--text-muted)',
  },
};

export default function AdventureRow({ cards, deckSize = 0, onCardClick, onLocationClick, selectedId, canAct, cardSlots = {} }) {
  return (
    <div style={styles.section}>
      <div style={styles.label}>Adventure Row</div>
      <div style={styles.row}>
        {cards.map((card) => {
          const isHero = card.type === 'hero';
          const isLocation = card.type === 'location';
          const clickable = canAct && (isHero || isLocation);
          return (
            <Card
              key={card.id}
              card={card}
              filledSlots={cardSlots[card.id] ?? []}
              onClick={clickable
                ? () => (isHero ? onCardClick : onLocationClick)?.(card.id)
                : undefined}
              selected={card.id === selectedId}
              highlighted={clickable}
            />
          );
        })}
        <div style={styles.deck}>
          <div style={styles.deckLabel}>Adventure</div>
          <div style={styles.deckCount}>{deckSize}</div>
          <div style={styles.deckSub}>cards remaining</div>
        </div>
      </div>
    </div>
  );
}
