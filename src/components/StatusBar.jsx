const styles = {
  bar: {
    background: 'var(--bg-surface)',
    borderBottom: '1px solid var(--border-subtle)',
    padding: '10px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    fontSize: '13px',
  },
  title: {
    fontWeight: 700,
    fontSize: '16px',
    color: 'var(--accent-gold)',
    letterSpacing: '0.04em',
  },
  stat: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: 'var(--text-secondary)',
  },
  label: {
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: 'var(--text-muted)',
  },
  value: {
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
};

export default function StatusBar({ day = 1, phase = 'Day', conquest = 0, activePlayerIndex = 0, playerCount = 1, championName }) {
  return (
    <div style={styles.bar}>
      <span style={styles.title}>Mossflower</span>
      {playerCount > 1 && (
        <div style={styles.stat}>
          <span style={styles.label}>Player</span>
          <span style={styles.value}>{activePlayerIndex + 1}{championName ? ` — ${championName}` : ''}</span>
        </div>
      )}
      <div style={styles.stat}>
        <span style={styles.label}>Day</span>
        <span style={styles.value}>{day}</span>
      </div>
      <div style={styles.stat}>
        <span style={styles.label}>Phase</span>
        <span style={styles.value}>{phase}</span>
      </div>
      <div style={styles.stat}>
        <span style={styles.label}>Conquest</span>
        <span style={{ ...styles.value, color: conquest >= 7 ? 'var(--accent-red)' : undefined }}>
          {conquest} / 10
        </span>
      </div>
    </div>
  );
}
