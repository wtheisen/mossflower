import Card from './Card';
import CubeChip from './CubeChip';
import CubeSlots from './CubeSlots';

const styles = {
  section: {
    padding: 0,
  },
  label: {
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    color: 'var(--accent-gold)',
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
  },
  heroGroup: {
    display: 'flex',
    gap: '12px',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  rightGroup: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
    flexShrink: 0,
    marginLeft: 'auto',
  },
  championArea: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flexShrink: 0,
  },
  /* ── Champion card wrapper — horizontal layout ── */
  championCard: {
    background: 'linear-gradient(170deg, var(--bg-card) 0%, rgba(184, 134, 11, 0.08) 100%)',
    border: '2px solid var(--type-champion)',
    borderRadius: 'var(--radius)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    flexShrink: 0,
    boxShadow: '0 2px 8px rgba(100, 80, 50, 0.12), inset 0 1px 0 rgba(255,255,255,0.5)',
    animation: 'fadeInPage 0.4s ease-out both',
  },
  championTitleBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '6px 8px 5px',
    gap: '4px',
    minHeight: '28px',
    background: 'linear-gradient(135deg, var(--type-champion) 0%, var(--type-champion)cc 100%)',
    borderBottom: '1px solid rgba(0,0,0,0.2)',
  },
  championName: {
    fontSize: '11.5px',
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    color: '#fff',
    lineHeight: 1.2,
    flex: 1,
    textShadow: '0 1px 3px rgba(0,0,0,0.4)',
  },
  championBody: {
    display: 'flex',
    flexDirection: 'row',
    flex: 1,
  },
  championLeft: {
    display: 'flex',
    flexDirection: 'column',
    width: 'var(--card-width)',
    flexShrink: 0,
    borderRight: '1px solid var(--border-subtle)',
  },
  championArtBox: {
    margin: '5px',
    flex: 1,
    borderRadius: '4px',
    border: '1.5px solid rgba(0,0,0,0.15)',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(175deg, #e8d5a0 0%, #c4a55a 40%, #8b6914 100%)',
  },
  championArtOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(ellipse at 50% 70%, rgba(255,220,120,0.4) 0%, transparent 60%)',
    pointerEvents: 'none',
  },
  championArtIcon: {
    fontSize: '36px',
    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
    position: 'relative',
    zIndex: 1,
    opacity: 0.7,
  },
  championTypeLine: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '4px 8px',
    margin: '0 5px 5px',
    borderRadius: '3px',
    background: 'var(--bg-elevated)',
    borderTop: '1px solid var(--border-subtle)',
    borderBottom: '1px solid var(--border-subtle)',
    fontSize: '9px',
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: 'var(--text-secondary)',
  },
  abilitiesGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '6px',
    padding: '6px',
    flex: 1,
    alignContent: 'start',
  },
  abilityZone: {
    background: 'linear-gradient(170deg, var(--bg-card) 0%, rgba(184, 134, 11, 0.04) 100%)',
    border: '2px solid var(--border-card)',
    borderRadius: 'var(--radius-sm)',
    padding: '8px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxShadow: '0 1px 4px rgba(100, 80, 50, 0.08)',
  },
  abilityZoneActive: {
    borderColor: 'var(--accent-gold)',
    boxShadow: '0 0 8px rgba(184, 134, 11, 0.2)',
  },
  abilityName: {
    fontSize: '11px',
    fontWeight: 700,
    fontFamily: 'var(--font-display)',
    color: 'var(--text-primary)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  abilityDesc: {
    fontSize: '10px',
    color: 'var(--text-secondary)',
    lineHeight: 1.35,
    fontStyle: 'italic',
  },
  abilityFilter: {
    fontSize: '9px',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontFamily: 'var(--font-display)',
  },
};

function filterLabel(slotFilter) {
  switch (slotFilter) {
    case 'mouse': return 'mouse only';
    case 'food': return 'food only';
    case 'non-mouse-critter': return 'non-mouse critter';
    case 'critter': return 'critter only';
    case 'any': return 'any cube';
    default: return slotFilter;
  }
}

/**
 * Renders the current player's champion + recruited hero cards.
 * Champions with abilities show ability zones as drop targets.
 */
export default function PlayerTableau({ champion, tableau, placements = {}, abilityPlacements = {}, onCubeDrop, onReturnCube, bandSlot, bagSlot }) {
  const hasAbilities = champion.abilities && champion.abilities.length > 0;

  const handleAbilityDragOver = (e) => {
    if (!onCubeDrop) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleAbilityDrop = (abilityId, e) => {
    if (!onCubeDrop) return;
    e.preventDefault();
    const cubeIndex = parseInt(e.dataTransfer.getData('cube-index'), 10);
    if (!isNaN(cubeIndex)) {
      onCubeDrop(abilityId, cubeIndex);
    }
  };

  return (
    <div style={styles.section}>
      <div style={styles.label}>
        {champion.name} — Tableau
      </div>
      <div style={styles.row}>
        {/* Champion card area */}
        <div style={styles.championArea}>
          {hasAbilities ? (
            /* Champion with abilities: render as a large card with embedded ability zones */
            <div style={styles.championCard}>
              {/* Title Bar — spans full width */}
              <div style={styles.championTitleBar}>
                <span style={styles.championName}>{champion.name}</span>
                {(champion.affinities ?? (champion.affinity ? [champion.affinity] : [])).length > 0 && (
                  <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                    {(champion.affinities ?? (champion.affinity ? [champion.affinity] : [])).map((a) => (
                      <CubeChip key={a} cubeType={a} />
                    ))}
                  </div>
                )}
              </div>
              {/* Body — art left, abilities right */}
              <div style={styles.championBody}>
                <div style={styles.championLeft}>
                  <div style={styles.championArtBox}>
                    <div style={styles.championArtOverlay} />
                    <span style={styles.championArtIcon}>⚔</span>
                  </div>
                  <div style={styles.championTypeLine}>
                    <span>champion</span>
                  </div>
                </div>
                <div style={styles.abilitiesGrid}>
                  {champion.abilities.map((ability) => {
                    const placed = abilityPlacements[ability.id] ?? [];
                    const hasPlaced = placed.length > 0;
                    return (
                      <div
                        key={ability.id}
                        style={{
                          ...styles.abilityZone,
                          ...(hasPlaced ? styles.abilityZoneActive : {}),
                        }}
                        onDragOver={handleAbilityDragOver}
                        onDrop={(e) => handleAbilityDrop(ability.id, e)}
                      >
                        <div style={styles.abilityName}>{ability.name}</div>
                        <div style={styles.abilityDesc}>{ability.description}</div>
                        <div style={styles.abilityFilter}>{filterLabel(ability.slotFilter)}</div>
                        <CubeSlots
                          total={ability.slots}
                          filled={placed}
                          onSlotClick={onReturnCube ? (slotIdx) => onReturnCube(ability.id, slotIdx) : undefined}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* Champion without abilities: render as a normal card */
            <Card
              card={champion}
              filledSlots={placements[champion.id] ?? []}
              wide
              onCubeDrop={onCubeDrop}
              onSlotClick={onReturnCube ? (slotIdx) => onReturnCube(champion.id, slotIdx) : undefined}
            />
          )}
        </div>

        {/* Hero cards — centered */}
        <div style={styles.heroGroup}>
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

        {/* Band + Bag — right-aligned */}
        <div style={styles.rightGroup}>
          {bandSlot}
          {bagSlot}
        </div>
      </div>
    </div>
  );
}
