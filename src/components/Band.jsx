import CubeChip from './CubeChip';

const styles = {
  container: {
    background: 'var(--bg-card)',
    border: '2px solid var(--border-card)',
    borderRadius: 'var(--radius)',
    padding: '10px 12px',
    minWidth: '140px',
  },
  label: {
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--text-muted)',
    fontWeight: 600,
    marginBottom: '8px',
  },
  count: {
    fontSize: '20px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: '8px',
  },
  cubes: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '5px',
    marginBottom: '8px',
  },
  empty: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    fontStyle: 'italic',
  },
  buttons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginTop: '4px',
  },
  btn: {
    padding: '6px 10px',
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'var(--font)',
  },
  btnDraw: {
    background: 'var(--accent-gold)',
    color: '#000',
  },
  btnRecruit: {
    background: '#4a90d9',
    color: '#fff',
  },
  btnCombat: {
    background: 'var(--accent-red, #c44b4b)',
    color: '#fff',
  },
  btnCancel: {
    background: 'transparent',
    border: '1px solid var(--border-card)',
    color: 'var(--text-secondary)',
  },
  btnDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  message: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
    lineHeight: 1.35,
    marginTop: '6px',
  },
  bustMessage: {
    color: 'var(--accent-red)',
    fontWeight: 600,
  },
  powerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '6px',
    fontSize: '12px',
  },
  powerLabel: {
    color: 'var(--text-muted)',
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    fontWeight: 600,
  },
  powerValue: {
    fontWeight: 700,
    color: 'var(--accent-gold)',
    fontSize: '16px',
  },
  bustInfo: {
    fontSize: '10px',
    color: 'var(--text-muted)',
    marginBottom: '4px',
  },
  triggerMsg: {
    fontSize: '10px',
    color: 'var(--accent-gold)',
    fontWeight: 600,
    padding: '2px 0',
  },
};

export default function Band({
  cubes, action, busted, bagEmpty, message, power, bustThreshold, bustCount,
  drawBonuses,
  onDraw, onRecruit, onResolveCombat, onCancel,
  canEndDay, onEndDay, isDusk, isNight, nightReturns, onEndNight,
}) {
  const inAction = !!action;
  const isCombat = action?.type === 'combat';

  const handleDragStart = (e, index) => {
    e.dataTransfer.setData('cube-index', String(index));
    e.dataTransfer.effectAllowed = 'move';
  };

  // Recent trigger messages (last 3)
  const triggerMessages = drawBonuses?.messages?.slice(-3) ?? [];

  return (
    <div style={styles.container}>
      <div style={styles.label}>Band (drawn)</div>
      <div style={styles.count}>{cubes.length}</div>

      {/* Power and bust threshold during actions */}
      {inAction && cubes.length > 0 && (
        <>
          <div style={styles.powerRow}>
            <span style={styles.powerLabel}>Power</span>
            <span style={styles.powerValue}>{power ?? 0}</span>
          </div>
          <div style={styles.bustInfo}>
            Bust: {bustCount ?? 0}/{bustThreshold ?? 3} bad cubes
          </div>
        </>
      )}

      {/* Trigger notifications */}
      {inAction && triggerMessages.length > 0 && (
        <div style={{ marginBottom: '6px' }}>
          {triggerMessages.map((msg, i) => (
            <div key={i} style={styles.triggerMsg}>{msg}</div>
          ))}
        </div>
      )}

      <div style={styles.cubes}>
        {cubes.length === 0 ? (
          <span style={styles.empty}>
            {inAction ? 'Draw to begin' : isDusk ? 'All cubes placed!' : 'No cubes drawn'}
          </span>
        ) : (
          cubes.map((type, i) => (
            <span
              key={i}
              draggable={isDusk}
              onDragStart={isDusk ? (e) => handleDragStart(e, i) : undefined}
              style={{ cursor: isDusk ? 'grab' : 'default' }}
            >
              <CubeChip cubeType={type} />
            </span>
          ))
        )}
      </div>

      {inAction && (
        <div style={styles.buttons}>
          {!busted && (
            <button
              style={{
                ...styles.btn,
                ...styles.btnDraw,
                ...(bagEmpty ? styles.btnDisabled : {}),
              }}
              onClick={onDraw}
              disabled={bagEmpty}
            >
              Draw Cube
            </button>
          )}
          {!busted && !isCombat && cubes.length > 0 && (
            <button
              style={{ ...styles.btn, ...styles.btnRecruit }}
              onClick={onRecruit}
            >
              Recruit
            </button>
          )}
          {isCombat && cubes.length >= (action.verminAdded ?? 0) && (
            <button
              style={{ ...styles.btn, ...styles.btnCombat }}
              onClick={onResolveCombat}
            >
              Resolve Combat
            </button>
          )}
          {!isCombat && (
            <button
              style={{ ...styles.btn, ...styles.btnCancel }}
              onClick={onCancel}
            >
              {busted ? 'Dismiss' : 'Cancel'}
            </button>
          )}
        </div>
      )}

      {canEndDay && !inAction && (
        <div style={styles.buttons}>
          <button
            style={{ ...styles.btn, ...styles.btnDraw }}
            onClick={onEndDay}
          >
            End Turn
          </button>
        </div>
      )}

      {isNight && (
        <div style={styles.buttons}>
          <button
            style={{ ...styles.btn, ...styles.btnDraw }}
            onClick={onEndNight}
          >
            End Night ({2 - nightReturns} return{2 - nightReturns !== 1 ? 's' : ''} left)
          </button>
        </div>
      )}

      {message && (
        <p style={{ ...styles.message, ...(busted ? styles.bustMessage : {}) }}>
          {message}
        </p>
      )}
    </div>
  );
}
