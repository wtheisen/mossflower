import Card from './Card';
import Bag from './Bag';
import Band from './Band';
import CubeChip from './CubeChip';

const styles = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(60, 45, 30, 0.5)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  panel: {
    background: 'linear-gradient(170deg, var(--bg-surface) 0%, var(--bg-elevated) 100%)',
    border: '2px solid var(--border-card)',
    borderRadius: '14px',
    padding: '28px',
    display: 'flex',
    gap: '24px',
    alignItems: 'flex-start',
    maxWidth: '90vw',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 8px 32px rgba(80, 60, 30, 0.25), 0 0 0 1px var(--border-subtle)',
    flexWrap: 'wrap',
  },
  cardSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
  },
  targetLabel: {
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    color: 'var(--text-muted)',
    fontWeight: 600,
    fontFamily: 'var(--font-display)',
    fontStyle: 'italic',
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    minWidth: '160px',
  },
  helpSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    minWidth: '160px',
  },
  helpLabel: {
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: 'var(--accent-gold)',
    fontWeight: 700,
    fontFamily: 'var(--font-display)',
  },
  helperPanel: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-card)',
    borderRadius: '8px',
    padding: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  helperName: {
    fontSize: '12px',
    fontWeight: 700,
    fontFamily: 'var(--font-display)',
    color: 'var(--text-primary)',
  },
  helperInfo: {
    fontSize: '10px',
    color: 'var(--text-muted)',
  },
  helperCubes: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '3px',
  },
  btn: {
    padding: '6px 10px',
    borderRadius: '6px',
    border: 'none',
    fontSize: '11px',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'var(--font-display)',
    letterSpacing: '0.04em',
  },
  btnHelp: {
    background: 'linear-gradient(180deg, #7ba86e 0%, #5a8a4e 100%)',
    color: '#fff',
    boxShadow: '0 2px 4px rgba(90, 138, 78, 0.3)',
  },
  btnSkip: {
    background: 'transparent',
    border: '1px solid var(--border-card)',
    color: 'var(--text-secondary)',
    fontSize: '11px',
  },
};

export default function ActionOverlay({
  targetCard, bag, band, action, busted, bagEmpty, message,
  power, bustThreshold, bustCount, drawBonuses,
  onDraw, onRecruit, onResolveCombat, onForfeit, onCancel,
  helpPhase, players, activePlayerIndex,
  onRequestHelp, onHelperDraw, onHelperDone, onSkipHelp,
  getPlayerBustThreshold,
}) {
  if (!action) return null;

  const isCombat = action.type === 'combat';
  const label = isCombat ? 'Combat' : action.type === 'recruit' ? 'Recruiting' : 'Action';
  const canRequestHelp = players && players.length > 1 && !helpPhase && !busted && band.length > 0;

  return (
    <div style={styles.backdrop} onClick={isCombat ? undefined : onCancel}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div style={styles.cardSection}>
          <div style={styles.targetLabel}>{label}</div>
          <Card card={targetCard} selected />
        </div>
        <div style={styles.sidebar}>
          <Bag cubes={bag} />
          <Band
            cubes={band}
            action={action}
            busted={busted}
            bagEmpty={bagEmpty}
            message={message}
            power={power}
            bustThreshold={bustThreshold}
            bustCount={bustCount}
            drawBonuses={drawBonuses}
            onDraw={onDraw}
            onRecruit={onRecruit}
            onResolveCombat={onResolveCombat}
            onForfeit={onForfeit}
            onCancel={onCancel}
            helpPhase={helpPhase}
          />
          {canRequestHelp && (
            <button
              style={{ ...styles.btn, ...styles.btnHelp }}
              onClick={onRequestHelp}
            >
              Request Help
            </button>
          )}
          {helpPhase && (
            <button
              style={{ ...styles.btn, ...styles.btnSkip }}
              onClick={onSkipHelp}
            >
              Done with Help
            </button>
          )}
        </div>

        {/* Helper panels */}
        {helpPhase && players && (
          <div style={styles.helpSection}>
            <div style={styles.helpLabel}>Reinforcements</div>
            {players.map((helper, i) => {
              if (i === activePlayerIndex) return null;
              const helperThreshold = getPlayerBustThreshold ? getPlayerBustThreshold(helper) : 3;
              return (
                <div key={i} style={styles.helperPanel}>
                  <div style={styles.helperName}>
                    Player {i + 1} — {helper.champion.name}
                  </div>
                  <div style={styles.helperInfo}>
                    Bag: {helper.bag.length} | Bust: {helper.helpBustCount}/{helperThreshold}
                    {helper.helpBusted && ' (BUSTED)'}
                  </div>
                  {helper.helpBand.length > 0 && (
                    <div style={styles.helperCubes}>
                      {helper.helpBand.map((type, j) => (
                        <CubeChip key={j} cubeType={type} />
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {!helper.helpBusted && helper.bag.length > 0 && (
                      <button
                        style={{ ...styles.btn, ...styles.btnHelp }}
                        onClick={() => onHelperDraw(i)}
                      >
                        Draw
                      </button>
                    )}
                    {helper.helpBand.length > 0 && (
                      <button
                        style={{ ...styles.btn, ...styles.btnSkip }}
                        onClick={() => onHelperDone(i)}
                      >
                        Done
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
