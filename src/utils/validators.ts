/**
 * Validates that an email string contains a "@" character followed by a domain
 * with at least one "." character, with non-empty parts before "@", between "@"
 * and ".", and after ".".
 */
export function validateEmail(email: string): boolean {
  const atIndex = email.indexOf('@');
  if (atIndex <= 0) return false;

  const domain = email.slice(atIndex + 1);
  const dotIndex = domain.indexOf('.');
  if (dotIndex <= 0) return false;

  const afterDot = domain.slice(dotIndex + 1);
  if (afterDot.length === 0) return false;

  // Ensure there's no second "@" in the string
  if (email.indexOf('@', atIndex + 1) !== -1) return false;

  return true;
}

/**
 * Validates that a numeric value falls within the inclusive range [min, max].
 */
export function validateNumericRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Validates that a value is not empty, null, or undefined.
 * For strings, trims whitespace before checking.
 */
export function validateRequired(value: string | number | null | undefined): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
}

/**
 * Validates that a pace string matches the mm:ss format where mm is a
 * non-negative number and ss is between 0 and 59.
 */
export function validatePaceFormat(pace: string): boolean {
  const match = pace.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return false;

  const minutes = parseInt(match[1], 10);
  const seconds = parseInt(match[2], 10);

  if (minutes < 0) return false;
  if (seconds < 0 || seconds > 59) return false;

  return true;
}

/**
 * Validates that a password has a minimum length of 6 characters.
 */
export function validatePassword(password: string): boolean {
  return password.length >= 6;
}
