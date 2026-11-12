import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clamp,
  easeInOutQuad,
  computeScrollProgress,
  computeTargetVideoTime,
  stepVideoTime,
  computeHeadlineState,
  computeScrollCueState,
  computeProcessListState,
  computeRecorderProgress,
} from './scrollMath';

test('clamp restricts values within [min, max]', () => {
  assert.equal(clamp(-0.5, 0, 1), 0);
  assert.equal(clamp(0.4, 0, 1), 0.4);
  assert.equal(clamp(1.8, 0, 1), 1);
});

test('easeInOutQuad returns 0 at 0, 0.5 at 0.5, and 1 at 1', () => {
  assert.equal(easeInOutQuad(0), 0);
  assert.equal(easeInOutQuad(0.5), 0.5);
  assert.equal(easeInOutQuad(1), 1);
});

test('computeScrollProgress calculates normalized scroll progress correctly', () => {
  // 420vh track at 1000px innerHeight => 4200px total, 3200px scrollable
  assert.equal(computeScrollProgress(0, 0, 4200, 1000), 0);
  assert.equal(computeScrollProgress(1600, 0, 4200, 1000), 0.5);
  assert.equal(computeScrollProgress(3200, 0, 4200, 1000), 1);
  assert.equal(computeScrollProgress(4000, 0, 4200, 1000), 1);
});

test('computeTargetVideoTime maps p to duration - 1/48', () => {
  const duration = 5.04;
  assert.equal(computeTargetVideoTime(0, duration), 0);
  const full = computeTargetVideoTime(1, duration);
  assert.ok(Math.abs(full - (5.04 - 1 / 48)) < 1e-6);
});

test('stepVideoTime interpolates by 0.2 or jumps on reducedMotion', () => {
  assert.ok(Math.abs(stepVideoTime(0, 1, false) - 0.2) < 1e-6);
  assert.equal(stepVideoTime(0, 1, true), 1);
});

test('computeHeadlineState tilts back and fades out between p .10 and .24', () => {
  const start = computeHeadlineState(0);
  assert.equal(start.h, 0);
  assert.equal(start.opacity, 1);
  assert.equal(start.rotateXDeg, 0);

  const midFade = computeHeadlineState(0.17);
  assert.ok(Math.abs(midFade.opacity - 0.5) < 1e-6);

  const afterHeadline = computeHeadlineState(0.38);
  assert.equal(afterHeadline.h, 1);
  assert.equal(afterHeadline.opacity, 0);
  assert.equal(afterHeadline.translateYVh, -34);
  assert.equal(afterHeadline.rotateXDeg, 62);
  assert.ok(Math.abs(afterHeadline.scale - 0.88) < 1e-6);
});

test('computeScrollCueState drains underline by p .10 and fades between .04 and .12', () => {
  const s0 = computeScrollCueState(0);
  assert.equal(s0.underlineScale, 1);
  assert.equal(s0.opacity, 1);

  const sMid = computeScrollCueState(0.08);
  assert.ok(Math.abs(sMid.underlineScale - 0.2) < 1e-6);
  assert.ok(Math.abs(sMid.opacity - 0.5) < 1e-6);

  const sEnd = computeScrollCueState(0.12);
  assert.equal(sEnd.underlineScale, 0);
  assert.equal(sEnd.opacity, 0);
});

test('computeProcessListState rises 40px between .08 and .24 and switches step at .62', () => {
  const before = computeProcessListState(0.05);
  assert.equal(before.opacity, 0);
  assert.equal(before.translateYPx, 40);
  assert.equal(before.activeStepIndex, 0);

  const visibleStep1 = computeProcessListState(0.30);
  assert.equal(visibleStep1.opacity, 1);
  assert.equal(visibleStep1.translateYPx, 0);
  assert.equal(visibleStep1.activeStepIndex, 0);

  const visibleStep2 = computeProcessListState(0.65);
  assert.equal(visibleStep2.opacity, 1);
  assert.equal(visibleStep2.activeStepIndex, 1);

  const manualStep3 = computeProcessListState(0.65, 2);
  assert.equal(manualStep3.activeStepIndex, 2);
});

test('computeRecorderProgress follows 0.55s hold, 5.04s linear glide, then hold', () => {
  assert.equal(computeRecorderProgress(0.2), 0);
  assert.equal(computeRecorderProgress(0.55), 0);
  assert.ok(Math.abs(computeRecorderProgress(0.55 + 2.52) - 0.5) < 1e-6);
  assert.equal(computeRecorderProgress(5.59), 1);
  assert.equal(computeRecorderProgress(6.4), 1);
});
