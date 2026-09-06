/**
 * utils/phone.js — normalize Ghanaian phone numbers to E.164 (+233XXXXXXXXX).
 */

export function normalizeGhanaPhone(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const digits = raw.replace(/[^\d+]/g, '');

  if (/^\+233\d{9}$/.test(digits)) return digits;
  if (/^233\d{9}$/.test(digits)) return `+${digits}`;
  if (/^0\d{9}$/.test(digits)) return `+233${digits.slice(1)}`;
  if (/^\d{9}$/.test(digits)) return `+233${digits}`;

  return null;
}
