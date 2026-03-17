import Card from './Card';
import CubeSlots from './CubeSlots';

const styles = {
  section: {
    padding: '16px 24px 8px',
  },
  label: {
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    color: 'var(--accent-red)',
    marginBottom: '10px',
    fontWeight: 700,
    fontFamily: 'var(--font-display)',
    fontStyle: 'italic',
  },
  row: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
  },
  deck: {
    width: 'var(--card-width)',
    minHeight: 'var(--card-height)',
    background: 'linear-gradient(170deg, var(--bg-elevated) 0%, rgba(139, 104, 66, 0.08) 100%)',
    border: '2px solid var(--type-fortress)',
    borderRadius: 'var(--radius)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    flexShrink: 0,
    boxShadow: '3px 3px 0 var(--border-subtle), 5px 5px 0 var(--bg-elevated)',
  },
  deckLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontFamily: 'var(--font-display)',
  },
  deckCount: {
    fontSize: '26px',
    fontWeight: 700,
    fontFamily: 'var(--font-display)',
    color: 'var(--text-primary)',
  },
  deckSub: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    fontStyle: 'italic',
  },
  track: {
    width: 'calc(var(--card-width) * 2 + 12px)',
    minHeight: 'var(--card-height)',
    background: 'linear-gradient(170deg, var(--bg-card) 0%, rgba(160, 80, 64, 0.06) 100%)',
    border: '2px solid var(--accent-red)',
    borderRadius: 'var(--radius)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    flexShrink: 0,
    boxShadow: '0 2px 8px rgba(100, 80, 50, 0.12), inset 0 1px 0 rgba(255,255,255,0.4)',
  },
  trackHeader: {
    padding: '10px 12px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  trackBadge: {
    fontSize: '9px',
    fontWeight: 700,
    fontFamily: 'var(--font-display)',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    padding: '2px 8px',
    borderRadius: '10px',
    alignSelf: 'flex-start',
    color: '#fff',
    background: 'var(--accent-red)',
  },
  trackName: {
    fontSize: '14px',
    fontWeight: 600,
    fontFamily: 'var(--font-display)',
    fontStyle: 'italic',
    color: 'var(--text-primary)',
    lineHeight: 1.25,
  },
  trackBody: {
    padding: '0 12px 8px',
    fontSize: '12px',
    color: 'var(--text-secondary)',
    lineHeight: 1.4,
    flex: 1,
    fontStyle: 'italic',
  },
  trackSlots: {
    marginTop: 'auto',
    padding: '6px 12px 12px',
    borderTop: '1px dashed var(--border-subtle)',
  },
  trackSlotsLabel: {
    fontSize: '9px',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '5px',
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
  },
};

export default function HordeArea({ fortress, fortressDeckSize, villain, conquest = 0 }) {
  const filled = Array.from({ length: conquest }, () => ({ type: 'vermin' }));

  return (
    <div style={styles.section}>
      <div style={styles.label}>The Horde</div>
      <div style={styles.row}>
        <Card card={fortress} />
        {fortressDeckSize > 0 && (
          <div style={styles.deck}>
            <div style={styles.deckLabel}>Fortress</div>
            <div style={styles.deckCount}>{fortressDeckSize}</div>
            <div style={styles.deckSub}>remaining</div>
          </div>
        )}
        <Card card={villain} />
        <div style={styles.track}>
          <div style={styles.trackHeader}>
            <span style={styles.trackBadge}>Conquest</span>
            <span style={styles.trackName}>Conquest Track</span>
          </div>
          <div style={styles.trackBody}>
            Game ends if this reaches 10.
          </div>
          <div style={styles.trackSlots}>
            <div style={styles.trackSlotsLabel}>
              Vermin ({conquest}/10)
            </div>
            <CubeSlots total={10} filled={filled} />
          </div>
        </div>
      </div>
    </div>
  );
}
