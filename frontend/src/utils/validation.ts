/**
 * Validation utilities for form inputs and business rules
 */

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-()]/g, '');
  return cleaned.length >= 8 && cleaned.length <= 15;
}

export function isPositiveNumber(val: number | string): boolean {
  const n = typeof val === 'number' ? val : parseFloat(val);
  return !isNaN(n) && n > 0;
}

export function isValidGstin(gstin: string): boolean {
  if (!gstin) return true; // Optional
  // Standard Indian GSTIN regex: 2 digits state code + 10 char PAN + 1 entity code + Z + 1 check digit
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstinRegex.test(gstin.trim());
}
