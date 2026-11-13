import { fetchVapiCalls } from '../_data/vapiCalls';
import { getB2BDataset } from '@/lib/mock/b2bLeads';
import B2bCrmDashboard from './B2bCrmDashboard';

export const dynamic = 'force-dynamic';

export default async function B2bCrmDashboardPage() {
  const { leads, outreachSequences } = getB2BDataset();
  const vapiCalls = await fetchVapiCalls();
  return <B2bCrmDashboard leads={leads} outreachSequences={outreachSequences} vapiCalls={vapiCalls} />;
}
