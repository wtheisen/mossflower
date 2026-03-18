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

export default function AdventureRow({ cards, deckSize = 0, onCardClick, onLocationClick, selectedId, canAct, cardSlots = {}, playerTokensMap = {}, compact = false, onExpand }) {
  return (
    <div className="adventure-row" style={styles.section}>
      <div className="adventure-row__label" style={styles.label}>Adventure Row</div>
      <div className="adventure-row__cards" style={{
        ...styles.row,
        ...(compact ? { flexDirection: 'column', gap: '4px', alignItems: 'stretch' } : {}),
      }}>
        {cards.map((card) => {
          const isHero = card.type === 'hero';
          const isLocation = card.type === 'location';
          const clickable = canAct && (isHero || isLocation);
          const slots = cardSlots[card.id] ?? [];
          return (
            <Card
              key={card.id}
              card={card}
              filledSlots={slots}
              wide={!compact && card.affinity === 'badger'}
              compact={compact}
              onExpand={onExpand ? () => onExpand(card, slots, {
                playerTokens: playerTokensMap[card.id],
                wide: card.affinity === 'badger',
              }) : undefined}
              onClick={!compact && clickable
                ? () => (isHero ? onCardClick : onLocationClick)?.(card.id)
                : undefined}
              selected={card.id === selectedId}
              highlighted={clickable}
              playerTokens={playerTokensMap[card.id]}
            />
          );
        })}
        {compact ? (
          <div className="adventure-row__deck-compact" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '4px 8px', fontSize: '10px', fontWeight: 600,
            fontFamily: 'var(--font-display)', color: 'var(--text-muted)',
            background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
          }}>
            Deck: {deckSize}
          </div>
        ) : (
          <div style={styles.deck}>
            <div style={styles.deckLabel}>Adventure</div>
            <div style={styles.deckCount}>{deckSize}</div>
            <div style={styles.deckSub}>cards remaining</div>
          </div>
        )}
      </div>
    </div>
  );
}
