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
  spacer: {
    flex: 1,
  },
  conquestArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0,
  },
  conquestTrack: {
    display: 'flex',
    gap: '3px',
    alignItems: 'center',
  },
  conquestSquare: {
    width: '14px',
    height: '14px',
    borderRadius: '2px',
    border: '1.5px solid var(--border-card)',
    transition: 'background 0.2s, border-color 0.2s',
  },
};

export default function StatusBar({ day = 1, phase = 'Day', conquest = 0, activePlayerIndex = 0, playerCount = 1, championName, compact = false }) {
  const sq = compact ? 10 : 14;

  if (compact) {
    return (
      <div className="status-bar status-bar--compact" style={{
        ...styles.bar,
        padding: '2px 8px',
        gap: '8px',
        fontSize: '10px',
        borderBottomWidth: '1px',
      }}>
        {playerCount > 1 && (
          <span style={{ ...styles.value, fontSize: '10px' }}>P{activePlayerIndex + 1}</span>
        )}
        <span style={{ ...styles.value, fontSize: '10px' }}>Day {day}</span>
        <span style={{ ...styles.value, fontSize: '10px', textTransform: 'capitalize' }}>{phase}</span>
        <div style={styles.spacer} />
        <div className="status-bar__conquest" style={{ ...styles.conquestArea, gap: '4px' }}>
          <div style={{ ...styles.conquestTrack, gap: '2px' }}>
            {Array.from({ length: 10 }, (_, i) => {
              const filled = i < conquest;
              const danger = conquest >= 7;
              return (
                <div
                  key={i}
                  style={{
                    width: sq, height: sq, borderRadius: '2px',
                    border: '1px solid',
                    background: filled ? (danger ? 'var(--accent-red)' : 'var(--type-fortress)') : 'transparent',
                    borderColor: filled ? (danger ? 'var(--accent-red)' : 'var(--type-fortress)') : 'var(--border-card)',
                  }}
                />
              );
            })}
          </div>
          <span style={{ ...styles.value, fontSize: '10px', color: conquest >= 7 ? 'var(--accent-red)' : undefined }}>
            {conquest}/10
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="status-bar" style={styles.bar}>
      <span className="status-bar__title" style={styles.title}>Mossflower</span>
      <span className="status-bar__divider" style={styles.divider} />
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
      <div style={styles.spacer} />
      <div className="status-bar__conquest" style={styles.conquestArea}>
        <span style={styles.label}>Conquest</span>
        <div style={styles.conquestTrack}>
          {Array.from({ length: 10 }, (_, i) => {
            const filled = i < conquest;
            const danger = conquest >= 7;
            return (
              <div
                key={i}
                style={{
                  ...styles.conquestSquare,
                  background: filled
                    ? (danger ? 'var(--accent-red)' : 'var(--type-fortress)')
                    : 'transparent',
                  borderColor: filled
                    ? (danger ? 'var(--accent-red)' : 'var(--type-fortress)')
                    : 'var(--border-card)',
                }}
              />
            );
          })}
        </div>
        <span style={{ ...styles.value, color: conquest >= 7 ? 'var(--accent-red)' : undefined, fontSize: '12px' }}>
          {conquest}/10
        </span>
      </div>
      <span className="status-bar__ornament" style={styles.ornament}>~ ~ ~</span>
    </div>
  );
}
