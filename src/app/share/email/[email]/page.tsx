import type { Lead } from '@/lib/data/b2bCrm';
import { getB2BDataset } from '@/lib/mock/b2bLeads';
import { normalizeTranscript } from '@/lib/data/transcript';
import SharedChatCard from '../../SharedChatCard';
import { ShareNotFound } from '../../ShareShell';

export const dynamic = 'force-dynamic';

async function fetchLeadByEmail(email: string): Promise<Lead | null> {
  return getB2BDataset().leads.find((l) => (l.email ?? '').toLowerCase() === email.toLowerCase()) ?? null;
}

export default async function SharedEmailPage({ params }: { params: Promise<{ email: string }> }) {
  const { email: rawEmail } = await params;
  const email = decodeURIComponent(rawEmail);
  const lead = await fetchLeadByEmail(email);

  if (!lead) {
    return <ShareNotFound title="Conversation not found" message="We could not find an email conversation for this link. It may have been copied incorrectly." />;
  }

  const entries = normalizeTranscript(lead.conversation_transcript_email).sort(
    (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime()
  );

  return <SharedChatCard channel="email" lead={lead} entries={entries} />;
}
