import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeAggregate, letterGrade } from './grade.service.js';

test('aggregate weights exam 70% and CA 30%', () => {
  assert.equal(computeAggregate({ caScore: 20, examScore: 60 }), 48);
});

test('aggregate is null when either score is missing', () => {
  assert.equal(computeAggregate({ caScore: 20, examScore: null }), null);
  assert.equal(computeAggregate({ caScore: null, examScore: 60 }), null);
});

test('letter grade bands', () => {
  assert.equal(letterGrade(85), 'A');
  assert.equal(letterGrade(72), 'B');
  assert.equal(letterGrade(65), 'C');
  assert.equal(letterGrade(55), 'D');
  assert.equal(letterGrade(42), 'E');
  assert.equal(letterGrade(30), 'F');
  assert.equal(letterGrade(null), null);
});
