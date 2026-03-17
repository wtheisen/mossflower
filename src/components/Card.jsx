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

/* Decorative art-box motifs per card type — rendered as layered CSS gradients/shapes */
const ART_SCENES = {
  champion: {
    bg: 'linear-gradient(175deg, #e8d5a0 0%, #c4a55a 40%, #8b6914 100%)',
    overlay: 'radial-gradient(ellipse at 50% 70%, rgba(255,220,120,0.4) 0%, transparent 60%)',
    icon: '⚔',
  },
  hero: {
    bg: 'linear-gradient(175deg, #b8cfe0 0%, #7a9db8 40%, #4a6e8a 100%)',
    overlay: 'radial-gradient(ellipse at 50% 60%, rgba(180,220,255,0.35) 0%, transparent 55%)',
    icon: '🛡',
  },
  location: {
    bg: 'linear-gradient(175deg, #c5ddb8 0%, #7aaa68 40%, #4a7a3a 100%)',
    overlay: 'radial-gradient(ellipse at 40% 65%, rgba(180,230,160,0.3) 0%, transparent 55%)',
    icon: '🏰',
  },
  quest: {
    bg: 'linear-gradient(175deg, #d4c0e8 0%, #9a7aba 40%, #6a4a8a 100%)',
    overlay: 'radial-gradient(ellipse at 50% 55%, rgba(200,180,240,0.35) 0%, transparent 55%)',
    icon: '📜',
  },
  fortress: {
    bg: 'linear-gradient(175deg, #d4c0a0 0%, #9a7a50 40%, #5a4020 100%)',
    overlay: 'radial-gradient(ellipse at 50% 60%, rgba(210,180,140,0.35) 0%, transparent 55%)',
    icon: '🏯',
  },
  villain: {
    bg: 'linear-gradient(175deg, #dab0a0 0%, #a05040 40%, #602020 100%)',
    overlay: 'radial-gradient(ellipse at 50% 55%, rgba(240,160,140,0.3) 0%, transparent 55%)',
    icon: '💀',
  },
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
  /* ── Title bar ── */
  titleBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '6px 8px 5px',
    gap: '4px',
    minHeight: '28px',
  },
  name: {
    fontSize: '11.5px',
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    color: '#fff',
    lineHeight: 1.2,
    flex: 1,
    textShadow: '0 1px 3px rgba(0,0,0,0.4)',
  },
  costBadge: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    background: 'rgba(0,0,0,0.2)',
    border: '1.5px solid rgba(255,255,255,0.35)',
    fontSize: '12px',
    fontWeight: 800,
    fontFamily: 'var(--font-display)',
    color: '#fff',
    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
    flexShrink: 0,
  },
  /* ── Art box ── */
  artBox: {
    margin: '0 5px',
    height: '80px',
    borderRadius: '4px',
    border: '1.5px solid rgba(0,0,0,0.15)',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  artIcon: {
    fontSize: '32px',
    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
    position: 'relative',
    zIndex: 1,
    opacity: 0.7,
  },
  /* ── Type line ── */
  typeLine: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '4px 8px',
    margin: '4px 5px 0',
    borderRadius: '3px',
    background: 'var(--bg-elevated)',
    borderTop: '1px solid var(--border-subtle)',
    borderBottom: '1px solid var(--border-subtle)',
  },
  typeLabel: {
    fontSize: '9px',
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: 'var(--text-secondary)',
    flex: 1,
  },
  /* ── Text box ── */
  textBox: {
    padding: '5px 8px',
    margin: '3px 5px 0',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    background: 'rgba(250, 246, 236, 0.5)',
    borderRadius: '3px',
    border: '1px solid var(--border-subtle)',
    minHeight: '40px',
  },
  abilityText: {
    fontSize: '10.5px',
    color: 'var(--text-secondary)',
    lineHeight: 1.35,
    fontFamily: 'var(--font-body)',
  },
  flavorDivider: {
    width: '30%',
    height: '1px',
    background: 'var(--border-subtle)',
    margin: '2px auto',
  },
  flavorText: {
    fontSize: '9.5px',
    color: 'var(--text-muted)',
    fontStyle: 'italic',
    lineHeight: 1.3,
  },
  /* ── Slots footer ── */
  slotsFooter: {
    padding: '4px 8px 6px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  slotsLabel: {
    fontSize: '8px',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
};

export default function Card({ card, filledSlots = [], wide = false, onClick, selected = false, highlighted = false, onCubeDrop, onSlotClick }) {
  const borderColor = TYPE_COLORS[card.type] ?? 'var(--border-card)';
  const bgTint = TYPE_BG[card.type] ?? 'transparent';
  const scene = ART_SCENES[card.type] ?? ART_SCENES.hero;

  const totalSlots = card.tableauSlots ?? card.slots ?? 0;
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
          ? '2px solid var(--accent-gold)'
          : `2px solid ${borderColor}`,
        background: `linear-gradient(170deg, var(--bg-card) 0%, ${bgTint} 100%)`,
        boxShadow: selected
          ? '0 0 12px rgba(184, 134, 11, 0.3), 0 3px 12px rgba(100, 80, 50, 0.2)'
          : highlighted
            ? `0 0 8px ${borderColor}30, 0 2px 8px rgba(100, 80, 50, 0.15)`
            : '0 2px 8px rgba(100, 80, 50, 0.12), inset 0 1px 0 rgba(255,255,255,0.5)',
        cursor: interactive ? 'pointer' : 'default',
        transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s',
        transform: selected ? 'translateY(-4px)' : 'none',
      }}
    >
      {/* ── Title Bar ── */}
      <div
        style={{
          ...styles.titleBar,
          background: `linear-gradient(135deg, ${borderColor} 0%, ${borderColor}cc 100%)`,
          borderBottom: '1px solid rgba(0,0,0,0.2)',
        }}
      >
        <span style={styles.name}>{card.name}</span>
        {card.cost != null && (
          <span style={styles.costBadge}>{card.cost}</span>
        )}
        {affinities.length > 0 && (
          <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
            {affinities.map((a) => (
              <CubeChip key={a} cubeType={a} />
            ))}
          </div>
        )}
      </div>

      {/* ── Art Box ── */}
      <div
        style={{
          ...styles.artBox,
          background: scene.bg,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: scene.overlay,
            pointerEvents: 'none',
          }}
        />
        <span style={styles.artIcon}>{scene.icon}</span>
      </div>

      {/* ── Type Line ── */}
      <div style={styles.typeLine}>
        <span style={styles.typeLabel}>
          {card.type}
          {card.affinity ? ` — ${card.affinity}` : ''}
          {card.verminLimit != null ? ` · threat ${card.verminLimit}` : ''}
          {card.startingVermin != null ? ` · vermin ${card.startingVermin}` : ''}
        </span>
      </div>

      {/* ── Text Box ── */}
      <div style={styles.textBox}>
        {(card.abilityText || card.actionText) && (
          <p style={styles.abilityText}>
            {card.abilityText ?? card.actionText}
          </p>
        )}

        {card.cost != null && (
          <>
            <div style={styles.flavorDivider} />
            <p style={styles.flavorText}>
              Excess power removes inexperience
            </p>
          </>
        )}
      </div>

      {/* ── Slots Footer ── */}
      {totalSlots > 0 && (
        <div style={styles.slotsFooter}>
          <span style={styles.slotsLabel}>
            {filledSlots.length}/{totalSlots}
          </span>
          <CubeSlots total={totalSlots} filled={filledSlots} onSlotClick={onSlotClick} />
        </div>
      )}
    </div>
  );
}
