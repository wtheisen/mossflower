import { CUBE_TYPES } from '../data/cards';

const styles = {
  container: {
    background: 'var(--bg-card)',
    border: '2px solid var(--border-card)',
    borderRadius: 'var(--radius)',
    padding: '10px 12px',
    minWidth: '140px',
  },
  label: {
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--text-muted)',
    fontWeight: 600,
    marginBottom: '8px',
  },
  count: {
    fontSize: '20px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: '8px',
  },
  rows: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
  },
  dot: {
    width: '12px',
    height: '12px',
    borderRadius: '2px',
    flexShrink: 0,
    border: '1px solid rgba(255,255,255,0.15)',
  },
  typeName: {
    color: 'var(--text-secondary)',
    flex: 1,
  },
  typeCount: {
    fontWeight: 600,
    color: 'var(--text-primary)',
    minWidth: '14px',
    textAlign: 'right',
  },
};

/**
 * Shows the contents of the player's bag as a grouped summary.
 * @param {string[]} cubes — array of cube type strings still in the bag
 */
export default function Bag({ cubes }) {
  // Group by type and count
  const counts = {};
  for (const c of cubes) {
    counts[c] = (counts[c] || 0) + 1;
  }

  // Sort: critters first, then special types
  const order = ['mouse', 'squirrel', 'hare', 'otter', 'mole', 'badger', 'food', 'inexperience', 'mastery', 'vermin', 'wound'];
  const sorted = Object.entries(counts).sort(
    (a, b) => order.indexOf(a[0]) - order.indexOf(b[0]),
  );

  return (
    <div style={styles.container}>
      <div style={styles.label}>Bag</div>
      <div style={styles.count}>{cubes.length}</div>
      <div style={styles.rows}>
        {sorted.map(([type, count]) => {
          const info = CUBE_TYPES[type];
          return (
            <div key={type} style={styles.row}>
              <span style={{ ...styles.dot, background: info?.color ?? '#555' }} />
              <span style={styles.typeName}>{info?.label ?? type}</span>
              <span style={styles.typeCount}>{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
