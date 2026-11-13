import type { PartyLedgerRow } from '@/lib/data/receivables';
import { getReceivablesDataset } from '@/lib/mock/receivables';
import { fetchRecoveryOutreach } from '../_data/outreach';
import ReceivablesDashboard from './ReceivablesDashboard';

export const dynamic = 'force-dynamic';

async function fetchLedger(): Promise<PartyLedgerRow[]> {
  return [...getReceivablesDataset().ledger].sort((a, b) => ((a.created_at ?? '') < (b.created_at ?? '') ? 1 : -1));
}

export default async function AccountsReceivableDashboardPage() {
  const [ledger, outreach] = await Promise.all([fetchLedger(), fetchRecoveryOutreach()]);
  return <ReceivablesDashboard ledger={ledger} outreach={outreach} />;
}
