import CubeChip from './CubeChip';

const styles = {
  container: {
    background: 'linear-gradient(170deg, var(--bg-card) 0%, var(--bg-elevated) 100%)',
    border: '2px solid var(--border-card)',
    borderRadius: 'var(--radius)',
    padding: '12px 14px',
    minWidth: '140px',
    boxShadow: '0 2px 6px rgba(100, 80, 50, 0.1), inset 0 1px 0 rgba(255,255,255,0.5)',
  },
  label: {
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: 'var(--text-muted)',
    fontWeight: 600,
    fontFamily: 'var(--font-display)',
    marginBottom: '6px',
  },
  count: {
    fontSize: '22px',
    fontWeight: 700,
    fontFamily: 'var(--font-display)',
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
    fontSize: '13px',
    color: 'var(--text-muted)',
    fontStyle: 'italic',
  },
  buttons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginTop: '6px',
  },
  btn: {
    padding: '8px 12px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'var(--font-display)',
    letterSpacing: '0.04em',
    transition: 'transform 0.1s, box-shadow 0.15s',
  },
  btnDraw: {
    background: 'linear-gradient(180deg, #c9a020 0%, #a07810 100%)',
    color: '#fff',
    boxShadow: '0 2px 6px rgba(160, 120, 16, 0.3)',
    textShadow: '0 1px 2px rgba(80, 60, 10, 0.4)',
  },
  btnRecruit: {
    background: 'linear-gradient(180deg, #6b94b8 0%, #4a7a9e 100%)',
    color: '#fff',
    boxShadow: '0 2px 6px rgba(74, 122, 158, 0.3)',
    textShadow: '0 1px 2px rgba(40, 60, 80, 0.4)',
  },
  btnCombat: {
    background: 'linear-gradient(180deg, #b86050 0%, #a04535 100%)',
    color: '#fff',
    boxShadow: '0 2px 6px rgba(160, 69, 53, 0.3)',
    textShadow: '0 1px 2px rgba(80, 30, 20, 0.4)',
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
    fontSize: '12px',
    color: 'var(--text-secondary)',
    lineHeight: 1.4,
    marginTop: '6px',
    fontStyle: 'italic',
  },
  bustMessage: {
    color: 'var(--accent-red)',
    fontWeight: 600,
    fontStyle: 'normal',
  },
  powerRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '8px',
    marginBottom: '6px',
    fontSize: '13px',
  },
  powerLabel: {
    color: 'var(--text-muted)',
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontWeight: 600,
    fontFamily: 'var(--font-display)',
  },
  powerValue: {
    fontWeight: 700,
    color: 'var(--accent-gold)',
    fontSize: '18px',
    fontFamily: 'var(--font-display)',
  },
  bustInfo: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    marginBottom: '4px',
    fontStyle: 'italic',
  },
  triggerMsg: {
    fontSize: '11px',
    color: 'var(--accent-gold)',
    fontWeight: 600,
    fontFamily: 'var(--font-display)',
    padding: '2px 0',
  },
};

export default function Band({
  cubes, action, busted, bagEmpty, message, power, bustThreshold, bustCount,
  drawBonuses, nextDrawTeaser,
  onDraw, onRecruit, onResolveCombat, onForfeit, onCancel,
  canEndDay, onEndDay, isDusk, isNight, nightReturns, onEndNight,
  onDiscardFood, helpPhase, onDragCubeType,
  selectedCubeIndex, onSelectCube,
}) {
  const inAction = !!action;
  const isCombat = action?.type === 'combat';

  const handleDragStart = (e, index) => {
    e.dataTransfer.setData('cube-index', String(index));
    e.dataTransfer.effectAllowed = 'move';
    if (onDragCubeType) onDragCubeType(cubes[index]);
  };

  const handleDragEnd = () => {
    if (onDragCubeType) onDragCubeType(null);
  };

  // Recent trigger messages (last 3)
  const triggerMessages = drawBonuses?.messages?.slice(-3) ?? [];

  return (
    <div className="band" style={styles.container}>
      <div className="band__label" style={styles.label}>Band (drawn)</div>
      <div className="band__count" style={styles.count}>{cubes.length}</div>

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

      {/* Next-draw teaser */}
      {inAction && !busted && nextDrawTeaser && (
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', fontStyle: 'italic' }}>
          {nextDrawTeaser}
        </div>
      )}

      {/* Trigger notifications */}
      {inAction && triggerMessages.length > 0 && (
        <div style={{ marginBottom: '6px' }}>
          {triggerMessages.map((msg, i) => (
            <div key={i} style={styles.triggerMsg}>{msg}</div>
          ))}
        </div>
      )}

      {/* Help phase indicator */}
      {helpPhase && inAction && (
        <div style={{ fontSize: '11px', color: 'var(--accent-gold)', fontWeight: 600, marginBottom: '6px', fontFamily: 'var(--font-display)' }}>
          Helpers may draw cubes for you
        </div>
      )}

      <div className="band__cubes" style={styles.cubes}>
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
              onDragEnd={isDusk ? handleDragEnd : undefined}
              onClick={isDusk && onSelectCube ? () => onSelectCube(selectedCubeIndex === i ? null : i) : undefined}
              className={isDusk && selectedCubeIndex === i ? 'cube-selected' : ''}
              style={{ cursor: isDusk ? 'grab' : 'default', display: 'inline-flex', alignItems: 'center', gap: '2px' }}
            >
              <CubeChip cubeType={type} />
              {isDusk && type === 'food' && onDiscardFood && (
                <button
                  onClick={() => onDiscardFood(i)}
                  title="Return food to supply"
                  style={{
                    fontSize: '12px',
                    padding: '4px 8px',
                    minWidth: '28px',
                    minHeight: '28px',
                    border: '1px solid var(--border-card)',
                    borderRadius: '4px',
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    lineHeight: 1,
                    fontFamily: 'var(--font-display)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ×
                </button>
              )}
            </span>
          ))
        )}
      </div>

      {inAction && (
        <div className="band__buttons" style={styles.buttons}>
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
          {!busted && !isCombat && (
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
          {isCombat && !busted && (
            <button
              style={{ ...styles.btn, ...styles.btnCancel }}
              onClick={onForfeit}
            >
              Forfeit
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
        <div className="band__buttons" style={styles.buttons}>
          <button
            style={{ ...styles.btn, ...styles.btnDraw }}
            onClick={onEndDay}
          >
            End Turn
          </button>
        </div>
      )}

      {isNight && (
        <div className="band__buttons" style={styles.buttons}>
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
