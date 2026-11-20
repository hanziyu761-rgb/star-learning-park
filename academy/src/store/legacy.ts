import type { Grade } from '../curriculum/types';

// READ-ONLY access to the legacy 星星闯关乐园 data. The academy only reads the
// grade the family already chose there, as a suggestion. It never writes here.
export const LEGACY_KEY = 'star-adventure-v4';

export function readLegacyGrade(storage: Pick<Storage, 'getItem'> | undefined = globalThis.localStorage): Grade | null {
  try {
    const raw = storage?.getItem(LEGACY_KEY);
    if (!raw) return null;
    const grade = Number(JSON.parse(raw)?.grade);
    return grade >= 1 && grade <= 6 && Number.isInteger(grade) ? (grade as Grade) : null;
  } catch {
    return null;
  }
}
