import Card from './Card';
import CubeSlots from './CubeSlots';

const styles = {
  section: {
    padding: '16px 20px 8px',
  },
  label: {
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--text-muted)',
    marginBottom: '10px',
    fontWeight: 600,
  },
  row: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
  },
  deck: {
    width: 'var(--card-width)',
    minHeight: 'var(--card-height)',
    background: 'var(--bg-elevated)',
    border: '2px solid var(--type-fortress)',
    borderRadius: 'var(--radius)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    flexShrink: 0,
    boxShadow: '4px 4px 0 var(--bg-card), 6px 6px 0 var(--border-subtle)',
  },
  deckLabel: {
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  deckCount: {
    fontSize: '24px',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  deckSub: {
    fontSize: '10px',
    color: 'var(--text-muted)',
  },
  track: {
    width: 'calc(var(--card-width) * 2 + 12px)',
    minHeight: 'var(--card-height)',
    background: 'var(--bg-card)',
    border: '2px solid var(--accent-red)',
    borderRadius: 'var(--radius)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    flexShrink: 0,
    boxShadow: '0 2px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
  },
  trackHeader: {
    padding: '8px 10px 6px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  trackBadge: {
    fontSize: '9px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    padding: '2px 6px',
    borderRadius: 'var(--radius-sm)',
    alignSelf: 'flex-start',
    color: '#fff',
    background: 'var(--accent-red)',
  },
  trackName: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    lineHeight: 1.2,
  },
  trackBody: {
    padding: '0 10px 8px',
    fontSize: '11px',
    color: 'var(--text-secondary)',
    lineHeight: 1.35,
    flex: 1,
  },
  trackSlots: {
    marginTop: 'auto',
    padding: '6px 10px 10px',
  },
  trackSlotsLabel: {
    fontSize: '9px',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: '4px',
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
