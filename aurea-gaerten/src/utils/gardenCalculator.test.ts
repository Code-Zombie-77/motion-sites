import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateGardenEstimate,
  validateInquiryForm,
  GERMAN_REGIONS,
} from './gardenCalculator';

test('calculateGardenEstimate returns accurate German hardiness zone and metrics for Munich Naturgarten', () => {
  const result = calculateGardenEstimate('munich', 'naturgarten', 180);
  assert.equal(result.region.label, 'München');
  assert.ok(result.hardinessZone.includes('Zone 6b'));
  assert.equal(result.areaSqm, 180);
  assert.ok(result.nativeSpeciesCount >= 40);
  assert.ok(result.estimatedWeeks >= 6);
  assert.ok(result.estimatedBudgetEur.max > result.estimatedBudgetEur.min);
  assert.deepEqual(result.signaturePlants, GERMAN_REGIONS.munich.signaturePlants);
});

test('calculateGardenEstimate clamps areaSqm within realistic bounds', () => {
  const small = calculateGardenEstimate('berlin', 'rooftop_sanctuary', 5);
  assert.equal(small.areaSqm, 25);

  const large = calculateGardenEstimate('hamburg', 'villa_estate', 9000);
  assert.equal(large.areaSqm, 2500);
});

test('validateInquiryForm rejects empty or invalid email inputs and accepts valid German garden inquiries', () => {
  const invalid = validateInquiryForm({
    name: 'A',
    email: 'not-an-email',
    city: '',
    notes: '',
  });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.name);
  assert.ok(invalid.errors.email);
  assert.ok(invalid.errors.city);

  const valid = validateInquiryForm({
    name: 'Dr. Lukas Weber',
    email: 'lukas.weber@muenchen-estate.de',
    city: '81679 München (Bogenhausen)',
    notes: 'Perennial courtyard renovation with Jura limestone terrace.',
  });
  assert.equal(valid.valid, true);
  assert.equal(Object.keys(valid.errors).length, 0);
});
