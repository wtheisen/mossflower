import { useState } from 'react';

const styles = {
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    overflow: 'hidden',
  },
  tabBar: {
    display: 'flex',
    gap: '0',
    padding: '0 24px',
    borderBottom: '2px solid var(--border-card)',
    background: 'linear-gradient(180deg, var(--bg-elevated) 0%, var(--bg-surface) 100%)',
    flexShrink: 0,
  },
  tab: {
    padding: '10px 20px 8px',
    fontSize: '12px',
    fontWeight: 700,
    fontFamily: 'var(--font-display)',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    cursor: 'pointer',
    border: 'none',
    background: 'none',
    color: 'var(--text-muted)',
    position: 'relative',
    transition: 'color 0.15s',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    whiteSpace: 'nowrap',
  },
  tabActive: {
    color: 'var(--text-primary)',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: '-2px',
    left: '8px',
    right: '8px',
    height: '2px',
    borderRadius: '1px 1px 0 0',
  },
  badge: {
    fontSize: '10px',
    fontWeight: 700,
    fontFamily: 'var(--font-display)',
    fontStyle: 'normal',
    padding: '1px 6px',
    borderRadius: '8px',
    lineHeight: 1.4,
  },
  panel: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
  },
};

export default function BoardTabs({ tabs, activeTab, onTabChange }) {
  return (
    <div style={styles.container}>
      <div style={styles.tabBar}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              style={{
                ...styles.tab,
                ...(isActive ? styles.tabActive : {}),
              }}
              onClick={() => onTabChange(tab.id)}
            >
              {tab.label}
              {tab.badge != null && (
                <span
                  style={{
                    ...styles.badge,
                    background: isActive
                      ? (tab.badgeColor ?? 'var(--accent-gold)')
                      : 'var(--border-subtle)',
                    color: isActive ? '#fff' : 'var(--text-muted)',
                  }}
                >
                  {tab.badge}
                </span>
              )}
              {isActive && (
                <span
                  style={{
                    ...styles.tabIndicator,
                    background: tab.accentColor ?? 'var(--accent-gold)',
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
      <div style={styles.panel}>
        {tabs.find((t) => t.id === activeTab)?.content}
      </div>
    </div>
  );
}
