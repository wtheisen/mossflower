import { CUBE_TYPES } from '../data/cards';

const styles = {
  container: {
    background: 'linear-gradient(170deg, var(--bg-card) 0%, var(--bg-elevated) 100%)',
    border: '2px solid var(--border-card)',
    borderRadius: 'var(--radius)',
    padding: '12px 14px',
    minWidth: '140px',
    boxShadow: '0 2px 6px rgba(100, 80, 50, 0.1), inset 0 1px 0 rgba(255,255,255,0.5)',
  },
  label: {
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: 'var(--text-muted)',
    fontWeight: 600,
    fontFamily: 'var(--font-display)',
    marginBottom: '6px',
  },
  count: {
    fontSize: '22px',
    fontWeight: 700,
    fontFamily: 'var(--font-display)',
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
    gap: '8px',
    fontSize: '13px',
  },
  dot: {
    width: '12px',
    height: '12px',
    borderRadius: '4px',
    flexShrink: 0,
    border: '1px solid rgba(100, 80, 50, 0.2)',
    boxShadow: '0 1px 2px rgba(100, 80, 50, 0.15)',
  },
  typeName: {
    color: 'var(--text-secondary)',
    flex: 1,
    fontStyle: 'italic',
  },
  typeCount: {
    fontWeight: 700,
    fontFamily: 'var(--font-display)',
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
