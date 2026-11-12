import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SINK,
  RISE,
  DEPTH,
  clamp,
  smooth,
  stepAnimationFrame,
  calculateGermanSolarYield,
  isValidGermanPlz,
} from './lumenMath';

test('clamp constrains values to [a, b]', () => {
  assert.equal(clamp(-0.5), 0);
  assert.equal(clamp(0.5), 0.5);
  assert.equal(clamp(1.5), 1);
  assert.equal(clamp(5, 2, 4), 4);
});

test('smooth computes Hermite interpolation accurately', () => {
  assert.equal(smooth(0, 100, 0), 0);
  assert.equal(smooth(0, 100, 50), 0.5);
  assert.equal(smooth(0, 100, 100), 1);
});

test('stepAnimationFrame sinks to DEPTH at SINK and triggers house swap', () => {
  const midSink = stepAnimationFrame({
    d: SINK / 2,
    animating: true,
    from: 1,
    target: 0,
    k: 1,
    swapped: false,
  });
  assert.equal(midSink.justSwapped, false);
  assert.ok(Math.abs(midSink.y - DEPTH * 0.5) < 1e-6);

  const atSwap = stepAnimationFrame({
    d: SINK,
    animating: true,
    from: 1,
    target: 0,
    k: 1,
    swapped: false,
  });
  assert.equal(atSwap.justSwapped, true);
  assert.equal(atSwap.swapped, true);
  assert.ok(Math.abs(atSwap.y - DEPTH) < 1e-6);
  assert.ok(atSwap.s > 0.95);
});

test('stepAnimationFrame settles to target state at SINK + RISE', () => {
  const end = stepAnimationFrame({
    d: SINK + RISE,
    animating: true,
    from: 1,
    target: 0,
    k: 0.2,
    swapped: true,
  });
  assert.equal(end.done, true);
  assert.equal(end.y, 0);
  assert.equal(end.s, 0);
  assert.equal(end.dip, 0);
  assert.equal(end.k, 0);
  assert.equal(end.k2, 0);
});

test('calculateGermanSolarYield computes higher yield in Bayern than Norddeutschland', () => {
  const bayern = calculateGermanSolarYield({
    regionId: 'by',
    roofAreaSqm: 70,
    baseUsageKwh: 4500,
    hasHeatPump: true,
    hasWallbox: false,
  });
  const nord = calculateGermanSolarYield({
    regionId: 'ni',
    roofAreaSqm: 70,
    baseUsageKwh: 4500,
    hasHeatPump: true,
    hasWallbox: false,
  });
  assert.ok(bayern.annualYieldKwh > nord.annualYieldKwh);
  assert.equal(bayern.sevenYearGuaranteeEur, bayern.annualSavingsEur * 7);
});

test('isValidGermanPlz validates 5-digit German postal codes', () => {
  assert.equal(isValidGermanPlz('80331'), true);
  assert.equal(isValidGermanPlz('01067'), true);
  assert.equal(isValidGermanPlz('00123'), false);
  assert.equal(isValidGermanPlz('1234'), false);
  assert.equal(isValidGermanPlz('ABCDE'), false);
});
