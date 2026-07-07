import { describe, expect, it } from 'vitest';
import { haversineKm, isReportFresh, slugify } from '@/lib/geo';

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('Hanging Lake Falls', 'CO')).toBe('hanging-lake-falls-co');
  });
  it('strips diacritics and punctuation', () => {
    expect(slugify("Ojo Caliente's Spring!", 'NM')).toBe('ojo-caliente-s-spring-nm');
  });
  it('works without a state code', () => {
    expect(slugify('Some Cave')).toBe('some-cave');
  });
});

describe('haversineKm', () => {
  it('computes known distance (Denver to Boulder ~ 39km)', () => {
    const d = haversineKm(39.7392, -104.9903, 40.015, -105.2705);
    expect(d).toBeGreaterThan(35);
    expect(d).toBeLessThan(45);
  });
  it('is zero for identical points', () => {
    expect(haversineKm(10, 10, 10, 10)).toBe(0);
  });
});

describe('isReportFresh', () => {
  it('treats a recent report as fresh', () => {
    expect(isReportFresh(new Date(Date.now() - 24 * 3600 * 1000).toISOString())).toBe(true);
  });
  it('treats an old report as stale', () => {
    expect(isReportFresh(new Date(Date.now() - 200 * 24 * 3600 * 1000).toISOString())).toBe(false);
  });
});
