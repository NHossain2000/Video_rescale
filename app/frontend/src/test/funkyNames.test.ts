import { describe, it, expect } from 'vitest';
import { generateFunkyName, isValidFunkyName, ADJECTIVES, NOUNS } from '../lib/funkyNames';

describe('funkyNames generator', () => {
  it('generates a valid alias conforming to dictionary words', () => {
    for (let i = 0; i < 25; i++) {
      const name = generateFunkyName();
      expect(typeof name).toBe('string');
      expect(isValidFunkyName(name)).toBe(true);

      const parts = name.split(' ');
      expect(ADJECTIVES).toContain(parts[0]);
      expect(NOUNS).toContain(parts[1]);

      if (parts[2]) {
        const num = Number(parts[2]);
        expect(num).toBeGreaterThanOrEqual(1);
        expect(num).toBeLessThanOrEqual(99);
      }
    }
  });

  it('rejects malicious or out-of-vocabulary names', () => {
    expect(isValidFunkyName('')).toBe(false);
    expect(isValidFunkyName('John Doe')).toBe(false);
    expect(isValidFunkyName('<script>alert(1)</script>')).toBe(false);
    expect(isValidFunkyName('Sweaty')).toBe(false); // only 1 word
    expect(isValidFunkyName('Sweaty Waffle 1000')).toBe(false); // number > 99
  });
});
