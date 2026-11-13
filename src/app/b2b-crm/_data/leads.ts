import type { Lead } from '@/lib/data/b2bCrm';
import { getB2BDataset } from '@/lib/mock/b2bLeads';

/** Server-only fetch of every lead (sample data), newest activity first. */
export async function fetchLeads(): Promise<Lead[]> {
  return [...getB2BDataset().leads].sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
}
