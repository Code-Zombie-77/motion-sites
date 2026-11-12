import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeArcParams,
  rel,
  B,
  F,
  scl,
  xsc,
  smoothstep,
  computeBookFrame,
  interpolateTimelineYear,
  yearToTimelineLeft,
  findNearestBookTarget,
  toWin1252Escaped,
} from './arcMath';

test('rel maps virtual index difference into [-18, 18)', () => {
  assert.equal(rel(17, 17), 0);
  assert.equal(rel(18, 17), 1);
  assert.equal(rel(16, 17), -1);
  assert.equal(rel(35, 0), -1);
  assert.equal(rel(18, 0), -18);
});

test('B(r) pushes neighbours smoothly and clamps at ±0.5 outside (-1, 1)', () => {
  assert.equal(B(0), 0);
  assert.equal(B(1), 0.5);
  assert.equal(B(-1), -0.5);
  assert.equal(B(2.5), 0.5);
  assert.equal(B(-3), -0.5);
  assert.ok(B(0.5) > 0.25 && B(0.5) < 0.5);
});

test('computeBookFrame produces 90deg open cover at r=0 and hides far books', () => {
  const params = computeArcParams(400, false);
  const center = computeBookFrame(0, 0, 1, 0, 0, params);
  assert.equal(center.visible, true);
  assert.equal(center.o, 1);
  assert.equal(center.rotateY, -90);
  assert.equal(center.coverShade, 0);
  assert.equal(center.z, 40); // o * H * 0.1

  const far = computeBookFrame(17, 0, 1, 0, 0, params);
  assert.equal(far.visible, false);
});

test('timeline year interpolation and wrap behavior', () => {
  const years = [1774, 1816, 1888, 1895, 1912, 1915, 1942, 1957, 1963, 1972, 1985, 2005];
  assert.equal(interpolateTimelineYear(17, years), 1915); // index 5
  assert.equal(interpolateTimelineYear(17.5, years), (1915 + 1942) / 2);
  // Wrap at index 11 -> 0
  assert.equal(interpolateTimelineYear(11.2, years), 2005);
  assert.equal(interpolateTimelineYear(11.8, years), 1774);
  assert.equal(yearToTimelineLeft(1770), 0);
  assert.equal(yearToTimelineLeft(2030), 1);
  assert.equal(findNearestBookTarget(17, 1915, years), 17);
  assert.equal(findNearestBookTarget(17, 1774, years), 12);
});

test('Windows-1252 PDF string encoding maps German umlauts and quotes accurately', () => {
  const encoded = toWin1252Escaped('Bücher & „Größe“ – € (Test)');
  assert.ok(encoded.includes('\\(Test\\)'));
  // ü is 0xFC (252), ß is 0xDF (223), „ is 0x84 (132), “ is 0x93 (147), – is 0x96 (150), € is 0x80 (128)
  assert.equal(encoded.charCodeAt(1), 0xfc);
  assert.ok([...encoded].some((ch) => ch.charCodeAt(0) === 0x84));
  assert.ok([...encoded].some((ch) => ch.charCodeAt(0) === 0x80));
});
