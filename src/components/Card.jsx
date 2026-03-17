import CubeSlots from './CubeSlots';
import CubeChip from './CubeChip';

const TYPE_COLORS = {
  champion: 'var(--type-champion)',
  hero: 'var(--type-hero)',
  location: 'var(--type-location)',
  quest: 'var(--type-quest)',
  fortress: 'var(--type-fortress)',
  villain: 'var(--type-villain)',
};

const styles = {
  card: {
    width: 'var(--card-width)',
    minHeight: 'var(--card-height)',
    background: 'var(--bg-card)',
    borderRadius: 'var(--radius)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    position: 'relative',
    flexShrink: 0,
  },
  header: {
    padding: '8px 10px 6px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  typeBadge: {
    fontSize: '9px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    padding: '2px 6px',
    borderRadius: 'var(--radius-sm)',
    alignSelf: 'flex-start',
    color: '#fff',
  },
  name: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    lineHeight: 1.2,
  },
  body: {
    padding: '0 10px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flex: 1,
  },
  affinities: {
    display: 'flex',
    gap: '4px',
    flexWrap: 'wrap',
  },
  abilityText: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
    lineHeight: 1.35,
  },
  costRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    color: 'var(--text-muted)',
  },
  costValue: {
    fontWeight: 700,
    color: 'var(--accent-gold)',
    fontSize: '13px',
  },
  slotsSection: {
    marginTop: 'auto',
    padding: '6px 10px 10px',
  },
  slotsLabel: {
    fontSize: '9px',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: '4px',
  },
};

export default function Card({ card, filledSlots = [], wide = false, onClick, selected = false, highlighted = false, onCubeDrop, onSlotClick }) {
  const borderColor = TYPE_COLORS[card.type] ?? 'var(--border-card)';

  const totalSlots =
    card.tableauSlots ?? card.slots ?? 0;

  // Affinities (champion) or single affinity (hero)
  const affinities = card.affinities ?? (card.affinity ? [card.affinity] : []);

  const interactive = !!onClick;
  const droppable = !!onCubeDrop;

  const handleDragOver = (e) => {
    if (!droppable) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e) => {
    if (!droppable) return;
    e.preventDefault();
    const cubeIndex = parseInt(e.dataTransfer.getData('cube-index'), 10);
    if (!isNaN(cubeIndex)) {
      onCubeDrop(card.id, cubeIndex);
    }
  };

  return (
    <div
      onClick={onClick}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{
        ...styles.card,
        width: wide ? 'calc(var(--card-width) * 2 + 12px)' : 'var(--card-width)',
        border: selected
          ? '2px solid #fff'
          : `2px solid ${borderColor}`,
        boxShadow: selected
          ? '0 0 16px rgba(255,255,255,0.25), 0 2px 12px rgba(0,0,0,0.4)'
          : highlighted
            ? `0 0 12px ${borderColor}40, 0 2px 12px rgba(0,0,0,0.4)`
            : '0 2px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
        cursor: interactive ? 'pointer' : 'default',
        transition: 'border-color 0.15s, box-shadow 0.15s, transform 0.15s',
        transform: selected ? 'translateY(-4px)' : 'none',
      }}
    >
      {/* Header */}
      <div style={styles.header}>
        <span
          style={{
            ...styles.typeBadge,
            background: borderColor,
          }}
        >
          {card.type}
        </span>
        <span style={styles.name}>{card.name}</span>
      </div>

      {/* Body */}
      <div style={styles.body}>
        {/* Affinities */}
        {affinities.length > 0 && (
          <div style={styles.affinities}>
            {affinities.map((a) => (
              <CubeChip key={a} cubeType={a} />
            ))}
          </div>
        )}

        {/* Cost (hero only) */}
        {card.cost != null && (
          <>
            <div style={styles.costRow}>
              Cost: <span style={styles.costValue}>{card.cost}</span> food
            </div>
            <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              Excess power removes inexperience
            </div>
          </>
        )}

        {/* Ability / Action text */}
        {(card.abilityText || card.actionText) && (
          <p style={styles.abilityText}>
            {card.abilityText ?? card.actionText}
          </p>
        )}
      </div>

      {/* Cube slots */}
      {totalSlots > 0 && (
        <div style={styles.slotsSection}>
          <div style={styles.slotsLabel}>
            Slots ({filledSlots.length}/{totalSlots})
          </div>
          <CubeSlots total={totalSlots} filled={filledSlots} onSlotClick={onSlotClick} />
        </div>
      )}
    </div>
  );
}
