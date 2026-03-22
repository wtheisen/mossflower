import { useState, useEffect, useRef } from 'react';

const PHASE_LABELS = { day: 'Day', dusk: 'Dusk', night: 'Night' };

function groupByDay(log) {
  const groups = [];
  let current = null;
  for (const entry of log) {
    if (!current || current.day !== entry.day) {
      current = { day: entry.day, entries: [] };
      groups.push(current);
    }
    current.entries.push(entry);
  }
  return groups;
}

export default function GameLog({ log, isOpen, onToggle, inline }) {
  const [expandedDays, setExpandedDays] = useState({});
  const scrollRef = useRef(null);
  const groups = groupByDay(log);

  // Auto-expand the latest day
  const latestDay = groups.length > 0 ? groups[groups.length - 1].day : null;

  useEffect(() => {
    if (scrollRef.current && isOpen) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [log.length, isOpen]);

  const toggleDay = (day) => {
    setExpandedDays((prev) => ({ ...prev, [day]: !prev[day] }));
  };

  const isDayExpanded = (day) => {
    if (day === latestDay) return expandedDays[day] !== false;
    return expandedDays[day] === true;
  };

  if (inline) {
    return (
      <div style={styles.inlineContainer}>
        <button
          style={styles.inlineToggle}
          onClick={onToggle}
        >
          <span style={styles.toggleIcon}>{isOpen ? '\u25BC' : '\u25B6'}</span>
          <span style={styles.inlineTitle}>Event Log</span>
          <span style={styles.entryCount}>{log.length}</span>
        </button>
        {isOpen && (
          <div ref={scrollRef} style={styles.inlineBody}>
            {renderGroups(groups, isDayExpanded, toggleDay)}
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <button
        style={{
          ...styles.sidebarToggle,
          ...(isOpen ? styles.sidebarToggleOpen : {}),
        }}
        onClick={onToggle}
        title={isOpen ? 'Close log' : 'Open log'}
      >
        <span style={styles.toggleIconSidebar}>{isOpen ? '\u25B6' : '\u25C0'}</span>
        {!isOpen && <span style={styles.sidebarToggleLabel}>Log</span>}
      </button>
      {isOpen && (
        <div style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <span style={styles.sidebarTitle}>Event Log</span>
            <span style={styles.entryCount}>{log.length}</span>
          </div>
          <div ref={scrollRef} style={styles.sidebarBody}>
            {renderGroups(groups, isDayExpanded, toggleDay)}
          </div>
        </div>
      )}
    </>
  );
}

function renderGroups(groups, isDayExpanded, toggleDay) {
  if (groups.length === 0) {
    return <p style={styles.emptyMsg}>No events yet.</p>;
  }
  return groups.map((group) => (
    <div key={group.day} style={styles.dayGroup}>
      <button
        style={styles.dayHeader}
        onClick={() => toggleDay(group.day)}
      >
        <span style={styles.dayToggle}>
          {isDayExpanded(group.day) ? '\u25BC' : '\u25B6'}
        </span>
        <span style={styles.dayLabel}>Day {group.day}</span>
        <span style={styles.dayCount}>{group.entries.length}</span>
      </button>
      {isDayExpanded(group.day) && (
        <div style={styles.dayEntries}>
          {group.entries.map((entry, i) => (
            <div key={i} style={styles.entry}>
              <span style={styles.phaseTag}>
                {PHASE_LABELS[entry.phase] ?? entry.phase}
              </span>
              <span style={styles.entryText}>{entry.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  ));
}

const styles = {
  // Sidebar (desktop)
  sidebar: {
    width: 280,
    flexShrink: 0,
    borderLeft: '2px solid var(--border-card)',
    background: 'linear-gradient(180deg, var(--bg-surface) 0%, var(--bg-elevated) 100%)',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
  },
  sidebarHeader: {
    padding: '8px 12px',
    borderBottom: '1px solid var(--border-subtle)',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  sidebarTitle: {
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
    fontSize: 14,
    color: 'var(--text-primary)',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  sidebarBody: {
    flex: 1,
    overflowY: 'auto',
    padding: '4px 0',
  },
  sidebarToggle: {
    position: 'absolute',
    right: 0,
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 10,
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-card)',
    borderRight: 'none',
    borderRadius: '6px 0 0 6px',
    padding: '8px 4px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    boxShadow: '-2px 0 6px rgba(100,80,50,0.1)',
  },
  sidebarToggleOpen: {
    right: 280,
  },
  toggleIconSidebar: {
    fontSize: 10,
    color: 'var(--text-muted)',
  },
  sidebarToggleLabel: {
    fontFamily: 'var(--font-display)',
    fontSize: 9,
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    writingMode: 'vertical-lr',
  },

  // Inline (mobile)
  inlineContainer: {
    borderTop: '1px solid var(--border-subtle)',
    marginTop: 8,
  },
  inlineToggle: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 8px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'var(--font-display)',
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  inlineTitle: {
    flex: 1,
    textAlign: 'left',
  },
  inlineBody: {
    maxHeight: 200,
    overflowY: 'auto',
    padding: '0 4px 4px',
  },
  toggleIcon: {
    fontSize: 9,
    color: 'var(--text-muted)',
  },

  // Shared
  entryCount: {
    fontSize: 10,
    color: 'var(--text-muted)',
    background: 'var(--bg-card)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 8,
    padding: '1px 6px',
    fontFamily: 'var(--font-body)',
  },
  emptyMsg: {
    padding: '12px',
    color: 'var(--text-muted)',
    fontStyle: 'italic',
    fontSize: 12,
    textAlign: 'center',
  },
  dayGroup: {
    marginBottom: 2,
  },
  dayHeader: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 10px',
    background: 'var(--bg-card)',
    border: 'none',
    borderBottom: '1px solid var(--border-subtle)',
    cursor: 'pointer',
    fontFamily: 'var(--font-display)',
  },
  dayToggle: {
    fontSize: 8,
    color: 'var(--text-muted)',
  },
  dayLabel: {
    flex: 1,
    textAlign: 'left',
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--text-primary)',
    letterSpacing: '0.04em',
  },
  dayCount: {
    fontSize: 9,
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-body)',
  },
  dayEntries: {
    padding: '2px 0',
  },
  entry: {
    display: 'flex',
    gap: 6,
    padding: '3px 10px 3px 18px',
    alignItems: 'flex-start',
    lineHeight: 1.35,
  },
  phaseTag: {
    fontSize: 9,
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    flexShrink: 0,
    marginTop: 1,
    minWidth: 30,
  },
  entryText: {
    fontSize: 11,
    fontFamily: 'var(--font-body)',
    color: 'var(--text-secondary)',
    wordBreak: 'break-word',
  },
};
