import type { TranscriptEntry } from './b2bCrm';

/**
 * Transcripts are normally stored as an array, but an older import saved some
 * as a JSON string (sometimes wrapped twice). Unwrap until we get a real
 * array, or give up and return [].
 */
export function normalizeTranscript(value: unknown): TranscriptEntry[] {
  let current: unknown = value;
  for (let i = 0; i < 3; i++) {
    if (Array.isArray(current)) return current as TranscriptEntry[];
    if (typeof current === 'string') {
      try {
        current = JSON.parse(current);
        continue;
      } catch {
        return [];
      }
    }
    return [];
  }
  return Array.isArray(current) ? (current as TranscriptEntry[]) : [];
}
