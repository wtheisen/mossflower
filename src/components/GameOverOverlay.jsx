const styles = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(60, 45, 30, 0.7)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
  },
  panel: {
    background: 'linear-gradient(170deg, var(--bg-surface) 0%, var(--bg-elevated) 100%)',
    border: '2px solid var(--border-card)',
    borderRadius: '14px',
    padding: '40px 48px',
    textAlign: 'center',
    maxWidth: '420px',
    boxShadow: '0 8px 32px rgba(80, 60, 30, 0.35), 0 0 0 1px var(--border-subtle)',
  },
  title: {
    fontSize: '28px',
    fontWeight: 700,
    fontFamily: 'var(--font-display)',
    fontStyle: 'italic',
    marginBottom: '12px',
    lineHeight: 1.2,
  },
  subtitle: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    marginBottom: '24px',
    fontStyle: 'italic',
  },
  button: {
    padding: '10px 28px',
    fontSize: '14px',
    fontWeight: 600,
    fontFamily: 'var(--font-display)',
    border: '2px solid var(--border-card)',
    borderRadius: '8px',
    background: 'var(--bg-card)',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
};

export default function GameOverOverlay({ gameResult, day, conquest, onRestart }) {
  if (!gameResult) return null;

  const isWin = gameResult === 'win';
  const titleColor = isWin ? 'var(--type-hero)' : 'var(--accent-red)';
  const title = isWin ? 'Mossflower is saved!' : 'Mossflower has fallen.';
  const subtitle = isWin
    ? `The villain was defeated on day ${day} with conquest at ${conquest}/10.`
    : `Conquest reached ${conquest} on day ${day}.`;

  return (
    <div style={styles.backdrop}>
      <div style={styles.panel}>
        <div style={{ ...styles.title, color: titleColor }}>{title}</div>
        <div style={styles.subtitle}>{subtitle}</div>
        <button style={styles.button} onClick={onRestart}>
          Play Again
        </button>
      </div>
    </div>
  );
}
