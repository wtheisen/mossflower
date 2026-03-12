import { CUBE_TYPES } from '../data/cards';

const styles = {
  row: {
    display: 'flex',
    gap: '4px',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  slot: {
    width: 'var(--slot-size)',
    height: 'var(--slot-size)',
    borderRadius: '3px',
    border: '2px dashed var(--border-card)',
    background: 'transparent',
    flexShrink: 0,
  },
  filled: {
    width: 'var(--slot-size)',
    height: 'var(--slot-size)',
    borderRadius: '3px',
    border: '2px solid rgba(255,255,255,0.2)',
    flexShrink: 0,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '8px',
    fontWeight: 700,
    color: '#fff',
    textShadow: '0 1px 2px rgba(0,0,0,0.6)',
  },
};

/**
 * Renders a row of cube slots — filled slots show a colored circle,
 * empty ones show a dashed outline.
 *
 * @param {number} total — total number of slots
 * @param {Array<{type: string}>} filled — cubes placed in slots
 */
export default function CubeSlots({ total, filled = [], onSlotClick }) {
  const slots = [];
  for (let i = 0; i < total; i++) {
    const cube = filled[i];
    if (cube) {
      const info = CUBE_TYPES[cube.type];
      const clickable = !!onSlotClick;
      slots.push(
        <span
          key={i}
          style={{
            ...styles.filled,
            background: info?.color ?? '#555',
            cursor: clickable ? 'pointer' : 'default',
            ...(clickable ? { outline: '1px dashed rgba(255,255,255,0.4)', outlineOffset: '1px' } : {}),
          }}
          title={clickable ? `Click to return ${info?.label ?? cube.type} to bag` : (info?.label ?? cube.type)}
          onClick={clickable ? (e) => { e.stopPropagation(); onSlotClick(i); } : undefined}
        >
          {(info?.label ?? cube.type)[0]}
        </span>,
      );
    } else {
      slots.push(<span key={i} style={styles.slot} />);
    }
  }

  return <div style={styles.row}>{slots}</div>;
}
