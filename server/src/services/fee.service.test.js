import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeBalance } from './fee.service.js';

test('balance is total charged minus validated payments only', () => {
  const account = {
    totalCharged: 500,
    payments: [
      { amount: 200, validated: true },
      { amount: 100, validated: false },
    ],
  };
  assert.equal(computeBalance(account), 300);
});

test('balance never goes negative on overpayment', () => {
  const account = {
    totalCharged: 100,
    payments: [{ amount: 150, validated: true }],
  };
  assert.equal(computeBalance(account), 0);
});

test('balance equals full charge with no payments', () => {
  assert.equal(computeBalance({ totalCharged: 300, payments: [] }), 300);
});

test('missing account has zero balance', () => {
  assert.equal(computeBalance(null), 0);
});
