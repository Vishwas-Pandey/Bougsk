export function isValidPhone(value: string): boolean {
  return /^[6-9]\d{9}$/.test(value.trim());
}

export function isValidPincode(value: string): boolean {
  return /^\d{6}$/.test(value.trim());
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
