import { describe, expect, it } from 'vitest';
import { computeConditions, type ConditionsInput } from '@/lib/conditions';
import type { Streamflow } from '@/lib/usgs';

function base(overrides: Partial<ConditionsInput>): ConditionsInput {
  return {
    feature_type: 'waterfall',
    tempF: 62,
    precipNow: 0,
    weatherCode: 0, // clear
    recentPrecipMm: 10,
    month: 5, // May — peak
    dayOfWeek: 3, // Wednesday
    isDaytime: true,
    hoursUntilSunset: 6,
    flow: null,
    ...overrides,
  };
}

function flow(percentOfNormal: number): Streamflow {
  return {
    siteName: 'Test Creek',
    siteCode: '00000000',
    distanceKm: 5,
    currentCfs: 100,
    medianCfs: 100,
    percentOfNormal,
    dateTime: '2026-05-01T12:00',
  };
}

describe('computeConditions', () => {
  it('rates a roaring, in-season waterfall highly', () => {
    const r = computeConditions(base({ flow: flow(250) }));
    expect(r.goScore).toBeGreaterThanOrEqual(80);
    expect(['Prime', 'Good']).toContain(r.verdict);
    expect(r.headline.toLowerCase()).toContain('roaring');
    expect(r.factors.find((f) => f.key === 'flow')?.status).toBe('great');
  });

  it('rates a nearly-dry, late-season waterfall low', () => {
    const r = computeConditions(base({ flow: flow(10), month: 8 }));
    expect(r.goScore).toBeLessThan(46);
    expect(r.verdict).toBe('Low');
  });

  it('flags after-dark as Caution regardless of flow', () => {
    const r = computeConditions(base({ flow: flow(250), isDaytime: false }));
    expect(r.verdict).toBe('Caution');
    expect(r.headline.toLowerCase()).toContain('dark');
  });

  it('uses recent rain as a flow proxy when no gauge is available', () => {
    const wet = computeConditions(base({ flow: null, recentPrecipMm: 60 }));
    const dry = computeConditions(base({ flow: null, recentPrecipMm: 1, month: 8 }));
    expect(wet.goScore).toBeGreaterThan(dry.goScore);
  });

  it('loves a hot spring on a cold night-ish winter day', () => {
    const r = computeConditions(
      base({ feature_type: 'hot_spring', month: 1, tempF: 34, flow: null }),
    );
    expect(r.factors.find((f) => f.key === 'season')?.status).toBe('great');
  });

  it('warns of flash-flood risk in caves after heavy rain', () => {
    const r = computeConditions(
      base({ feature_type: 'cave', recentPrecipMm: 50, flow: null }),
    );
    expect(r.verdict).toBe('Caution');
    expect(r.factors.some((f) => f.key === 'flood')).toBe(true);
  });
});
