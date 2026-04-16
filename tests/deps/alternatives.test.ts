import { describe, it, expect } from 'vitest';
import { getAlternative, ALTERNATIVES } from '../../src/modules/deps/alternatives';

describe('getAlternative', () => {
  it('returns suggestion for known heavy packages', () => {
    const alt = getAlternative('moment');
    expect(alt).toBeDefined();
    expect(alt?.suggestion).toContain('dayjs');
  });

  it('returns suggestion for lodash', () => {
    const alt = getAlternative('lodash');
    expect(alt).toBeDefined();
    expect(alt?.size).toBe('71KB');
  });

  it('returns undefined for unknown packages', () => {
    expect(getAlternative('some-unknown-package-xyz')).toBeUndefined();
  });

  it('is case-insensitive', () => {
    expect(getAlternative('Moment')).toBeDefined();
    expect(getAlternative('LODASH')).toBeDefined();
  });

  it('has at least 10 entries in the static list', () => {
    expect(Object.keys(ALTERNATIVES).length).toBeGreaterThanOrEqual(10);
  });
});
