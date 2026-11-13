import { fetchLeads } from '../../_data/leads';
import WhatsappSection from '../WhatsappSection';

export const dynamic = 'force-dynamic';

export default async function B2bCrmWhatsappDashboardPage() {
  const leads = await fetchLeads();
  return <WhatsappSection leads={leads} view="dashboard" />;
}
