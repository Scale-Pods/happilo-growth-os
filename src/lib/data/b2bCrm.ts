/**
 * Happilo B2B CRM types and display helpers. Data comes from the local sample
 * dataset in src/lib/mock.
 */

export const STAGE_ORDER = ['lead_generated', 'contacted', 'interested', 'sample_sent', 'demo_booked', 'negotiation', 'won', 'lost'] as const;

const STAGE_LABELS: Record<string, string> = {
  lead_generated: 'New lead',
  contacted: 'Contacted',
  interested: 'Interested',
  sample_sent: 'Sample sent',
  demo_booked: 'Meeting booked',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
};

const CATEGORY_LABELS: Record<string, string> = {
  corporate_gifting: 'Corporate gifting',
  retail_store: 'Retail store',
  distributor: 'Distributor',
  hotel_cafe: 'Hotel & cafe',
  ecommerce_reseller: 'E-commerce reseller',
  gym_wellness: 'Gym & nutrition',
  institutional: 'Canteen & institution',
  other: 'Other',
};

const SOURCE_LABELS: Record<string, string> = {
  google_maps: 'Google Maps',
  referral: 'Referral',
  inbound: 'Website enquiry',
  trade_show: 'Trade show',
  csv_upload: 'List upload',
};

const INTENT_LABELS: Record<string, string> = {
  wants_sample: 'Wants a sample',
  wants_demo: 'Wants a meeting',
  wants_pricing: 'Asking for prices',
  asking_details: 'Asking for details',
  not_interested: 'Not interested',
  already_using_competitor: 'Has another supplier',
  call_back_later: 'Call back later',
};

const INTEREST_LABELS: Record<string, string> = {
  positive: 'Positive',
  neutral: 'Neutral',
  negative: 'Negative',
  not_interested: 'Not interested',
  wrong_contact: 'Wrong contact',
};

const titleCase = (v: string) => v.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());

export const stageLabel = (v: string | null | undefined) => (v ? STAGE_LABELS[v] ?? titleCase(v) : '—');
export const categoryLabel = (v: string | null | undefined) => (v ? CATEGORY_LABELS[v] ?? titleCase(v) : 'Other');
export const sourceLabel = (v: string | null | undefined) => (v ? SOURCE_LABELS[v] ?? titleCase(v) : '—');
export const intentLabel = (v: string | null | undefined) => (v ? INTENT_LABELS[v] ?? titleCase(v) : '');
export const interestLabel = (v: string | null | undefined) => (v ? INTEREST_LABELS[v] ?? titleCase(v) : '—');

/** Friendly day + time in Indian time, e.g. "12 Nov, 4:35 pm". */
export function formatWhen(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true });
}

export interface TranscriptEntry {
  direction: 'inbound' | 'outbound';
  message: string;
  at: string;
  status?: string | null;
  wamid?: string | null;
  /** Email only: subject line, recipients and attached file names. */
  subject?: string | null;
  from?: string | null;
  to?: string | null;
  cc?: string | null;
  attachments?: string[] | null;
  /** WhatsApp only: a shared file shown as a chip, e.g. "[Catalogue PDF] Happilo_B2B_RateCard_Nov2026.pdf". */
  attachment?: string | null;
}

/** A system note on a lead's timeline, such as a stage change or a sample dispatch. */
export interface LeadEvent {
  at: string;
  text: string;
  kind: 'stage' | 'sample' | 'order' | 'quote' | 'note' | 'system';
}

export interface Lead {
  id: string;
  google_place_id: string | null;
  company_name: string;
  category: string;
  region: string;
  city: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  whatsapp_number: string | null;
  email: string | null;
  google_rating: number | null;
  google_reviews_count: number | null;
  lead_source: string;
  current_stage: string;
  assigned_rep_id: string | null;
  is_active: boolean;
  notes: string | null;
  conversation_transcript: TranscriptEntry[];
  conversation_transcript_email: TranscriptEntry[];
  conversation_transcript_voice: string | null;
  last_reply_at: string | null;
  whatsapp_sentiment: string | null;
  email_sentiment: string | null;
  voice_sentiment: string | null;
  whatsapp_last_reply_at: string | null;
  email_last_reply_at: string | null;
  voice_call_status: string | null;
  voice_call_at: string | null;
  voice_last_picked_at: string | null;
  voice_note: string | null;
  call_recording_url: string | null;
  created_at: string;
  updated_at: string;
  /** System notes shown on the lead timeline (added later, so optional). */
  system_events?: LeadEvent[];
}

export interface OutreachSequence {
  id: string;
  lead_id: string;
  outreach_step: string;
  channel: 'whatsapp' | 'email' | 'call' | 'system';
  scheduled_date: string;
  status: string;
  executed_at: string | null;
  execution_ref: string | null;
  created_at: string;
  /** Friendly step name, e.g. "Email with catalogue". */
  label?: string;
  /** Why a step was skipped, e.g. "Lead already replied". */
  skip_reason?: string | null;
}

/** Splits a stored sentiment note (interest - intent - summary) into parts. */
export function parseSentiment(value: string | null): { interest: string | null; intent: string | null; summary: string | null } {
  if (!value) return { interest: null, intent: null, summary: null };
  const parts = value.split(' - ');
  return {
    interest: parts[0]?.trim().toLowerCase() ?? null,
    intent: parts[1]?.trim() ?? null,
    summary: parts.slice(2).join(' - ').trim() || null,
  };
}

export interface WhatsappLog {
  id: string;
  lead_id: string;
  direction: 'outbound' | 'inbound';
  outreach_step: string | null;
  message_body: string | null;
  template_name: string | null;
  whatsapp_message_id: string | null;
  status: string;
  interest: string | null;
  intent: string | null;
  interest_score: number | null;
  reply_summary: string | null;
  created_at: string;
  attachment?: string | null;
}

export interface EmailLog {
  id: string;
  lead_id: string;
  direction: 'outbound' | 'inbound';
  outreach_step: string | null;
  subject: string | null;
  body: string | null;
  email_message_id: string | null;
  status: string;
  interest: string | null;
  intent: string | null;
  interest_score: number | null;
  reply_summary: string | null;
  created_at: string;
  cc?: string | null;
  attachments?: string[] | null;
}
