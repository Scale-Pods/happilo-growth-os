import type { Lead } from '@/lib/data/b2bCrm';
import { getB2BDataset } from '@/lib/mock/b2bLeads';
import LeadsTable from './LeadsTable';

export const dynamic = 'force-dynamic';

async function fetchLeads(): Promise<Lead[]> {
  return [...getB2BDataset().leads].sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
}

export default async function LeadsPage() {
  const leads = await fetchLeads();
  const { vapiCalls, outreachSequences } = getB2BDataset();
  return <LeadsTable initialLeads={leads} calls={vapiCalls} sequences={outreachSequences} />;
}
