import type { PartyLedgerRow } from '@/lib/data/receivables';
import { getReceivablesDataset } from '@/lib/mock/receivables';
import { fetchRecoveryOutreach } from '../_data/outreach';
import PartyActivity from './PartyActivity';

export const dynamic = 'force-dynamic';

async function fetchLedger(): Promise<PartyLedgerRow[]> {
  return [...getReceivablesDataset().ledger];
}

export default async function PartyActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const query = await searchParams;
  const party = typeof query.party === "string" ? query.party : null;
  const [ledger, outreach] = await Promise.all([fetchLedger(), fetchRecoveryOutreach()]);
  return <PartyActivity ledger={ledger} outreach={outreach} initialParty={party} />;
}
