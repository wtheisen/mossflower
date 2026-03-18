import { useState } from 'react';
import { CHAMPIONS, VILLAINS, CUBE_TYPES, expandStartingBag } from '../data/cards';

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

  particles: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    overflow: 'hidden',
  },

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
    maxHeight: '90vh',
    overflowY: 'auto',
  },

  title: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(3rem, 8vw, 5rem)',
    fontWeight: 700,
    color: 'var(--text-primary)',
    lineHeight: 1,
    letterSpacing: '-0.02em',
    textShadow: '0 2px 12px rgba(184, 134, 11, 0.2)',
    marginBottom: '4px',
  },

  subtitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(0.9rem, 2vw, 1.2rem)',
    fontWeight: 400,
    fontStyle: 'italic',
    color: 'var(--text-secondary)',
    letterSpacing: '0.15em',
    marginBottom: '24px',
  },

  divider: {
    width: '120px',
    height: '2px',
    background: 'linear-gradient(90deg, transparent, var(--accent-gold), transparent)',
    marginBottom: '24px',
  },

  sectionLabel: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(0.8rem, 1.5vw, 1rem)',
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--text-secondary)',
    marginBottom: '12px',
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
    padding: '14px 40px',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    transition: 'transform 0.2s ease, box-shadow 0.3s ease, border-color 0.3s ease',
    boxShadow: '0 4px 16px rgba(100, 60, 20, 0.3)',
  },

  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },

  fadeOut: {
    animation: 'fadeOutPage 0.6s ease-in forwards',
  },
};

function CornerFlourish({ style }) {
  return (
    <svg style={{ ...styles.corner, ...style }} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 55 C5 30, 15 15, 55 5" stroke="var(--border-card)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M10 55 C10 35, 20 20, 55 10" stroke="var(--border-subtle)" strokeWidth="1" fill="none" strokeLinecap="round" />
      <circle cx="8" cy="52" r="2.5" fill="var(--accent-gold)" opacity="0.4" />
      <circle cx="52" cy="8" r="2" fill="var(--accent-gold)" opacity="0.3" />
    </svg>
  );
}

function Leaf({ delay, left, duration, size }) {
  return (
    <span style={{
      position: 'absolute', top: '-20px', left: `${left}%`,
      width: `${size}px`, height: `${size}px`, opacity: 0,
      animation: `leafFall ${duration}s ease-in-out ${delay}s infinite`,
      color: 'var(--accent-gold)', fontSize: `${size}px`, lineHeight: 1, userSelect: 'none',
    }}>&#x1F343;</span>
  );
}

function CubeIcon({ type }) {
  const color = CUBE_TYPES[type]?.color ?? '#999';
  return (
    <span style={{
      display: 'inline-block', width: '14px', height: '14px',
      background: color, borderRadius: '3px', verticalAlign: 'middle',
      border: '1px solid rgba(0,0,0,0.15)', marginRight: '2px',
    }} />
  );
}

function ChampionCard({ champion, selected, taken, onClick }) {
  const bag = expandStartingBag(champion.startingBag);
  const cubeCounts = {};
  for (const c of bag) cubeCounts[c] = (cubeCounts[c] ?? 0) + 1;

  const isDisabled = taken && !selected;
  const borderColor = selected ? 'var(--accent-gold)' : isDisabled ? 'var(--border-subtle)' : 'var(--border-card)';
  const bgColor = selected ? 'rgba(184, 134, 11, 0.1)' : isDisabled ? 'rgba(0,0,0,0.03)' : 'var(--bg-surface)';

  return (
    <button
      onClick={isDisabled ? undefined : onClick}
      style={{
        background: bgColor,
        border: `2px solid ${borderColor}`,
        borderRadius: '12px',
        padding: '14px 16px',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.45 : 1,
        textAlign: 'left',
        fontFamily: 'var(--font-display)',
        transition: 'all 0.2s ease',
        width: '100%',
        maxWidth: '220px',
        boxShadow: selected ? '0 0 20px rgba(184, 134, 11, 0.2)' : 'none',
      }}
    >
      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '6px' }}>
        {champion.name}
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
        Affinities: {champion.affinities.map(a => (
          <span key={a} style={{ marginRight: '4px' }}>
            <CubeIcon type={a} /> {CUBE_TYPES[a]?.label}
          </span>
        ))}
      </div>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
        Bag: {Object.entries(cubeCounts).map(([type, count]) => (
          <span key={type} style={{ marginRight: '6px' }}>
            <CubeIcon type={type} />{count}
          </span>
        ))}
      </div>
      {champion.abilities && (
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '6px', fontStyle: 'italic' }}>
          {champion.abilities.length} abilities
        </div>
      )}
    </button>
  );
}

function VillainCard({ villain, selected, onClick }) {
  const borderColor = selected ? 'var(--accent-red)' : 'var(--border-card)';
  const bgColor = selected ? 'rgba(180, 40, 40, 0.08)' : 'var(--bg-surface)';

  return (
    <button
      onClick={onClick}
      style={{
        background: bgColor,
        border: `2px solid ${borderColor}`,
        borderRadius: '12px',
        padding: '14px 16px',
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: 'var(--font-display)',
        transition: 'all 0.2s ease',
        width: '100%',
        maxWidth: '200px',
        boxShadow: selected ? '0 0 20px rgba(180, 40, 40, 0.15)' : 'none',
      }}
    >
      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
        {villain.name}
      </div>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
        {villain.abilityText}
      </div>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
        Vermin: {villain.startingVermin} / Slots: {villain.slots}
      </div>
    </button>
  );
}

export default function LandingPage({ onPlay }) {
  const [exiting, setExiting] = useState(false);
  const [step, setStep] = useState('splash'); // 'splash' | 'setup'
  const [playerCount, setPlayerCount] = useState(2);
  const [championIds, setChampionIds] = useState([null, null, null, null]);
  const [villainId, setVillainId] = useState('vil-cluny');
  const [currentPicker, setCurrentPicker] = useState(0);

  const takenChampionIds = new Set(championIds.slice(0, playerCount).filter(Boolean));
  const allPicked = championIds.slice(0, playerCount).every(Boolean);

  const handleStart = () => {
    if (!allPicked) return;
    const config = {
      playerCount,
      championIds: championIds.slice(0, playerCount),
      villainId,
    };
    setExiting(true);
    setTimeout(() => onPlay(config), 550);
  };

  const handlePlayerCountChange = (n) => {
    setPlayerCount(n);
    setCurrentPicker(0);
    setChampionIds([null, null, null, null]);
  };

  const handlePickChampion = (champId) => {
    const next = [...championIds];
    if (next[currentPicker] === champId) {
      next[currentPicker] = null;
    } else {
      next[currentPicker] = champId;
    }
    setChampionIds(next);
  };

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
      <div style={styles.particles}>
        {leaves.map((l, i) => <Leaf key={i} {...l} />)}
      </div>
      <div style={styles.borderFrame}><div style={styles.borderFrameInner} /></div>
      <CornerFlourish style={{ top: '30px', left: '30px' }} />
      <CornerFlourish style={{ top: '30px', right: '30px', transform: 'scaleX(-1)' }} />
      <CornerFlourish style={{ bottom: '30px', left: '30px', transform: 'scaleY(-1)' }} />
      <CornerFlourish style={{ bottom: '30px', right: '30px', transform: 'scale(-1)' }} />

      <div style={styles.content}>
        <h1 style={styles.title}>Mossflower</h1>
        <p style={styles.subtitle}>A Redwall Adventure</p>
        <div style={styles.divider} />

        {step === 'splash' && (
          <>
            <button
              style={styles.button}
              onClick={() => setStep('setup')}
              onMouseEnter={e => { e.target.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.target.style.transform = ''; }}
            >
              Begin Your Adventure
            </button>
            <a
              href="https://docs.google.com/document/d/1LyNBD0d2oJCOFfGvD4e4zsY1cKv23_CxsA7pQhQN8ME/edit?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: 'var(--font-display)', fontSize: 'clamp(0.85rem, 1.5vw, 1rem)',
                fontStyle: 'italic', color: 'var(--text-muted)', marginTop: '24px',
                textDecoration: 'none', borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: '2px', transition: 'color 0.2s ease',
              }}
              onMouseEnter={e => { e.target.style.color = 'var(--accent-gold)'; }}
              onMouseLeave={e => { e.target.style.color = 'var(--text-muted)'; }}
            >
              Read the Rulebook
            </a>
          </>
        )}

        {step === 'setup' && (
          <div style={{ width: '100%', maxWidth: '900px' }}>
            {/* Player count */}
            <div style={styles.sectionLabel}>Players</div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '20px' }}>
              {[1, 2, 3, 4].map(n => (
                <button key={n} onClick={() => handlePlayerCountChange(n)} style={{
                  fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600,
                  width: '40px', height: '40px', borderRadius: '50%',
                  border: `2px solid ${n === playerCount ? 'var(--accent-gold)' : 'var(--border-card)'}`,
                  background: n === playerCount ? 'rgba(184, 134, 11, 0.15)' : 'var(--bg-surface)',
                  color: 'var(--text-primary)', cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}>
                  {n}
                </button>
              ))}
            </div>

            {/* Two-column layout: Champions | Horde */}
            <div className="setup-grid" style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px',
              marginBottom: '24px', alignItems: 'start',
            }}>
              {/* Left column — Champion selection */}
              <div>
                <div style={styles.sectionLabel}>
                  Choose Champion — Player {currentPicker + 1}
                </div>
                {playerCount > 1 && (
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '12px' }}>
                    {Array.from({ length: playerCount }, (_, i) => (
                      <button key={i} onClick={() => setCurrentPicker(i)} style={{
                        fontFamily: 'var(--font-display)', fontSize: '0.8rem', fontWeight: 600,
                        padding: '4px 14px', borderRadius: '20px',
                        border: `1px solid ${i === currentPicker ? 'var(--accent-gold)' : 'var(--border-card)'}`,
                        background: i === currentPicker ? 'rgba(184, 134, 11, 0.12)' : 'transparent',
                        color: championIds[i] ? 'var(--text-primary)' : 'var(--text-muted)',
                        cursor: 'pointer', transition: 'all 0.2s ease',
                      }}>
                        P{i + 1}{championIds[i] ? ' \u2713' : ''}
                      </button>
                    ))}
                  </div>
                )}
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '10px', justifyItems: 'center',
                }}>
                  {CHAMPIONS.map(c => (
                    <ChampionCard
                      key={c.id}
                      champion={c}
                      selected={championIds[currentPicker] === c.id}
                      taken={takenChampionIds.has(c.id) && championIds[currentPicker] !== c.id}
                      onClick={() => handlePickChampion(c.id)}
                    />
                  ))}
                </div>
              </div>

              {/* Right column — Horde / Villain selection */}
              <div>
                <div style={styles.sectionLabel}>Villain</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
                  {VILLAINS.map(v => (
                    <VillainCard
                      key={v.id}
                      villain={v}
                      selected={villainId === v.id}
                      onClick={() => setVillainId(v.id)}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Start button */}
            <button
              style={{
                ...styles.button,
                ...(allPicked ? {} : styles.buttonDisabled),
              }}
              onClick={handleStart}
              disabled={!allPicked}
              onMouseEnter={e => { if (allPicked) e.target.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.target.style.transform = ''; }}
            >
              Start Game
            </button>
          </div>
        )}
      </div>

      {/* Candlelight glow */}
      <div style={{
        position: 'absolute', top: '20%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255, 200, 100, 0.12) 0%, transparent 70%)',
        animation: 'glowPulse 4s ease-in-out infinite',
        pointerEvents: 'none', zIndex: 1,
      }} />
    </div>
  );
}
