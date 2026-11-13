/**
 * Happilo B2B CRM sample dataset.
 *
 * Bulk, corporate-gifting, retail and distributor leads for Happilo
 * International. Everything is built in memory from the hand-written seeds in
 * b2bSeeds.ts, with dates relative to "now" so the dashboards always show
 * recent activity.
 */
import type { Lead, WhatsappLog, EmailLog, OutreachSequence, TranscriptEntry } from '../data/b2bCrm';
import type { VapiCallLog } from '../data/vapiCalls';
import { SEEDS, type LeadSeed } from './b2bSeeds';

// ---------- tiny deterministic PRNG ----------
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(88217);
const between = (min: number, max: number) => Math.floor(rnd() * (max - min + 1)) + min;

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const IST = 5.5 * HOUR;
const iso = (ms: number) => new Date(ms).toISOString();

const CITY_STATE: Record<string, string> = {
  Bengaluru: 'Karnataka', Mumbai: 'Maharashtra', 'Delhi NCR': 'Delhi', Hyderabad: 'Telangana', Chennai: 'Tamil Nadu',
  Pune: 'Maharashtra', Kolkata: 'West Bengal', Ahmedabad: 'Gujarat', Jaipur: 'Rajasthan', Kochi: 'Kerala',
};
const CITY_COORD: Record<string, [number, number]> = {
  Bengaluru: [12.97, 77.59], Mumbai: [19.07, 72.88], 'Delhi NCR': [28.61, 77.21], Hyderabad: [17.38, 78.48],
  Chennai: [13.08, 80.27], Pune: [18.52, 73.86], Kolkata: [22.57, 88.36], Ahmedabad: [23.02, 72.57],
  Jaipur: [26.91, 75.79], Kochi: [9.93, 76.27],
};

export interface B2BDataset {
  leads: Lead[];
  whatsappLogs: WhatsappLog[];
  emailLogs: EmailLog[];
  outreachSequences: OutreachSequence[];
  vapiCalls: VapiCallLog[];
}

/** Spread n message times over `span` days ending `last` days ago, during business hours (IST). */
function spreadTimes(now: number, n: number, last: number, span: number): number[] {
  const istMidnight = Math.floor((now + IST) / DAY) * DAY - IST; // UTC ms of today's 00:00 IST
  const days: number[] = [];
  for (let i = 0; i < n; i++) {
    days.push(Math.round(last + ((n - 1 - i) * span) / Math.max(n - 1, 1)));
  }
  const slot: Record<number, number> = {};
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const d = days[i];
    const k = slot[d] ?? 0;
    slot[d] = k + 1;
    let t = istMidnight - d * DAY + 10 * HOUR + k * (25 + between(0, 20)) * MIN + between(0, 70) * MIN;
    const cap = now - (n - i) * 7 * MIN;
    if (t > cap) t = cap;
    if (i > 0 && t <= out[i - 1]) t = out[i - 1] + between(6, 40) * MIN;
    out.push(t);
  }
  return out;
}

const TITLES = /^(Dr\.|Fr\.|Coach|Sister)\s+/;
const firstName = (who: string) => who.replace(TITLES, '').split(' ')[0];
const slugOf = (s: string) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '');

function parseMsg(raw: string): { dir: 'inbound' | 'outbound'; text: string } {
  return raw.startsWith('i:') ? { dir: 'inbound', text: raw.slice(2) } : { dir: 'outbound', text: raw.slice(2) };
}

function buildVoice(lines: string[]): string {
  return lines.map((l) => (l.startsWith('A:') ? `AI: ${l.slice(2)}` : `User: ${l.slice(2)}`)).join('\n');
}

const WA_STEPS = ['day_0', 'day_3', 'day_7', 'day_14'];
const EM_STEPS = ['day_0', 'day_5', 'day_9'];

function build(): B2BDataset {
  const NOW = Date.now();
  const leads: Lead[] = [];
  const whatsappLogs: WhatsappLog[] = [];
  const emailLogs: EmailLog[] = [];
  const outreachSequences: OutreachSequence[] = [];
  const vapiCalls: VapiCallLog[] = [];
  let seq = 0;

  const addSeq = (s: Omit<OutreachSequence, 'id' | 'n8n_execution_id'>) =>
    outreachSequences.push({ ...s, id: `seq-${++seq}`, n8n_execution_id: null });

  SEEDS.forEach((seed: LeadSeed, idx) => {
    const id = `lead-${String(idx + 1).padStart(3, '0')}`;
    const state = CITY_STATE[seed.region] ?? 'India';
    const [lat, lng] = CITY_COORD[seed.region] ?? [20.5, 78.9];
    const slug = slugOf(seed.co).slice(0, 18);
    const createdMs = NOW - seed.age * DAY - between(1, 8) * HOUR;

    const phoneDigits = `${pickLead(idx)}${between(1000, 9999)}${between(10000, 99999)}`;
    const phone = `+91 ${phoneDigits.slice(0, 5)} ${phoneDigits.slice(5)}`;
    const domain = seed.domain ?? `${slug}.in`;
    const mailUser = `${slugOf(firstName(seed.who))}${idx % 3 === 0 ? '.' + slugOf(seed.who.split(' ').slice(-1)[0]) : ''}`;
    const email = seed.cat === 'retail_store' && !seed.domain ? null : `${mailUser}@${domain}`;

    const waEntries: TranscriptEntry[] = [];
    const emEntries: TranscriptEntry[] = [];
    let waLast: string | null = null;
    let emLast: string | null = null;
    let lastReplyMs: number | null = null;
    let outboundWa = 0;
    let outboundEm = 0;

    const interest = seed.sent?.[0] ?? null;
    const intent = seed.sent?.[1] ?? null;
    const summary = seed.sent?.[2] ?? null;
    const score = interest === 'positive' ? between(72, 96) : interest === 'neutral' ? between(42, 60) : interest ? between(6, 24) : null;

    // ---- WhatsApp ----
    if (seed.wa) {
      const times = spreadTimes(NOW, seed.wa.msgs.length, seed.wa.last, seed.wa.span);
      seed.wa.msgs.forEach((raw, i) => {
        const m = parseMsg(raw);
        const at = iso(times[i]);
        const isLast = i === seed.wa!.msgs.length - 1;
        if (m.dir === 'outbound') {
          const step = WA_STEPS[outboundWa] ?? null;
          const failed = seed.wa!.failFirst && i === 0;
          const status = failed ? `failed: ${seed.wa!.failFirst}` : isLast ? 'delivered' : 'read';
          const wamid = `wamid.HBgM${9190000000 + idx * 131 + i * 17}`;
          waEntries.push({ direction: 'outbound', message: m.text, at, status, wamid });
          whatsappLogs.push({
            id: `wa-${whatsappLogs.length + 1}`, lead_id: id, direction: 'outbound', outreach_step: step, message_body: m.text,
            template_name: step ? `b2b_intro_${step}` : null, whatsapp_message_id: wamid, status: failed ? 'failed' : status,
            interest: null, intent: null, interest_score: null, reply_summary: null, created_at: at,
          });
          if (step) {
            addSeq({ lead_id: id, outreach_step: step, channel: 'whatsapp', scheduled_date: at.slice(0, 10), status: failed ? 'failed' : 'sent', executed_at: at, created_at: iso(createdMs) });
          }
          outboundWa++;
        } else {
          waEntries.push({ direction: 'inbound', message: m.text, at, status: 'received' });
          whatsappLogs.push({
            id: `wa-${whatsappLogs.length + 1}`, lead_id: id, direction: 'inbound', outreach_step: null, message_body: m.text,
            template_name: null, whatsapp_message_id: `wamid.HBgI${9190000000 + idx * 131 + i * 17}`, status: 'replied',
            interest, intent, interest_score: score, reply_summary: summary, created_at: at,
          });
          waLast = at;
          lastReplyMs = Math.max(lastReplyMs ?? 0, times[i]);
        }
      });
    }

    // ---- Email ----
    if (seed.em) {
      const times = spreadTimes(NOW, seed.em.msgs.length, seed.em.last, seed.em.span);
      seed.em.msgs.forEach((raw, i) => {
        const m = parseMsg(raw);
        const at = iso(times[i] + 9 * MIN);
        const subject = m.dir === 'outbound' && i === 0 ? seed.em!.subject : seed.em!.subject.startsWith('Re:') ? seed.em!.subject : `Re: ${seed.em!.subject}`;
        const mid = `<${slug}.${i + 1}.${idx + 40}@mail.happilo.com>`;
        if (m.dir === 'outbound') {
          const step = EM_STEPS[outboundEm] ?? null;
          emEntries.push({ direction: 'outbound', message: `Subject: ${subject}\n\n${m.text}`, at, status: i === seed.em!.msgs.length - 1 && !seed.em!.msgs.some((x) => x.startsWith('i:')) ? 'delivered' : 'opened' });
          emailLogs.push({
            id: `em-${emailLogs.length + 1}`, lead_id: id, direction: 'outbound', outreach_step: step, subject, body: m.text,
            email_message_id: mid, status: 'opened', interest: null, intent: null, interest_score: null, reply_summary: null, created_at: at,
          });
          if (step) addSeq({ lead_id: id, outreach_step: step, channel: 'email', scheduled_date: at.slice(0, 10), status: 'sent', executed_at: at, created_at: iso(createdMs) });
          outboundEm++;
        } else {
          emEntries.push({ direction: 'inbound', message: `Subject: ${subject}\n\n${m.text}`, at, status: 'received' });
          emailLogs.push({
            id: `em-${emailLogs.length + 1}`, lead_id: id, direction: 'inbound', outreach_step: null, subject, body: m.text,
            email_message_id: mid.replace('mail.happilo.com', domain), status: 'replied',
            interest, intent, interest_score: score, reply_summary: summary, created_at: at,
          });
          emLast = at;
          lastReplyMs = Math.max(lastReplyMs ?? 0, times[i] + 9 * MIN);
        }
      });
    }

    // ---- Voice ----
    let voiceTranscript: string | null = null;
    let voiceStatus: string | null = null;
    let voiceAt: string | null = null;
    let voicePicked: string | null = null;
    let voiceNote: string | null = null;
    let voiceSentiment: string | null = null;
    if (seed.call) {
      const c = seed.call;
      const callMs = spreadTimes(NOW, 1, c.daysAgo, 0)[0] + 3 * HOUR;
      const callCapped = Math.min(callMs, NOW - 20 * MIN);
      const connected = c.outcome === 'completed';
      const duration = connected ? c.secs ?? 120 : c.outcome === 'voicemail' ? between(14, 31) : 0;
      voiceAt = iso(callCapped);
      if (connected) {
        voiceTranscript = c.lines ? buildVoice(c.lines) : null;
        voiceStatus = 'Connected';
        voicePicked = iso(callCapped + 5000);
        const vs = seed.voiceSent ?? seed.sent;
        voiceSentiment = vs ? `${vs[0]} - ${vs[1]} - ${vs[2]}` : null;
        voiceNote = vs && vs[0] === 'positive' ? 'Warm. Rep to follow up on WhatsApp the same day.' : vs && vs[0] === 'neutral' ? 'Follow up by email.' : 'Do not call again for a month.';
        lastReplyMs = Math.max(lastReplyMs ?? 0, callCapped);
      } else {
        voiceStatus = c.outcome === 'voicemail' ? 'Voicemail' : 'No answer';
        voiceNote = 'Try again on the next follow-up.';
      }
      vapiCalls.push({
        id: `call-${vapiCalls.length + 1}`, started_at: iso(callCapped), customer_phone: phone, customer_name: seed.who,
        duration_seconds: duration, status: connected ? 'ended' : c.outcome === 'voicemail' ? 'voicemail' : 'no-answer',
        cost_usd: Number(((duration / 60) * 0.09 + (duration ? 0.02 : 0)).toFixed(2)), source: 'b2b-follow-up',
        transcript: voiceTranscript,
        summary: connected ? c.summary ?? null : c.outcome === 'voicemail' ? 'Went to voicemail, no message left.' : 'Phone rang out, no answer.',
        recording_url: null, created_at: iso(callCapped), updated_at: iso(callCapped + duration * 1000), vapi_account: 'happilo-outbound',
        assistantId: 'aarav-b2b', type: 'outboundPhoneCall', master_leads_id: id, lead_id_found: true,
        has_transcript: Boolean(voiceTranscript), vapi_pipeline: 'b2b_follow_up', vapi_stage: 'voice_follow_up',
      });
      addSeq({ lead_id: id, outreach_step: 'day_10', channel: 'call', scheduled_date: iso(callCapped).slice(0, 10), status: connected ? 'completed' : 'no_answer', executed_at: iso(callCapped), created_at: iso(createdMs) });
    }

    // ---- upcoming touches ----
    if (seed.stage === 'lead_generated') {
      addSeq({ lead_id: id, outreach_step: 'day_0', channel: 'whatsapp', scheduled_date: iso(NOW + DAY).slice(0, 10), status: 'scheduled', executed_at: null, created_at: iso(createdMs) });
    } else if (seed.stage === 'contacted') {
      addSeq({ lead_id: id, outreach_step: WA_STEPS[Math.min(outboundWa, 3)], channel: 'whatsapp', scheduled_date: iso(NOW + (1 + (idx % 3)) * DAY).slice(0, 10), status: 'scheduled', executed_at: null, created_at: iso(createdMs) });
    }

    const waSentiment = waEntries.some((e) => e.direction === 'inbound') && interest ? `${interest} - ${intent} - ${summary}` : null;
    const emSentiment = emEntries.some((e) => e.direction === 'inbound') && interest ? `${interest} - ${intent} - ${summary}` : null;
    const lastTouch = Math.max(createdMs, lastReplyMs ?? 0, ...waEntries.map((e) => +new Date(e.at)), ...emEntries.map((e) => +new Date(e.at)));

    leads.push({
      id,
      google_place_id: seed.src === 'google_maps' ? `ChIJ${slug}${idx + 11}` : null,
      company_name: seed.co,
      category: seed.cat,
      region: seed.region,
      city: seed.place,
      address: `${between(3, 612)}, ${seed.place}, ${seed.region}, ${state}`,
      latitude: Number((lat + (rnd() - 0.5) * 0.12).toFixed(5)),
      longitude: Number((lng + (rnd() - 0.5) * 0.12).toFixed(5)),
      phone,
      whatsapp_number: phone.replace(/\s/g, ''),
      email,
      google_rating: seed.src === 'google_maps' ? Number((3.7 + rnd() * 1.2).toFixed(1)) : null,
      google_reviews_count: seed.src === 'google_maps' ? between(18, 1260) : null,
      lead_source: seed.src,
      current_stage: seed.stage,
      assigned_rep_id: `rep-${seed.rep ?? (idx % 3) + 1}`,
      is_active: seed.stage !== 'lost',
      notes: seed.note,
      conversation_transcript: waEntries,
      conversation_transcript_email: emEntries,
      conversation_transcript_voice: voiceTranscript,
      last_reply_at: lastReplyMs ? iso(lastReplyMs) : null,
      whatsapp_sentiment: waSentiment,
      email_sentiment: emSentiment,
      voice_sentiment: voiceSentiment,
      whatsapp_last_reply_at: waLast,
      email_last_reply_at: emLast,
      voice_call_status: voiceStatus,
      voice_call_at: voiceAt,
      voice_last_picked_at: voicePicked,
      voice_note: voiceNote,
      call_recording_url: null,
      created_at: iso(createdMs),
      updated_at: iso(lastTouch),
    });
  });

  outreachSequences.sort((a, b) => ((a.executed_at ?? a.scheduled_date) < (b.executed_at ?? b.scheduled_date) ? 1 : -1));
  return { leads, whatsappLogs, emailLogs, outreachSequences, vapiCalls };
}

function pickLead(idx: number): string {
  return ['9', '8', '9', '7', '9', '8', '6', '9'][idx % 8];
}

// Persist across hot reloads / requests so Won / Lost updates stick for the session.
const g = globalThis as unknown as { __happiloB2Bv2?: B2BDataset };
export function getB2BDataset(): B2BDataset {
  if (!g.__happiloB2Bv2) g.__happiloB2Bv2 = build();
  return g.__happiloB2Bv2;
}

export function updateLeadStage(id: string, stage: string): Lead | null {
  const lead = getB2BDataset().leads.find((l) => l.id === id);
  if (!lead) return null;
  lead.current_stage = stage;
  lead.is_active = stage !== 'lost';
  lead.updated_at = new Date().toISOString();
  return lead;
}
