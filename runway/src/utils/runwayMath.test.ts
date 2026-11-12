import test from 'node:test';
import assert from 'node:assert/strict';
import {
  wrapN,
  shortestDelta,
  normalizeWheelDelta,
  computeWheelTarget,
  resolveWheelSnapTarget,
  computeRingSlot,
  computeClassicSlot,
  stepSpring,
  validateCatalog,
  sanitizeBagEntries,
  addBagItems,
  formatShortlistText,
} from './runwayMath';
import { NATIVE_CATALOG } from '../data/catalog';

test('wrapN and shortestDelta handle positive and negative ring indices', () => {
  assert.equal(wrapN(-1, 6), 5);
  assert.equal(wrapN(6, 6), 0);
  assert.equal(shortestDelta(0, 5, 6), -1);
  assert.equal(shortestDelta(5, 0, 6), 1);
  assert.equal(shortestDelta(1, 4, 6), 3);
});

test('mouse wheel spin helpers continuously advance target and snap cleanly', () => {
  const d = normalizeWheelDelta(0, 100, 0);
  assert.equal(d, 100);
  const t = computeWheelTarget(0, 100, 200);
  assert.equal(t, 0.5);
  // Single gentle wheel notch snaps forward 1 look
  assert.equal(resolveWheelSnapTarget(0, 0.25, 50), 1);
  // Reverse wheel notch snaps backward 1 look
  assert.equal(resolveWheelSnapTarget(0, -0.25, -50), -1);
  // Continuous multi-look scroll snaps to nearest look
  assert.equal(resolveWheelSnapTarget(0, 2.8, 560), 3);
});

test('computeRingSlot matches specification table at front and adjacent slots', () => {
  const W = 1000;
  const H = 800;
  const frontMoving = computeRingSlot(0, 0, W, H, 1.08, false, false, 12);
  assert.ok(Math.abs(frontMoving.scale - 1.08) < 0.001);
  assert.ok(Math.abs(frontMoving.x - 500) < 0.1);
  assert.equal(frontMoving.blur, 0);
  assert.equal(frontMoving.opacity, 1);
  assert.equal(frontMoving.z, 1080);

  // At rest (`still=true`), front slot opacity drops to 0 because hero replaces it
  const frontStill = computeRingSlot(0, 0, W, H, 1.08, false, true, 12);
  assert.equal(frontStill.opacity, 0);

  // Slot +1
  const slot1 = computeRingSlot(1, 0, W, H, 1.08, false, false, 12);
  assert.ok(Math.abs(slot1.scale - 0.952) < 0.005);
  assert.ok(Math.abs(slot1.x - 795) < 2);
  assert.ok(Math.abs(slot1.blur - 1.8) < 0.01);
});

test('computeClassicSlot places phone diagonal queue accurately', () => {
  const W = 390;
  const H = 844;
  const s0 = computeClassicSlot(0, 0, 0, false, W, H, true, false);
  assert.ok(Math.abs(s0.x - 0.3 * W) < 0.1);
  assert.equal(s0.bottom, 22);
  assert.equal(s0.scale, 1);

  const s1 = computeClassicSlot(1, 1, 1, false, W, H, true, false);
  assert.ok(Math.abs(s1.x - 0.62 * W) < 0.1);
  assert.equal(s1.bottom, 44);
  assert.ok(Math.abs(s1.scale - 0.76) < 0.001);
});

test('stepSpring converges smoothly without overshoot', () => {
  let cur = -1.15;
  let vel = 0;
  let settled = false;
  for (let i = 0; i < 120; i++) {
    const res = stepSpring(cur, vel, 0, 1 / 60, 95);
    cur = res.cur;
    vel = res.vel;
    settled = res.settled;
    if (settled) break;
  }
  assert.equal(settled, true);
  assert.equal(cur, 0);
});

test('styling bag validation, adding variants, quantity cap, and German shortlist export work', () => {
  const cat = validateCatalog(NATIVE_CATALOG);
  assert.equal(cat.items.length, 8);

  const sanitized = sanitizeBagEntries([
    { id: 57015167025457, quantity: 2 },
    { id: 'bad', quantity: 1 },
    { id: 123, quantity: 99 },
  ]);
  assert.equal(sanitized.length, 1);

  const bag1 = addBagItems([], [{ id: 57015167025457, quantity: 1 }], cat);
  assert.equal(bag1.length, 1);
  assert.equal(bag1[0].quantity, 1);

  const bag2 = addBagItems(bag1, [{ id: 57015167025457, quantity: 1 }], cat);
  assert.equal(bag2.length, 1);
  assert.equal(bag2[0].quantity, 2);

  const txt = formatShortlistText(bag2, cat);
  assert.ok(txt.includes('RUNWAY — DEINE STYLING-MERKLISTE'));
  assert.ok(txt.includes('Air Jordan 12 Retro · Größe 40 · Anzahl 2'));
});
