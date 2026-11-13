import { fetchLeads } from '../../_data/leads';
import { fetchVapiCalls } from '../../_data/vapiCalls';
import VoiceSection from '../VoiceSection';

export const dynamic = 'force-dynamic';

export default async function B2bCrmVoiceAnalyticsPage() {
  const [leads, logs] = await Promise.all([fetchLeads(), fetchVapiCalls()]);
  return <VoiceSection logs={logs} leads={leads} view="analytics" />;
}
