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

const TYPE_BG = {
  champion: 'rgba(184, 134, 11, 0.08)',
  hero: 'rgba(91, 130, 166, 0.08)',
  location: 'rgba(106, 154, 90, 0.08)',
  quest: 'rgba(138, 106, 170, 0.08)',
  fortress: 'rgba(139, 104, 66, 0.08)',
  villain: 'rgba(160, 80, 64, 0.08)',
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
    animation: 'fadeInPage 0.4s ease-out both',
  },
  header: {
    padding: '10px 12px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  typeBadge: {
    fontSize: '9px',
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    padding: '2px 8px',
    borderRadius: '10px',
    alignSelf: 'flex-start',
    color: '#fff',
  },
  name: {
    fontSize: '14px',
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
    color: 'var(--text-primary)',
    lineHeight: 1.25,
    fontStyle: 'italic',
  },
  body: {
    padding: '0 12px 10px',
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
    fontSize: '12px',
    color: 'var(--text-secondary)',
    lineHeight: 1.4,
    fontStyle: 'italic',
  },
  costRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    color: 'var(--text-muted)',
  },
  costValue: {
    fontWeight: 700,
    color: 'var(--accent-gold)',
    fontSize: '14px',
    fontFamily: 'var(--font-display)',
  },
  slotsSection: {
    marginTop: 'auto',
    padding: '6px 12px 12px',
    borderTop: '1px dashed var(--border-subtle)',
  },
  slotsLabel: {
    fontSize: '9px',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '5px',
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
  },
};

export default function Card({ card, filledSlots = [], wide = false, onClick, selected = false, highlighted = false, onCubeDrop, onSlotClick }) {
  const borderColor = TYPE_COLORS[card.type] ?? 'var(--border-card)';
  const bgTint = TYPE_BG[card.type] ?? 'transparent';

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
          ? `2px solid var(--accent-gold)`
          : `2px solid ${borderColor}`,
        background: `linear-gradient(170deg, var(--bg-card) 0%, ${bgTint} 100%)`,
        boxShadow: selected
          ? `0 0 12px rgba(184, 134, 11, 0.3), 0 3px 12px rgba(100, 80, 50, 0.2)`
          : highlighted
            ? `0 0 8px ${borderColor}30, 0 2px 8px rgba(100, 80, 50, 0.15)`
            : '0 2px 8px rgba(100, 80, 50, 0.12), inset 0 1px 0 rgba(255,255,255,0.5)',
        cursor: interactive ? 'pointer' : 'default',
        transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s',
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
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
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
