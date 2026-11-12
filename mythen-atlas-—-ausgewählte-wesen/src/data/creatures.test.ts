import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DINOS,
  pct,
  getEraMetrics,
  clamp01,
  inCubic,
  outCubic,
  outBack,
  dampFactor,
  findCreatureIndexByQuery,
} from './creatures';

test('DINOS contains Phoenix and Kraken in German with exact asset URLs', () => {
  assert.equal(DINOS.length, 2);
  assert.equal(DINOS[0].id, 'phoenix');
  assert.equal(DINOS[0].name, 'Phönix');
  assert.equal(DINOS[0].no, 'MA-001');
  assert.equal(DINOS[1].id, 'kraken');
  assert.equal(DINOS[1].name, 'Krake');
  assert.equal(DINOS[1].no, 'MA-002');
  assert.ok(DINOS[0].model.endsWith('.glb'));
  assert.ok(DINOS[1].model.endsWith('.glb'));
});

test('era timeline percentage and alignment math works accurately', () => {
  assert.equal(pct(-800), 0);
  assert.equal(pct(1900), 100);
  const phoenixEra = getEraMetrics(DINOS[0].era);
  assert.equal(phoenixEra.left, 0);
  assert.equal(phoenixEra.alignLeft, true);
  assert.ok(phoenixEra.width > 13 && phoenixEra.width < 14);

  const krakenEra = getEraMetrics(DINOS[1].era);
  assert.equal(krakenEra.alignLeft, false);
  assert.ok(krakenEra.left > 70);
  assert.ok(krakenEra.width > 20);
});

test('animation curves and damping helpers follow spec formulas', () => {
  assert.equal(inCubic(0), 0);
  assert.equal(inCubic(1), 1);
  assert.equal(outCubic(0), 0);
  assert.equal(outCubic(1), 1);
  assert.equal(outBack(1), 1);
  assert.ok(outBack(0.6) > 1); // spring overshoot
  assert.equal(clamp01(-0.5), 0);
  assert.equal(clamp01(1.5), 1);

  const f = dampFactor(0.016, 6);
  assert.ok(f > 0 && f < 1);
  // dt is capped at 0.05s
  assert.equal(dampFactor(0.2, 6), dampFactor(0.05, 6));
});

test('findCreatureIndexByQuery matches German names, tags, and regions', () => {
  assert.equal(findCreatureIndexByQuery('Phönix'), 0);
  assert.equal(findCreatureIndexByQuery('ägypten'), 0);
  assert.equal(findCreatureIndexByQuery('Krake'), 1);
  assert.equal(findCreatureIndexByQuery('norwegen'), 1);
  assert.equal(findCreatureIndexByQuery('unbekannt'), -1);
});
