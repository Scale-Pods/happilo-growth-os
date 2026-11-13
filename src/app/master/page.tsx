import { getB2BDataset } from '@/lib/mock/b2bLeads';
import MasterDashboard from './MasterDashboard';

export const dynamic = 'force-dynamic';

export default async function MasterDashboardPage() {
  const { leads, whatsappLogs, emailLogs } = getB2BDataset();
  const b2bCrm = {
    leads,
    whatsappLogs: [...whatsappLogs].sort((a, b) => (a.created_at < b.created_at ? 1 : -1)),
    emailLogs: [...emailLogs].sort((a, b) => (a.created_at < b.created_at ? 1 : -1)),
  };
  return <MasterDashboard b2bCrm={b2bCrm} />;
}
