import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(resolve(__dirname, 'layout.css'), 'utf8');

describe('layout.css media query deduplication', () => {
  it('has a shared phone rules block covering both orientations', () => {
    expect(css).toContain(
      '@media (max-height: 500px) and (max-width: 900px), (max-width: 500px) and (orientation: portrait)'
    );
  });

  it('defines .adventure-row padding only once', () => {
    const matches = css.match(/\.adventure-row\s*\{[^}]*padding:\s*2px 0/g);
    expect(matches).toHaveLength(1);
  });

  it('defines .adventure-row__label font-size only once', () => {
    const matches = css.match(/\.adventure-row__label\s*\{[^}]*font-size:\s*8px/g);
    expect(matches).toHaveLength(1);
  });

  it('defines .discovered-locations padding only once', () => {
    const matches = css.match(/\.discovered-locations\s*\{[^}]*padding:\s*1px 0/g);
    expect(matches).toHaveLength(1);
  });

  it('defines .horde-area padding only once', () => {
    const matches = css.match(/\.horde-area\s*\{[^}]*padding:\s*3px 4px/g);
    expect(matches).toHaveLength(1);
  });

  it('keeps landscape-only padding-bottom: 0 on .adventure-row__cards', () => {
    // This rule exists only in the landscape block and must not be removed
    expect(css).toContain('padding-bottom: 0 !important;');
  });
});
