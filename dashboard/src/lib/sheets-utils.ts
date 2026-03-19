export function isTrue(value: any): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return ['true', 'vrai', '1'].includes(value.toLowerCase().trim());
  }
  return false;
}

export function isFalse(value: any): boolean {
  if (value === null || value === undefined || value === '') return true;
  if (typeof value === 'boolean') return !value;
  if (typeof value === 'string') {
    return ['false', 'faux', '0', ''].includes(value.toLowerCase().trim());
  }
  return false;
}
