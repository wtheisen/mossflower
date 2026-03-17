const styles = {
  bar: {
    background: 'linear-gradient(180deg, var(--bg-surface) 0%, var(--bg-elevated) 100%)',
    borderBottom: '2px solid var(--border-card)',
    padding: '12px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '28px',
    fontSize: '14px',
    position: 'relative',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: '22px',
    color: 'var(--accent-gold)',
    letterSpacing: '0.06em',
    fontStyle: 'italic',
  },
  divider: {
    width: '1px',
    height: '24px',
    background: 'var(--border-card)',
  },
  stat: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '6px',
    color: 'var(--text-secondary)',
  },
  label: {
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
  },
  value: {
    fontWeight: 700,
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-display)',
    fontSize: '15px',
  },
  ornament: {
    position: 'absolute',
    bottom: '-1px',
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: '10px',
    color: 'var(--border-card)',
    letterSpacing: '4px',
    lineHeight: 1,
  },
};

export default function StatusBar({ day = 1, phase = 'Day', conquest = 0, activePlayerIndex = 0, playerCount = 1, championName }) {
  return (
    <div style={styles.bar}>
      <span style={styles.title}>Mossflower</span>
      <span style={styles.divider} />
      {playerCount > 1 && (
        <>
          <div style={styles.stat}>
            <span style={styles.label}>Player</span>
            <span style={styles.value}>{activePlayerIndex + 1}{championName ? ` — ${championName}` : ''}</span>
          </div>
          <span style={styles.divider} />
        </>
      )}
      <div style={styles.stat}>
        <span style={styles.label}>Day</span>
        <span style={styles.value}>{day}</span>
      </div>
      <span style={styles.divider} />
      <div style={styles.stat}>
        <span style={styles.label}>Phase</span>
        <span style={styles.value}>{phase}</span>
      </div>
      <span style={styles.divider} />
      <div style={styles.stat}>
        <span style={styles.label}>Conquest</span>
        <span style={{ ...styles.value, color: conquest >= 7 ? 'var(--accent-red)' : undefined }}>
          {conquest} / 10
        </span>
      </div>
      <span style={styles.ornament}>~ ~ ~</span>
    </div>
  );
}
