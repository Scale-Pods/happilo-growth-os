import type { RecoveryOutreachRow } from '@/lib/data/receivables';
import { getReceivablesDataset } from '@/lib/mock/receivables';

/** Server-only fetch of every recovery outreach row (local dummy data), newest first. */
export async function fetchRecoveryOutreach(): Promise<RecoveryOutreachRow[]> {
  return [...getReceivablesDataset().outreach].sort((a, b) => ((a.updated_at ?? '') < (b.updated_at ?? '') ? 1 : -1));
}
