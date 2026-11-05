import test from 'node:test';
import assert from 'node:assert/strict';
const app = await import(process.env.BELIGENT_FIXTURE_MODULE || './app.mjs');

test('empty passport label defaults to Passport', () => {
  assert.equal(app.passportLabel('   '), 'Passport');
  assert.equal(app.passportLabel(' Example '), 'Example');
});
test('shared spec AC-001 trims titles', () => {
  assert.equal(app.title(' Task '), 'Task');
});
test('shared spec AC-002 clamps negative counts', () => {
  assert.equal(app.count(-1), 0);
  assert.equal(app.count(3), 3);
});
