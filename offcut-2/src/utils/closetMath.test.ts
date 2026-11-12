import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PRODUCTS,
  N,
  computeFit,
  computeSpriteMetrics,
  computeSlotX,
  formatCounter,
  stepIndex,
  shortestTurnDelta,
  computeSpinDurationMs,
  formatDegrees,
  isFacingFront,
} from './closetMath';

test('resting rail slot centres match specification (264 to 1236 step 108)', () => {
  const expected = [264, 372, 480, 588, 696, 804, 912, 1020, 1128, 1236];
  const actual = Array.from({ length: N }, (_, k) => computeSlotX(k, -1));
  assert.deepEqual(actual, expected);
});

test('hovered garment stays at base slot while neighbours shift by +-86px', () => {
  const hov = 4; // base 696
  assert.equal(computeSlotX(4, hov), 696);
  assert.equal(computeSlotX(3, hov), 588 - 86);
  assert.equal(computeSlotX(0, hov), 264 - 86);
  assert.equal(computeSlotX(5, hov), 804 + 86);
  assert.equal(computeSlotX(9, hov), 1236 + 86);
});

test('sprite mapping matches reference values for rail garment (289x300)', () => {
  const m0 = computeSpriteMetrics(0, 289, 300);
  assert.equal(m0.bgWidth.toFixed(2), '1161.44');
  assert.equal(m0.bgHeight.toFixed(2), '769.81');
  assert.equal(m0.bgPosX.toFixed(2), '28.36');
  assert.equal(m0.bgPosY.toFixed(2), '-45.28');

  const m1 = computeSpriteMetrics(1, 289, 300);
  assert.equal(m1.bgPosX.toFixed(2), '-203.93');
  assert.equal(m1.bgPosY.toFixed(2), '-45.28');

  const m5 = computeSpriteMetrics(5, 289, 300);
  assert.equal(m5.bgPosX.toFixed(2), '28.36');
  assert.equal(m5.bgPosY.toFixed(2), '-396.23');
});

test('sprite mapping matches reference values for detail garment (473x492)', () => {
  const d0 = computeSpriteMetrics(0, 473, 492);
  assert.equal(d0.bgWidth.toFixed(2), '1900.91');
  assert.equal(d0.bgHeight.toFixed(2), '1262.49');
  assert.equal(d0.bgPosX.toFixed(2), '46.41');
  assert.equal(d0.bgPosY.toFixed(2), '-74.26');

  const d4 = computeSpriteMetrics(4, 473, 492);
  assert.equal(d4.bgPosX.toFixed(2), '-1474.32');

  const d9 = computeSpriteMetrics(9, 473, 492);
  assert.equal(d9.bgPosX.toFixed(2), '-1474.32');
  assert.equal(d9.bgPosY.toFixed(2), '-649.81');
});

test('counter formatting and wrap-around stepping', () => {
  assert.equal(formatCounter(0), '01 / 10');
  assert.equal(formatCounter(6), '07 / 10');
  assert.equal(formatCounter(9), '10 / 10');
  assert.equal(stepIndex(0, -1), 9);
  assert.equal(stepIndex(9, 1), 0);
  assert.equal(stepIndex(3, 1), 4);
});

test('artboard scaling and centring calculation', () => {
  const fit = computeFit(1440, 900);
  assert.equal(fit.k, 0.9);
  assert.equal(fit.left, 45);
  assert.equal(fit.top, 0);
});

test('all 10 German products have names and euro prices', () => {
  assert.equal(PRODUCTS.length, 10);
  for (const p of PRODUCTS) {
    assert.ok(p.name.length > 0);
    assert.match(p.price, /^€\d+$/);
  }
});

test('Spin Product shortest turn delta, duration, degree readout, and hotspot visibility', () => {
  assert.ok(Math.abs(shortestTurnDelta(0.9, 0) - 0.1) < 1e-9);
  assert.ok(Math.abs(shortestTurnDelta(0.1, 0) - -0.1) < 1e-9);
  assert.equal(computeSpinDurationMs(0.5), 1350);
  assert.equal(formatDegrees(0), '000°');
  assert.equal(formatDegrees(0.5), '180°');
  assert.equal(formatDegrees(0.25), '090°');
  assert.equal(isFacingFront(0.01, false, false, 0.005), true);
  assert.equal(isFacingFront(0.98, false, false, 0), true);
  assert.equal(isFacingFront(0.2, false, false, 0), false);
  assert.equal(isFacingFront(0, true, false, 0), false);
});

