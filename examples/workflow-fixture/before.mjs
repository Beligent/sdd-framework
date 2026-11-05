// Reproduction-only input: the original empty-label bug.
export { title, count } from './app.mjs';
export function passportLabel(value) {
  return String(value ?? '').trim();
}
