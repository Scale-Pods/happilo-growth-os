import type { VapiCallLog } from '@/lib/data/vapiCalls';
import { getB2BDataset } from '@/lib/mock/b2bLeads';

/** Server-only fetch of every voice-call row (sample data), newest first. */
export async function fetchVapiCalls(): Promise<VapiCallLog[]> {
  return [...getB2BDataset().vapiCalls].sort((a, b) => ((a.created_at ?? '') < (b.created_at ?? '') ? 1 : -1));
}
