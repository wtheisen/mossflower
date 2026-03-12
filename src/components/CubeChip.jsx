import { CUBE_TYPES } from '../data/cards';

const styles = {
  chip: {
    width: 'var(--cube-size)',
    height: 'var(--cube-size)',
    borderRadius: '3px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
    fontWeight: 700,
    color: '#fff',
    textShadow: '0 1px 2px rgba(0,0,0,0.6)',
    border: '2px solid rgba(255,255,255,0.15)',
    flexShrink: 0,
  },
};

export default function CubeChip({ cubeType }) {
  const info = CUBE_TYPES[cubeType];
  if (!info) return null;

  const isDark = cubeType === 'vermin' || cubeType === 'wound';

  return (
    <span
      style={{
        ...styles.chip,
        background: info.color,
        border: isDark
          ? '2px solid rgba(255,255,255,0.3)'
          : '2px solid rgba(255,255,255,0.15)',
      }}
      title={info.label}
    >
      {info.label[0]}
    </span>
  );
}
