import { describe, it, expect } from 'vitest';

import { casinoColors, casinoGradients } from './styles/tokens';

describe('@jito/ui tokens and configurations', () => {
  it('should define essential casino colors with high contrast', () => {
    expect(casinoColors.goldPrimary).toBe('#FFD700');
    expect(casinoColors.gridGreen).toBe('#00C853');
    expect(casinoColors.gridPink).toBe('#E91E63');
    expect(casinoColors.lockedRed).toBe('#D50000');
    expect(casinoColors.modalCreamBg).toBe('#FDF6E2');
  });

  it('should have chip configurations for all standard denominations', () => {
    const denominations = [2, 5, 10, 20, 30, 40, 50, 75, 100, 500] as const;
    for (const d of denominations) {
      expect(casinoColors.chips[d]).toBeDefined();
      expect(casinoColors.chips[d].bg).toBeDefined();
      expect(casinoColors.chips[d].border).toBeDefined();
    }
  });

  it('should have gold and casino bevel gradients defined', () => {
    expect(casinoGradients.goldButton).toContain('#FFD700');
    expect(casinoGradients.greenButton).toContain('#00C853');
    expect(casinoGradients.baroqueGoldFrame).toContain('#FFE57F');
  });

  it('should export MarqueeCrest component', async () => {
    const { MarqueeCrest } = await import('./components/marquee-crest');
    expect(MarqueeCrest).toBeDefined();
    expect(typeof MarqueeCrest).toBe('function');
  });
});
