import Card from './Card';
import CubeChip from './CubeChip';

const styles = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(60, 45, 30, 0.5)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  panel: {
    background: 'linear-gradient(170deg, var(--bg-surface) 0%, var(--bg-elevated) 100%)',
    border: '2px solid var(--border-card)',
    borderRadius: '14px',
    padding: '28px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    maxWidth: '90vw',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 8px 32px rgba(80, 60, 30, 0.25), 0 0 0 1px var(--border-subtle)',
  },
  title: {
    fontSize: '20px',
    fontWeight: 700,
    fontFamily: 'var(--font-display)',
    fontStyle: 'italic',
    color: 'var(--accent-gold)',
  },
  sectionLabel: {
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    color: 'var(--text-muted)',
    fontWeight: 600,
    fontFamily: 'var(--font-display)',
    marginBottom: '8px',
  },
  bandRow: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
  },
  cubeBtn: {
    cursor: 'pointer',
    padding: '3px',
    borderRadius: '6px',
    border: '2px solid transparent',
    background: 'none',
    transition: 'border-color 0.2s, transform 0.2s',
  },
  cubeBtnSelected: {
    borderColor: 'var(--accent-gold)',
    transform: 'translateY(-3px)',
    boxShadow: '0 3px 8px rgba(184, 134, 11, 0.25)',
  },
  cardRow: {
    display: 'flex',
    gap: '12px',
    overflowX: 'auto',
    paddingBottom: '4px',
    alignItems: 'flex-start',
  },
  message: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    lineHeight: 1.4,
    fontStyle: 'italic',
  },
  empty: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    fontStyle: 'italic',
  },
};

export default function DuskOverlay({
  band, selectedCubeIndex, champion, tableau, placements,
  discoveredLocations, workers, message,
  onSelectCube, onPlaceOnCard, onPlaceOnLocation,
}) {
  const hasSelection = selectedCubeIndex !== null;

  return (
    <div style={styles.backdrop}>
      <div style={styles.panel}>
        <div style={styles.title}>Dusk — Place Your Cubes</div>

        {message && <div style={styles.message}>{message}</div>}

        {/* Band — clickable cubes */}
        <div>
          <div style={styles.sectionLabel}>
            Band ({band.length} remaining)
          </div>
          <div style={styles.bandRow}>
            {band.length === 0 ? (
              <span style={styles.empty}>All cubes placed!</span>
            ) : (
              band.map((type, i) => (
                <button
                  key={i}
                  style={{
                    ...styles.cubeBtn,
                    ...(i === selectedCubeIndex ? styles.cubeBtnSelected : {}),
                  }}
                  onClick={() => onSelectCube(i)}
                >
                  <CubeChip cubeType={type} />
                </button>
              ))
            )}
          </div>
        </div>

        {/* Tableau — place on champion or heroes */}
        <div>
          <div style={styles.sectionLabel}>Tableau</div>
          <div style={styles.cardRow}>
            <Card
              card={champion}
              filledSlots={placements[champion.id] ?? []}
              wide
              onClick={hasSelection ? () => onPlaceOnCard(champion.id) : undefined}
              highlighted={hasSelection}
            />
            {tableau.map((hero) => (
              <Card
                key={hero.id}
                card={hero}
                filledSlots={placements[hero.id] ?? []}
                onClick={hasSelection ? () => onPlaceOnCard(hero.id) : undefined}
                highlighted={hasSelection}
              />
            ))}
          </div>
        </div>

        {/* Locations — place as workers */}
        <div>
          <div style={styles.sectionLabel}>Locations (as workers)</div>
          <div style={styles.cardRow}>
            {discoveredLocations.map((loc) => (
              <Card
                key={loc.id}
                card={loc}
                filledSlots={workers[loc.id] ?? []}
                onClick={hasSelection ? () => onPlaceOnLocation(loc.id) : undefined}
                highlighted={hasSelection}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
