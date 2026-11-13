import type { Lead } from '@/lib/data/b2bCrm';
import { getB2BDataset } from '@/lib/mock/b2bLeads';
import ScraperClient from './ScraperClient';

export const dynamic = 'force-dynamic';

async function fetchScrapedLeads(): Promise<Lead[]> {
  return getB2BDataset()
    .leads.filter((l) => l.lead_source === 'google_maps')
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

export default async function ScraperPage() {
  const leads = await fetchScrapedLeads();
  return <ScraperClient initialLeads={leads} />;
}
