// Boundary input validation shared by create-order (and mirrored by the
// frontend's own lib/validation.ts for instant client-side feedback — this
// copy is the one that actually gets enforced, since the browser's copy
// can never be trusted).
export const PHONE_REGEX = /^[6-9]\d{9}$/; // strict 10-digit Indian mobile number
export const PINCODE_REGEX = /^\d{6}$/;

export function isValidPhone(value: string): boolean {
  return PHONE_REGEX.test(value);
}

export function isValidPincode(value: string): boolean {
  return PINCODE_REGEX.test(value);
}
