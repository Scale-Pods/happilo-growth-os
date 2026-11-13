import { fetchLeads } from '../../_data/leads';
import EmailSection from '../EmailSection';

export const dynamic = 'force-dynamic';

export default async function B2bCrmEmailAnalyticsPage() {
  const leads = await fetchLeads();
  return <EmailSection leads={leads} view="analytics" />;
}
