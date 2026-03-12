import Card from './Card';
import CubeChip from './CubeChip';

const styles = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  panel: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '12px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    maxWidth: '90vw',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
  },
  title: {
    fontSize: '16px',
    fontWeight: 700,
    color: 'var(--accent-gold)',
  },
  sectionLabel: {
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--text-muted)',
    fontWeight: 600,
    marginBottom: '8px',
  },
  bandRow: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
  },
  cubeBtn: {
    cursor: 'pointer',
    padding: '2px',
    borderRadius: '4px',
    border: '2px solid transparent',
    background: 'none',
    transition: 'border-color 0.15s, transform 0.15s',
  },
  cubeBtnSelected: {
    borderColor: '#fff',
    transform: 'translateY(-3px)',
  },
  cardRow: {
    display: 'flex',
    gap: '12px',
    overflowX: 'auto',
    paddingBottom: '4px',
    alignItems: 'flex-start',
  },
  message: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    lineHeight: 1.35,
  },
  empty: {
    fontSize: '12px',
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
