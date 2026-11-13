import type { Lead } from '@/lib/data/b2bCrm';
import { getB2BDataset } from '@/lib/mock/b2bLeads';
import type { VapiCallLog } from '@/lib/data/vapiCalls';
import SharedVoiceCard from '../../SharedVoiceCard';
import { ShareNotFound } from '../../ShareShell';

export const dynamic = 'force-dynamic';

async function fetchLeadById(leadId: string): Promise<Lead | null> {
  return getB2BDataset().leads.find((l) => l.id === leadId) ?? null;
}

/** Digits-only tail of a phone number, for tolerant matching across formats. */
function phoneKey(value: string | null | undefined): string | null {
  if (!value) return null;
  const digits = String(value).replace(/\D/g, '');
  if (digits.length < 7) return null;
  return digits.slice(-10);
}

/**
 * The lead's most recent voice call. Primary path: the call tagged with this lead id.
 * Falls back to matching the phone number for calls
 * that were not tagged with a lead id.
 */
async function fetchLatestCallForLead(leadId: string, lead: Lead | null): Promise<VapiCallLog | null> {
  const calls = [...getB2BDataset().vapiCalls].sort((a, b) => ((a.started_at ?? '') < (b.started_at ?? '') ? 1 : -1));
  // Prefer the latest call where the lead picked up, so the page has a conversation to show.
  const mine = calls.filter((c) => c.master_leads_id === leadId);
  const answered = mine.find((c) => (c.status ?? '') === 'ended' && Boolean(c.transcript));
  if (answered) return answered;
  if (mine[0]) return mine[0];
  const keys = [phoneKey(lead?.phone), phoneKey(lead?.whatsapp_number)].filter((k): k is string => k !== null);
  if (keys.length === 0) return null;
  return (
    calls.find((c) => {
      const k = phoneKey(c.customer_phone);
      return k !== null && keys.includes(k);
    }) ?? null
  );
}

export default async function SharedVoicePage({ params }: { params: Promise<{ leadId: string }> }) {
  const { leadId: rawId } = await params;
  const leadId = decodeURIComponent(rawId);

  const lead = await fetchLeadById(leadId);
  const log = await fetchLatestCallForLead(leadId, lead);

  if (!lead || !log) {
    return <ShareNotFound title="Call not found" message={lead ? 'There is no phone call on record for this lead yet.' : 'We could not find a lead for this link. It may have been copied incorrectly.'} />;
  }

  const recordingUrl = log.recording_url ?? lead.call_recording_url ?? null;

  return <SharedVoiceCard log={log} lead={lead} recordingUrl={recordingUrl} />;
}
