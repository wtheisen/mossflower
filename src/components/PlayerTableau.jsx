import Card from './Card';
import CubeSlots from './CubeSlots';

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
  championArea: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flexShrink: 0,
  },
  abilitiesGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '6px',
    maxWidth: 'calc(var(--card-width) * 2 + 24px)',
  },
  abilityZone: {
    background: 'var(--bg-card)',
    border: '2px solid var(--border-card)',
    borderRadius: 'var(--radius-sm)',
    padding: '6px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  },
  abilityZoneActive: {
    borderColor: 'var(--accent-gold)',
    boxShadow: '0 0 8px rgba(218,165,32,0.3)',
  },
  abilityName: {
    fontSize: '10px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  abilityDesc: {
    fontSize: '9px',
    color: 'var(--text-secondary)',
    lineHeight: 1.3,
  },
  abilityFilter: {
    fontSize: '8px',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
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
export default function PlayerTableau({ champion, tableau, placements = {}, abilityPlacements = {}, onCubeDrop, onReturnCube }) {
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
            /* Champion with abilities: show ability zones */
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

        {/* Hero cards */}
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
