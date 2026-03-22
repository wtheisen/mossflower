import { CUBE_TYPES } from '../data/cards';

const styles = {
  chip: {
    width: 'var(--cube-size)',
    height: 'var(--cube-size)',
    borderRadius: '5px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
    fontWeight: 700,
    fontFamily: 'var(--font-display)',
    color: '#fff',
    textShadow: '0 1px 2px rgba(60,40,20,0.5)',
    flexShrink: 0,
    boxShadow: '0 1px 3px rgba(100, 80, 50, 0.25), inset 0 1px 0 rgba(255,255,255,0.25)',
  },
};

export default function CubeChip({ cubeType, animating, onAnimationEnd }) {
  const info = CUBE_TYPES[cubeType];
  if (!info) return null;

  const isDark = cubeType === 'vermin' || cubeType === 'wound';
  const className = animating === 'wobble' ? 'cube-revealing'
    : animating === 'reveal' ? 'cube-revealed'
    : '';

  return (
    <span
      className={className || undefined}
      onAnimationEnd={onAnimationEnd}
      style={{
        ...styles.chip,
        // During wobble phase, hide the real color (CSS animation overrides background)
        background: animating === 'wobble' ? 'var(--cube-mouse)' : info.color,
        border: isDark
          ? '2px solid rgba(255,255,255,0.3)'
          : '2px solid rgba(255,255,255,0.2)',
        // Pass cube color as CSS variable for glow effect
        '--cube-glow-color': info.color,
      }}
      title={info.label}
    >
      {animating === 'wobble' ? '?' : info.label[0]}
    </span>
  );
}
