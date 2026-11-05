export function passportLabel(value) {
  return String(value ?? '').trim() || 'Passport';
}
export function title(value) {
  return String(value).trim();
}
export function count(value) {
  return Math.max(0, value);
}
