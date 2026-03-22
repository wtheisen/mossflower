import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const themeCss = readFileSync(resolve(__dirname, '..', 'theme.css'), 'utf8');

describe('cube draw animation CSS', () => {
  it('defines --draw-wobble-duration custom property', () => {
    expect(themeCss).toContain('--draw-wobble-duration:');
  });

  it('defines --draw-reveal-duration custom property', () => {
    expect(themeCss).toContain('--draw-reveal-duration:');
  });

  it('defines cube-revealing class with wobble and color cycle animations', () => {
    expect(themeCss).toContain('.cube-revealing');
    expect(themeCss).toContain('cubeWobble');
    expect(themeCss).toContain('cubeCycleColors');
  });

  it('defines cube-revealed class with pop animation', () => {
    expect(themeCss).toContain('.cube-revealed');
    expect(themeCss).toContain('cubeRevealPop');
  });

  it('cubeRevealPop uses --cube-glow-color for the glow effect', () => {
    expect(themeCss).toContain('var(--cube-glow-color');
  });

  it('cubeCycleColors cycles through a fixed set of cube colors', () => {
    expect(themeCss).toContain('var(--cube-squirrel)');
    expect(themeCss).toContain('var(--cube-otter)');
    expect(themeCss).toContain('var(--cube-hare)');
    expect(themeCss).toContain('var(--cube-badger)');
    expect(themeCss).toContain('var(--cube-food)');
  });

  it('defines bust shake and flash effects', () => {
    expect(themeCss).toContain('.board--bust');
    expect(themeCss).toContain('bustShake');
    expect(themeCss).toContain('bustFlash');
  });

  it('bust flash overlay uses pointer-events: none so it does not block clicks', () => {
    const afterBlock = themeCss.match(/\.board--bust::after\s*\{[^}]+\}/);
    expect(afterBlock).not.toBeNull();
    expect(afterBlock[0]).toContain('pointer-events: none');
  });
});
