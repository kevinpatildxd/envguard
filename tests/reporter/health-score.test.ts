import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calcHealthScore, printHealthScore } from '../../src/reporter';

describe('calcHealthScore', () => {
  it('returns 100 when no errors or warnings', () => {
    expect(calcHealthScore(0, 0)).toBe(100);
  });

  it('deducts 10 per error', () => {
    expect(calcHealthScore(1, 0)).toBe(90);
    expect(calcHealthScore(3, 0)).toBe(70);
  });

  it('deducts 3 per warning', () => {
    expect(calcHealthScore(0, 1)).toBe(97);
    expect(calcHealthScore(0, 5)).toBe(85);
  });

  it('combines errors and warnings', () => {
    expect(calcHealthScore(2, 4)).toBe(68);
  });

  it('floors at 0, never goes negative', () => {
    expect(calcHealthScore(15, 20)).toBe(0);
    expect(calcHealthScore(100, 100)).toBe(0);
  });

  it('is exactly 80 at the green threshold', () => {
    expect(calcHealthScore(2, 0)).toBe(80);
  });

  it('is exactly 50 at the yellow threshold', () => {
    expect(calcHealthScore(5, 0)).toBe(50);
  });
});

describe('printHealthScore', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('prints without throwing for any input', () => {
    expect(() => printHealthScore(0, 0)).not.toThrow();
    expect(() => printHealthScore(3, 5)).not.toThrow();
    expect(() => printHealthScore(20, 20)).not.toThrow();
  });

  it('calls console.log at least once', () => {
    printHealthScore(1, 2);
    expect(console.log).toHaveBeenCalled();
  });
});
