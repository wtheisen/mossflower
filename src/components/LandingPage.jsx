import { useEffect, useState } from 'react';

const styles = {
  wrapper: {
    position: 'fixed',
    inset: 0,
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: `
      radial-gradient(ellipse at 50% 40%, rgba(255, 220, 150, 0.25) 0%, transparent 60%),
      radial-gradient(ellipse at 30% 70%, rgba(180, 134, 11, 0.1) 0%, transparent 50%),
      radial-gradient(ellipse at 70% 30%, rgba(160, 82, 45, 0.08) 0%, transparent 50%),
      linear-gradient(175deg, #f7f1e1 0%, #e8dcc4 40%, #ddd0b4 70%, #d4c4a0 100%)
    `,
    fontFamily: 'var(--font-display)',
    overflow: 'hidden',
  },

  /* Floating leaf particles */
  particles: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    overflow: 'hidden',
  },

  /* Decorative border frame */
  borderFrame: {
    position: 'absolute',
    inset: '24px',
    border: '2px solid var(--border-card)',
    borderRadius: '20px',
    pointerEvents: 'none',
  },
  borderFrameInner: {
    position: 'absolute',
    inset: '6px',
    border: '1px solid var(--border-subtle)',
    borderRadius: '16px',
  },

  /* Corner flourishes */
  corner: {
    position: 'absolute',
    width: '60px',
    height: '60px',
    pointerEvents: 'none',
    opacity: 0.5,
  },

  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    zIndex: 2,
    padding: '0 32px',
  },

  title: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(4rem, 10vw, 8rem)',
    fontWeight: 700,
    color: 'var(--text-primary)',
    lineHeight: 1,
    letterSpacing: '-0.02em',
    textShadow: '0 2px 12px rgba(184, 134, 11, 0.2)',
    animation: 'fadeInUp 1.2s ease-out both',
    marginBottom: '8px',
  },

  subtitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(1.1rem, 2.5vw, 1.6rem)',
    fontWeight: 400,
    fontStyle: 'italic',
    color: 'var(--text-secondary)',
    letterSpacing: '0.15em',
    animation: 'fadeInUp 1.2s ease-out 0.4s both',
    marginBottom: '48px',
  },

  divider: {
    width: '120px',
    height: '2px',
    background: 'linear-gradient(90deg, transparent, var(--accent-gold), transparent)',
    marginBottom: '48px',
    animation: 'fadeInUp 1.2s ease-out 0.6s both',
  },

  button: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(1rem, 2vw, 1.3rem)',
    fontWeight: 600,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: '#faf6ec',
    background: 'linear-gradient(135deg, #6b4226 0%, #8b5e3c 40%, #a0522d 100%)',
    border: '2px solid rgba(184, 134, 11, 0.4)',
    borderRadius: '50px',
    padding: '16px 48px',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    animation: 'fadeInUp 1s ease-out 0.9s both',
    transition: 'transform 0.2s ease, box-shadow 0.3s ease, border-color 0.3s ease',
    boxShadow: `
      0 4px 16px rgba(100, 60, 20, 0.3),
      0 0 0 0 rgba(184, 134, 11, 0)
    `,
  },

  buttonHover: {
    transform: 'translateY(-2px)',
    borderColor: 'rgba(184, 134, 11, 0.7)',
    boxShadow: `
      0 8px 32px rgba(100, 60, 20, 0.35),
      0 0 40px rgba(184, 134, 11, 0.15)
    `,
  },

  /* Wax seal decoration on button */
  seal: {
    display: 'inline-block',
    marginRight: '10px',
    fontSize: '1.2em',
    verticalAlign: 'middle',
    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))',
  },

  fadeOut: {
    animation: 'fadeOutPage 0.6s ease-in forwards',
  },
};

/* CSS for corner flourish SVG */
function CornerFlourish({ style }) {
  return (
    <svg style={{ ...styles.corner, ...style }} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M5 55 C5 30, 15 15, 55 5"
        stroke="var(--border-card)"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M10 55 C10 35, 20 20, 55 10"
        stroke="var(--border-subtle)"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="8" cy="52" r="2.5" fill="var(--accent-gold)" opacity="0.4" />
      <circle cx="52" cy="8" r="2" fill="var(--accent-gold)" opacity="0.3" />
    </svg>
  );
}

/* Floating leaf particle */
function Leaf({ delay, left, duration, size }) {
  const leafStyle = {
    position: 'absolute',
    top: '-20px',
    left: `${left}%`,
    width: `${size}px`,
    height: `${size}px`,
    opacity: 0,
    animation: `leafFall ${duration}s ease-in-out ${delay}s infinite`,
    color: 'var(--accent-gold)',
    fontSize: `${size}px`,
    lineHeight: 1,
    userSelect: 'none',
  };

  return <span style={leafStyle}>&#x1F343;</span>;
}

export default function LandingPage({ onPlay }) {
  const [hover, setHover] = useState(false);
  const [exiting, setExiting] = useState(false);

  const handlePlay = () => {
    setExiting(true);
    setTimeout(onPlay, 550);
  };

  // Leaf particles config
  const leaves = [
    { delay: 0, left: 15, duration: 12, size: 16 },
    { delay: 3, left: 45, duration: 15, size: 12 },
    { delay: 7, left: 75, duration: 11, size: 14 },
    { delay: 5, left: 30, duration: 14, size: 10 },
    { delay: 10, left: 85, duration: 13, size: 13 },
    { delay: 2, left: 60, duration: 16, size: 11 },
  ];

  return (
    <div style={{ ...styles.wrapper, ...(exiting ? styles.fadeOut : {}) }}>
      {/* Floating leaves */}
      <div style={styles.particles}>
        {leaves.map((l, i) => (
          <Leaf key={i} {...l} />
        ))}
      </div>

      {/* Ornate border frame */}
      <div style={styles.borderFrame}>
        <div style={styles.borderFrameInner} />
      </div>

      {/* Corner flourishes */}
      <CornerFlourish style={{ top: '30px', left: '30px' }} />
      <CornerFlourish style={{ top: '30px', right: '30px', transform: 'scaleX(-1)' }} />
      <CornerFlourish style={{ bottom: '30px', left: '30px', transform: 'scaleY(-1)' }} />
      <CornerFlourish style={{ bottom: '30px', right: '30px', transform: 'scale(-1)' }} />

      {/* Central content */}
      <div style={styles.content}>
        <h1 style={styles.title}>Mossflower</h1>
        <p style={styles.subtitle}>A Redwall Adventure</p>
        <div style={styles.divider} />
        <button
          style={{ ...styles.button, ...(hover ? styles.buttonHover : {}) }}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          onClick={handlePlay}
        >
          <span style={styles.seal}>&#x1F56F;&#xFE0F;</span>
          Begin Your Adventure
        </button>
        <a
          href="https://docs.google.com/document/d/1LyNBD0d2oJCOFfGvD4e4zsY1cKv23_CxsA7pQhQN8ME/edit?usp=sharing"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(0.85rem, 1.5vw, 1rem)',
            fontStyle: 'italic',
            color: 'var(--text-muted)',
            marginTop: '24px',
            textDecoration: 'none',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '2px',
            animation: 'fadeInUp 1s ease-out 1.1s both',
            transition: 'color 0.2s ease, border-color 0.2s ease',
          }}
          onMouseEnter={e => { e.target.style.color = 'var(--accent-gold)'; e.target.style.borderColor = 'var(--accent-gold)'; }}
          onMouseLeave={e => { e.target.style.color = 'var(--text-muted)'; e.target.style.borderColor = 'var(--border-subtle)'; }}
        >
          Read the Rulebook
        </a>
      </div>

      {/* Candlelight glow behind title */}
      <div style={{
        position: 'absolute',
        top: '30%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255, 200, 100, 0.12) 0%, transparent 70%)',
        animation: 'glowPulse 4s ease-in-out infinite',
        pointerEvents: 'none',
        zIndex: 1,
      }} />
    </div>
  );
}
