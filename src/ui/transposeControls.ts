export const TRANSPOSITION_SHIFTS = Array.from({ length: 12 }, (_, index) => index - 5);

export function wrapTransposeShift(shift: number): number {
  const wrapped = ((shift % 12) + 12) % 12;
  return wrapped > 6 ? wrapped - 12 : wrapped;
}

export function nextTransposeShift(currentShift: number, delta: number): number {
  return wrapTransposeShift(currentShift + delta);
}

export function formatTransposeShift(shift: number): string {
  if (shift === 0) return "0";
  return shift > 0 ? `+${shift}` : String(shift);
}
