import type { Lead } from '@/lib/data/b2bCrm';
import { getB2BDataset } from '@/lib/mock/b2bLeads';
import { normalizeTranscript } from '@/lib/data/transcript';
import SharedChatCard from '../../SharedChatCard';
import { ShareNotFound } from '../../ShareShell';

export const dynamic = 'force-dynamic';

async function fetchLeadByWhatsapp(phone: string): Promise<Lead | null> {
  return getB2BDataset().leads.find((l) => l.whatsapp_number === phone) ?? null;
}

export default async function SharedWhatsappPage({ params }: { params: Promise<{ phone: string }> }) {
  const { phone: rawPhone } = await params;
  const phone = decodeURIComponent(rawPhone);
  const lead = await fetchLeadByWhatsapp(phone);

  if (!lead) {
    return <ShareNotFound title="Conversation not found" message="We could not find a WhatsApp conversation for this link. It may have been copied incorrectly." />;
  }

  const entries = normalizeTranscript(lead.conversation_transcript).sort(
    (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime()
  );

  return <SharedChatCard channel="whatsapp" lead={lead} entries={entries} />;
}
