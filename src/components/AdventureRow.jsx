import Card from './Card';

const styles = {
  section: {
    padding: '16px 24px',
  },
  label: {
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    color: 'var(--text-muted)',
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
  deck: {
    width: 'var(--card-width)',
    minHeight: 'var(--card-height)',
    background: 'linear-gradient(170deg, var(--bg-elevated) 0%, var(--bg-card) 100%)',
    border: '2px solid var(--border-card)',
    borderRadius: 'var(--radius)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    flexShrink: 0,
    position: 'relative',
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
