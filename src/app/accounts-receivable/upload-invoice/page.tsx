import type { PartyLedgerRow } from '@/lib/data/receivables';
import { getReceivablesDataset } from '@/lib/mock/receivables';
import UploadInvoiceClient from './UploadInvoiceClient';

export const dynamic = 'force-dynamic';

async function fetchLedger(): Promise<PartyLedgerRow[]> {
  return [...getReceivablesDataset().ledger].sort((a, b) => ((a.created_at ?? '') < (b.created_at ?? '') ? 1 : -1));
}

export default async function UploadInvoicePage() {
  const rows = await fetchLedger();
  return <UploadInvoiceClient rows={rows} />;
}
