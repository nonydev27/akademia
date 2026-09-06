import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeGhanaPhone } from './phone.js';

test('normalizes local 0-prefixed numbers', () => {
  assert.equal(normalizeGhanaPhone('0244123456'), '+233244123456');
});

test('normalizes bare 9-digit numbers', () => {
  assert.equal(normalizeGhanaPhone('244123456'), '+233244123456');
});

test('normalizes 233-prefixed numbers without +', () => {
  assert.equal(normalizeGhanaPhone('233244123456'), '+233244123456');
});

test('passes through already-E.164 numbers', () => {
  assert.equal(normalizeGhanaPhone('+233244123456'), '+233244123456');
});

test('strips spaces and dashes', () => {
  assert.equal(normalizeGhanaPhone('024 412-3456'), '+233244123456');
});

test('rejects invalid numbers', () => {
  assert.equal(normalizeGhanaPhone('12345'), null);
  assert.equal(normalizeGhanaPhone(''), null);
  assert.equal(normalizeGhanaPhone(null), null);
});
