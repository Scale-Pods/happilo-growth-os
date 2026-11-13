/**
 * Happilo B2B CRM sample dataset.
 *
 * Bulk, corporate-gifting, retail and distributor leads for Happilo
 * International. Everything is built in memory from the hand-written seeds in
 * b2bSeeds.ts, the full stories in b2bStoriesA/B.ts and the cold prospects in
 * b2bColdLeads.ts, with dates relative to "now" so the dashboards always show
 * recent activity.
 */
import type { Lead, WhatsappLog, EmailLog, OutreachSequence, TranscriptEntry, LeadEvent } from '../data/b2bCrm';
import { stageLabel, sourceLabel } from '../data/b2bCrm';
import type { VapiCallLog } from '../data/vapiCalls';
import { SEEDS, type LeadSeed, type Interest, type StageKey, type Cat } from './b2bSeeds';
import { STORIES_A } from './b2bStoriesA';
import { STORIES_B } from './b2bStoriesB';
import { COLD_LEADS } from './b2bColdLeads';
import type { Story, EventM, UpcomingM } from './b2bStoryTypes';
import {
  REPS, groupOf, waIntro, waFollowUp, waCheckIn, catalogueEmail, nudgeEmail, genCallLines, OBJECTIONS, NEXT_STEPS,
} from './b2bJourney';

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

// ---------- internal touch shapes ----------
type CallOutcomeKey = 'completed' | 'voicemail' | 'no-answer' | 'busy';
interface WaT { at: number; dir: 'o' | 'i'; text: string; att?: string; failed?: string }
interface EmT { at: number; dir: 'o' | 'i'; subject: string; body: string; cc?: string; atts?: string[] }
interface CallT { at: number; outcome: CallOutcomeKey; secs: number; lines: string[] | null; summary: string; next: string | null }
interface Plan {
  co: string; cat: Cat; who: string; role?: string; region: string; place: string; stage: StageKey;
  src: LeadSeed['src']; age: number; note: string; domain?: string; rep: number; noWa?: boolean;
  wa: WaT[]; em: EmT[]; calls: CallT[]; events: Array<{ at: number; text: string; kind: LeadEvent['kind'] }>;
  upcoming: Array<{ at: number; ch: 'whatsapp' | 'email' | 'call'; label: string }>;
  sent?: [Interest, string, string]; voiceSent?: [Interest, string, string];
  story: boolean;
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

const TITLES = /^(Dr\.|Fr\.|Coach|Sister|Mrs\.|Ms\.|Mr\.)\s+/;
const firstName = (who: string) => who.replace(TITLES, '').split(' ')[0];
const slugOf = (s: string) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '');

function parseMsg(raw: string): { dir: 'inbound' | 'outbound'; text: string } {
  return raw.startsWith('i:') ? { dir: 'inbound', text: raw.slice(2) } : { dir: 'outbound', text: raw.slice(2) };
}

function buildVoice(lines: string[]): string {
  return lines.map((l) => (l.startsWith('A:') ? `AI: ${l.slice(2)}` : `User: ${l.slice(2)}`)).join('\n');
}

const cap1 = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// ---------- cadence definition ----------
const CADENCE = [
  { step: 'day_0', ch: 'whatsapp' as const, label: 'WhatsApp introduction', off: 0 },
  { step: 'day_2', ch: 'email' as const, label: 'Email with catalogue', off: 2 },
  { step: 'day_5', ch: 'whatsapp' as const, label: 'Follow-up message', off: 5 },
  { step: 'day_8', ch: 'call' as const, label: 'Call from Aarav', off: 8 },
  { step: 'day_12', ch: 'whatsapp' as const, label: 'Sample check-in', off: 12 },
  { step: 'day_18', ch: 'email' as const, label: 'Final nudge', off: 18 },
];

const STAGE_FOLLOW: Record<string, { ch: 'whatsapp' | 'email' | 'call'; label: string }> = {
  interested: { ch: 'whatsapp', label: 'Follow up on the rate card and first order list' },
  sample_sent: { ch: 'whatsapp', label: 'Ask for sample feedback' },
  demo_booked: { ch: 'whatsapp', label: 'Confirm the meeting a day before' },
  negotiation: { ch: 'email', label: 'Send revised quote' },
  won: { ch: 'whatsapp', label: 'Reorder check-in' },
};

function build(): B2BDataset {
  const NOW = Date.now();
  const istMidnight = Math.floor((NOW + IST) / DAY) * DAY - IST;
  const atIst = (daysAgo: number, hhmm: string) => {
    const [h, m] = hhmm.split(':').map(Number);
    return Math.min(istMidnight - daysAgo * DAY + h * HOUR + m * MIN, NOW - 7 * MIN);
  };
  const atFuture = (inDays: number, hhmm: string) => {
    const [h, m] = hhmm.split(':').map(Number);
    const t = istMidnight + inDays * DAY + h * HOUR + m * MIN;
    return t <= NOW ? NOW + 2 * HOUR : t;
  };
  const dayStart = (ms: number) => Math.floor((ms + IST) / DAY) * DAY - IST;
  const bizTime = (ms: number) => dayStart(ms) + (10 + between(0, 7)) * HOUR + between(0, 59) * MIN;

  const leads: Lead[] = [];
  const whatsappLogs: WhatsappLog[] = [];
  const emailLogs: EmailLog[] = [];
  const outreachSequences: OutreachSequence[] = [];
  const vapiCalls: VapiCallLog[] = [];
  let seq = 0;

  const storyByCo = new Map<string, Story>([...STORIES_A, ...STORIES_B].map((s) => [s.co, s]));

  // ================= build plans =================
  const plans: Plan[] = [];

  const repEmail = (rep: number) => REPS[(rep - 1) % 3].full.toLowerCase().replace(' ', '.') + '@happilo.com';

  const storyPlan = (seed: LeadSeed, idx: number, st: Story): Plan => ({
    co: seed.co, cat: seed.cat, who: seed.who, role: seed.role, region: seed.region, place: seed.place, stage: seed.stage,
    src: seed.src, age: seed.age, note: seed.note, domain: seed.domain, rep: seed.rep ?? (idx % 3) + 1,
    wa: st.wa.map(([d, t, dir, text, att]) => ({ at: atIst(d, t), dir, text, att: att || undefined })),
    em: st.em.map((e) => ({ at: atIst(e.d, e.t), dir: e.dir, subject: e.subject, body: e.body, cc: e.cc, atts: e.atts })),
    calls: st.calls.map((c) => {
      const connected = c.outcome === 'completed';
      const lines = connected ? c.lines ?? genCallLines(groupOf(seed.cat), firstName(seed.who), c.gen!, idx + c.d) : null;
      const secs = connected ? c.secs ?? Math.max(110, (lines?.length ?? 22) * 9) : c.outcome === 'voicemail' ? between(14, 31) : c.outcome === 'busy' ? 0 : 0;
      return {
        at: atIst(c.d, c.t), outcome: c.outcome, secs, lines,
        summary: c.summary ?? (c.outcome === 'voicemail' ? 'Went to voicemail, no message left.' : c.outcome === 'busy' ? 'Line was busy.' : 'Phone rang out, no answer.'),
        next: c.next ?? null,
      };
    }),
    events: st.events.map((e: EventM) => ({ at: atIst(e.d, e.t), text: e.text, kind: e.kind })),
    upcoming: (st.upcoming ?? []).map((u: UpcomingM) => ({ at: atFuture(u.inDays, u.t), ch: u.ch, label: u.label })),
    sent: st.sent, voiceSent: st.voiceSent, story: true,
  });

  const seedPlan = (seed: LeadSeed, idx: number): Plan => {
    const plan: Plan = {
      co: seed.co, cat: seed.cat, who: seed.who, role: seed.role, region: seed.region, place: seed.place, stage: seed.stage,
      src: seed.src, age: seed.age, note: seed.note, domain: seed.domain, rep: seed.rep ?? (idx % 3) + 1,
      wa: [], em: [], calls: [], events: [], upcoming: [], sent: seed.sent, voiceSent: seed.voiceSent, story: false,
    };
    if (seed.wa) {
      const times = spreadTimes(NOW, seed.wa.msgs.length, seed.wa.last, seed.wa.span);
      seed.wa.msgs.forEach((raw, i) => {
        const m = parseMsg(raw);
        plan.wa.push({ at: times[i], dir: m.dir === 'outbound' ? 'o' : 'i', text: m.text, failed: m.dir === 'outbound' && seed.wa!.failFirst && i === 0 ? seed.wa!.failFirst : undefined });
      });
    }
    if (seed.em) {
      const times = spreadTimes(NOW, seed.em.msgs.length, seed.em.last, seed.em.span);
      seed.em.msgs.forEach((raw, i) => {
        const m = parseMsg(raw);
        const subject = m.dir === 'outbound' && i === 0 ? seed.em!.subject : seed.em!.subject.startsWith('Re:') ? seed.em!.subject : `Re: ${seed.em!.subject}`;
        plan.em.push({ at: times[i] + 9 * MIN, dir: m.dir === 'outbound' ? 'o' : 'i', subject, body: m.text, atts: i === 0 && m.dir === 'outbound' ? [RATE_FOR(seed.cat)] : undefined });
      });
    }
    if (seed.call) {
      const c = seed.call;
      const connected = c.outcome === 'completed';
      const at = Math.min(spreadTimes(NOW, 1, c.daysAgo, 0)[0] + 3 * HOUR, NOW - 20 * MIN);
      const lines = connected ? (c.lines && c.lines.length >= 18 ? c.lines : null) : null;
      plan.calls.push({
        at, outcome: c.outcome, secs: connected ? c.secs ?? 120 : c.outcome === 'voicemail' ? between(14, 31) : 0, lines,
        summary: connected ? c.summary ?? '' : c.outcome === 'voicemail' ? 'Went to voicemail, no message left.' : 'Phone rang out, no answer.',
        next: null,
      });
    }
    return plan;
  };

  /** Fills in the standard cadence touches that the seed did not cover. */
  const fillGaps = (plan: Plan, idx: number) => {
    if (plan.stage === 'lead_generated') return;
    const rep = REPS[(plan.rep - 1) % 3];
    const first = firstName(plan.who);
    const group = groupOf(plan.cat);
    const outTimes = [...plan.wa.filter((w) => w.dir === 'o'), ...plan.em.filter((e) => e.dir === 'o'), ...plan.calls].map((x) => x.at);
    const createdMs = NOW - plan.age * DAY;
    const day0 = outTimes.length ? Math.min(...outTimes) : createdMs + DAY;
    const engaged = plan.wa.some((w) => w.dir === 'i') || plan.em.some((e) => e.dir === 'i');
    const ok = (t: number) => t <= NOW - HOUR;
    const sentTuple = plan.sent;

    if (plan.wa.length === 0) {
      plan.wa.push({ at: bizTime(day0), dir: 'o', text: waIntro(group, first, rep.first, plan.region, idx) });
    }
    if (plan.em.length === 0 && ok(day0 + 2 * DAY)) {
      const e = catalogueEmail(group, plan.co, first, rep, engaged, idx);
      plan.em.push({ at: bizTime(day0 + 2 * DAY), dir: 'o', subject: e.subject, body: e.body, atts: e.atts });
    }
    if (plan.calls.length === 0 || (plan.calls[0].outcome === 'completed' && !plan.calls[0].lines)) {
      const connected = plan.calls[0] ? true : engaged;
      const pos = sentTuple?.[0] === 'positive';
      const o = OBJECTIONS[group][idx % 2];
      const gen = {
        topic: 'the rates and pack sizes we shared', objection: o.objection, answer: o.answer,
        nextStep: NEXT_STEPS[plan.stage] ?? NEXT_STEPS.interested, rep: rep.first, tone: (pos ? 'warm' : 'cool') as 'warm' | 'cool',
      };
      if (plan.calls[0]) {
        plan.calls[0].lines = genCallLines(group, first, gen, idx);
        plan.calls[0].secs = Math.max(plan.calls[0].secs, plan.calls[0].lines.length * 9);
        plan.calls[0].next = cap1(gen.nextStep);
        if (!plan.calls[0].summary) plan.calls[0].summary = `Discussed ${gen.topic}. Main concern: ${gen.objection}. Agreed that ${gen.nextStep}.`;
      } else if (ok(day0 + 8 * DAY) && connected) {
        const lines = genCallLines(group, first, gen, idx);
        plan.calls.push({
          at: bizTime(day0 + 8 * DAY), outcome: 'completed', secs: lines.length * 9 + between(10, 60), lines,
          summary: `Discussed ${gen.topic}. Main concern: ${gen.objection}. Agreed that ${gen.nextStep}.`, next: cap1(gen.nextStep),
        });
      } else if (ok(day0 + 8 * DAY)) {
        const o2: CallOutcomeKey = (['no-answer', 'voicemail', 'busy', 'no-answer'] as CallOutcomeKey[])[idx % 4];
        plan.calls.push({
          at: bizTime(day0 + 8 * DAY), outcome: o2, secs: o2 === 'voicemail' ? between(14, 31) : 0, lines: null,
          summary: o2 === 'voicemail' ? 'Went to voicemail, no message left.' : o2 === 'busy' ? 'Line was busy.' : 'Phone rang out, no answer.', next: null,
        });
      }
    }
    // Leads who replied on WhatsApp often also answer the catalogue email briefly.
    if (engaged && idx % 3 !== 2 && !plan.em.some((e) => e.dir === 'i')) {
      const firstOutEm = plan.em.find((e) => e.dir === 'o');
      const t = firstOutEm ? firstOutEm.at + (18 + between(0, 30)) * HOUR : 0;
      if (firstOutEm && ok(t)) {
        const sigLine = `${plan.who}
${plan.co}, ${plan.place}`;
        const bodies = [
          `Hi ${rep.first},

Received the catalogue, thanks. We are going through the prices and will reply on WhatsApp, that is quicker for us.

${sigLine}`,
          `Dear ${rep.first},

Thank you for the mail. Please send the price list with GST also, our accounts team needs it in this format. Will revert after checking.

${sigLine}`,
          `Hello,

Noted, thanks. Can you confirm the minimum order and delivery time to ${plan.place}? Rest we can discuss on call.

Regards
${sigLine}`,
        ];
        plan.em.push({ at: t, dir: 'i', subject: firstOutEm.subject.startsWith('Re:') ? firstOutEm.subject : `Re: ${firstOutEm.subject}`, body: bodies[idx % 3] });
      }
    }
    if (!engaged) {
      const outWa = plan.wa.filter((w) => w.dir === 'o').length;
      const noWa = plan.wa.some((w) => w.failed);
      if (!noWa && outWa < 2 && ok(day0 + 5 * DAY)) plan.wa.push({ at: bizTime(day0 + 5 * DAY), dir: 'o', text: waFollowUp(first, rep.first, idx) });
      if (!noWa && outWa < 3 && ok(day0 + 12 * DAY)) plan.wa.push({ at: bizTime(day0 + 12 * DAY), dir: 'o', text: waCheckIn(first, idx) });
      const outEm = plan.em.filter((e) => e.dir === 'o');
      if (outEm.length < 2 && ok(day0 + 18 * DAY)) {
        const n = nudgeEmail(first, rep, outEm[0]?.subject ?? 'Happilo trade range');
        plan.em.push({ at: bizTime(day0 + 18 * DAY), dir: 'o', subject: n.subject, body: n.body });
      }
    }
    plan.wa.sort((a, b) => a.at - b.at);
    plan.em.sort((a, b) => a.at - b.at);
    plan.calls.sort((a, b) => a.at - b.at);

    // default "next step" for engaged leads
    if (plan.upcoming.length === 0 && STAGE_FOLLOW[plan.stage]) {
      const f = STAGE_FOLLOW[plan.stage];
      plan.upcoming.push({ at: atFuture(1 + (idx % 6), '11:00'), ch: f.ch, label: f.label });
    }
    // default events
    const swa = plan.wa.find((w) => w.dir === 'o' && /AWB|sample/i.test(w.text));
    if (plan.stage === 'sample_sent' && swa) plan.events.push({ at: swa.at, kind: 'sample', text: 'Sample pack sent, tracking shared on WhatsApp' });
  };

  const coldPlan = (c: (typeof COLD_LEADS)[number], ci: number): Plan => {
    const idx = SEEDS.length + ci;
    const rep = REPS[ci % 3];
    const first = firstName(c.who);
    const group = groupOf(c.cat);
    const day0 = bizTime(NOW - (c.age - 1) * DAY);
    const ok = (t: number) => t <= NOW - HOUR;
    const plan: Plan = {
      co: c.co, cat: c.cat, who: c.who, region: c.region, place: c.place, stage: 'contacted', src: c.src, age: c.age, note: c.note,
      rep: (ci % 3) + 1, noWa: c.noWa, wa: [], em: [], calls: [], events: [], upcoming: [], story: false,
    };
    if (ok(day0)) {
      plan.wa.push({ at: day0, dir: 'o', text: waIntro(group, first, rep.first, c.region, ci), failed: c.noWa ? 'Number not on WhatsApp' : undefined });
    }
    const t2 = bizTime(day0 + 2 * DAY);
    if (ok(t2)) {
      const e = catalogueEmail(group, c.co, first, rep, false, ci);
      plan.em.push({ at: t2, dir: 'o', subject: e.subject, body: e.body, atts: e.atts });
    }
    const t5 = bizTime(day0 + 5 * DAY);
    if (!c.noWa && ok(t5)) plan.wa.push({ at: t5, dir: 'o', text: waFollowUp(first, rep.first, ci) });
    const t8 = bizTime(day0 + 8 * DAY);
    if (ok(t8)) {
      const o2: CallOutcomeKey = (['no-answer', 'voicemail', 'busy', 'no-answer', 'voicemail'] as CallOutcomeKey[])[ci % 5];
      plan.calls.push({
        at: t8, outcome: o2, secs: o2 === 'voicemail' ? between(14, 31) : 0, lines: null,
        summary: o2 === 'voicemail' ? 'Went to voicemail, no message left.' : o2 === 'busy' ? 'Line was busy.' : 'Phone rang out, no answer.', next: null,
      });
    }
    const t12 = bizTime(day0 + 12 * DAY);
    if (!c.noWa && ok(t12)) plan.wa.push({ at: t12, dir: 'o', text: waCheckIn(first, ci) });
    const t18 = bizTime(day0 + 18 * DAY);
    if (ok(t18) && plan.em[0]) {
      const n = nudgeEmail(first, rep, plan.em[0].subject);
      plan.em.push({ at: t18, dir: 'o', subject: n.subject, body: n.body });
    }
    void idx;
    return plan;
  };

  SEEDS.forEach((seed, idx) => {
    const st = storyByCo.get(seed.co);
    if (st) plans.push(storyPlan(seed, idx, st));
    else {
      const p = seedPlan(seed, idx);
      fillGaps(p, idx);
      plans.push(p);
    }
  });
  COLD_LEADS.forEach((c, ci) => plans.push(coldPlan(c, ci)));

  // ================= assemble leads, logs and cadence =================
  plans.forEach((plan, idx) => {
    const id = `lead-${String(idx + 1).padStart(3, '0')}`;
    const state = CITY_STATE[plan.region] ?? 'India';
    const [lat, lng] = CITY_COORD[plan.region] ?? [20.5, 78.9];
    const slug = slugOf(plan.co).slice(0, 18);
    const createdMs = NOW - plan.age * DAY - between(1, 8) * HOUR;
    const rep = REPS[(plan.rep - 1) % 3];

    const phoneDigits = `${['9', '8', '9', '7', '9', '8', '6', '9'][idx % 8]}${between(1000, 9999)}${between(10000, 99999)}`;
    const phone = `+91 ${phoneDigits.slice(0, 5)} ${phoneDigits.slice(5)}`;
    const domain = plan.domain ?? `${slug}.in`;
    const mailUser = `${slugOf(firstName(plan.who))}${idx % 3 === 0 ? '.' + slugOf(plan.who.split(' ').slice(-1)[0]) : ''}`;
    const needsMail = plan.stage !== 'lead_generated' || plan.cat !== 'retail_store' || Boolean(plan.domain);
    const email = !needsMail ? null : plan.cat === 'retail_store' && !plan.domain ? `${mailUser}${between(11, 98)}@gmail.com` : `${mailUser}@${domain}`;
    const toAddr = email ? `${plan.who} <${email}>` : plan.who;
    const fromRep = `${rep.full} <${repEmail(plan.rep)}>`;

    plan.wa.sort((a, b) => a.at - b.at);
    plan.em.sort((a, b) => a.at - b.at);
    plan.calls.sort((a, b) => a.at - b.at);

    const interest = plan.sent?.[0] ?? null;
    const intent = plan.sent?.[1] ?? null;
    const summary = plan.sent?.[2] ?? null;
    const score = interest === 'positive' ? between(72, 96) : interest === 'neutral' ? between(42, 60) : interest ? between(6, 24) : null;

    const waIn = plan.wa.filter((w) => w.dir === 'i');
    const emIn = plan.em.filter((e) => e.dir === 'i');
    const connectedCalls = plan.calls.filter((c) => c.outcome === 'completed');
    const engaged = waIn.length > 0 || emIn.length > 0 || connectedCalls.length > 0;

    // ---------- cadence (also tells us which step each outbound message belonged to) ----------
    const outWa = plan.wa.filter((w) => w.dir === 'o');
    const outEm = plan.em.filter((e) => e.dir === 'o');
    const allOut = [...outWa, ...outEm, ...plan.calls].map((x) => x.at);
    const brandNew = plan.stage === 'lead_generated';
    const day0 = brandNew ? atFuture(1, '10:30') : allOut.length ? Math.min(...allOut) : createdMs + DAY;
    const firstReplyMs = Math.min(...[...waIn, ...emIn, ...connectedCalls].map((x) => x.at), Infinity);
    const closed = plan.stage === 'won' || plan.stage === 'lost';
    const usedWa = new Set<number>();
    const usedEm = new Set<number>();
    const usedCall = new Set<number>();
    const stepOfWa = new Map<number, string>();
    const stepOfEm = new Map<number, string>();

    const addSeq = (s: Omit<OutreachSequence, 'id' | 'n8n_execution_id'>) => outreachSequences.push({ ...s, id: `seq-${++seq}`, n8n_execution_id: null });

    for (const c of CADENCE) {
      const planned = day0 + c.off * DAY;
      const pool = c.ch === 'whatsapp' ? outWa : c.ch === 'email' ? outEm : plan.calls;
      const used = c.ch === 'whatsapp' ? usedWa : c.ch === 'email' ? usedEm : usedCall;
      let best = -1;
      let bestD = Infinity;
      pool.forEach((p, i) => {
        if (used.has(i)) return;
        const d = Math.abs(p.at - planned);
        if (d < bestD && d <= (c.off === 0 ? 4 : 3.5) * DAY) { best = i; bestD = d; }
      });
      if (!brandNew && best >= 0) {
        used.add(best);
        const t = pool[best];
        if (c.ch === 'whatsapp') stepOfWa.set(t.at, c.step);
        if (c.ch === 'email') stepOfEm.set(t.at, c.step);
        let status = 'sent';
        if (c.ch === 'call') status = (t as CallT).outcome === 'completed' ? 'completed' : 'no_answer';
        if (c.ch === 'whatsapp' && (t as WaT).failed) status = 'failed';
        addSeq({ lead_id: id, outreach_step: c.step, channel: c.ch, scheduled_date: iso(t.at), status, executed_at: iso(t.at), created_at: iso(createdMs), label: c.label, skip_reason: null });
      } else if (!brandNew && planned <= NOW - HOUR) {
        const reason = c.ch === 'whatsapp' && plan.noWa ? 'Number not on WhatsApp' : firstReplyMs < planned ? 'Lead already replied' : 'Not needed';
        addSeq({ lead_id: id, outreach_step: c.step, channel: c.ch, scheduled_date: iso(planned), status: 'skipped', executed_at: null, created_at: iso(createdMs), label: c.label, skip_reason: reason });
      } else if (!closed && (brandNew || !engaged) && !(c.ch === 'whatsapp' && plan.noWa)) {
        addSeq({ lead_id: id, outreach_step: c.step, channel: c.ch, scheduled_date: iso(bizTimeFixed(planned)), status: 'scheduled', executed_at: null, created_at: iso(createdMs), label: c.label, skip_reason: null });
      }
    }
    plan.upcoming.forEach((u) => {
      addSeq({ lead_id: id, outreach_step: 'follow_up', channel: u.ch, scheduled_date: iso(u.at), status: 'scheduled', executed_at: null, created_at: iso(createdMs), label: u.label, skip_reason: null });
    });

    // ---------- WhatsApp ----------
    const waEntries: TranscriptEntry[] = [];
    let waLast: string | null = null;
    let lastReplyMs: number | null = null;
    plan.wa.forEach((m, i) => {
      const at = iso(m.at);
      if (m.dir === 'o') {
        const laterReply = plan.wa.some((x) => x.dir === 'i' && x.at > m.at);
        const h = (idx * 7 + i * 3) % 10;
        const age = NOW - m.at;
        const status = m.failed ? `failed: ${m.failed}` : age < 25 * MIN ? 'sent' : laterReply ? 'read' : age < DAY ? (h < 6 ? 'delivered' : 'read') : h < 3 ? 'delivered' : 'read';
        const wamid = `wamid.HBgM${9190000000 + idx * 131 + i * 17}`;
        const step = stepOfWa.get(m.at) ?? null;
        waEntries.push({ direction: 'outbound', message: m.text, at, status, wamid, attachment: m.att ?? null });
        whatsappLogs.push({
          id: `wa-${whatsappLogs.length + 1}`, lead_id: id, direction: 'outbound', outreach_step: step, message_body: m.text,
          template_name: step ? `b2b_intro_${step}` : null, whatsapp_message_id: wamid, status: m.failed ? 'failed' : status,
          interest: null, intent: null, interest_score: null, reply_summary: null, created_at: at, attachment: m.att ?? null,
        });
      } else {
        waEntries.push({ direction: 'inbound', message: m.text, at, status: 'received', attachment: m.att ?? null });
        whatsappLogs.push({
          id: `wa-${whatsappLogs.length + 1}`, lead_id: id, direction: 'inbound', outreach_step: null, message_body: m.text,
          template_name: null, whatsapp_message_id: `wamid.HBgI${9190000000 + idx * 131 + i * 17}`, status: 'replied',
          interest, intent, interest_score: score, reply_summary: summary, created_at: at, attachment: m.att ?? null,
        });
        waLast = at;
        lastReplyMs = Math.max(lastReplyMs ?? 0, m.at);
      }
    });

    // ---------- Email ----------
    const emEntries: TranscriptEntry[] = [];
    let emLast: string | null = null;
    plan.em.forEach((m, i) => {
      const at = iso(m.at);
      const mid = `<${slug}.${i + 1}.${idx + 40}@mail.happilo.com>`;
      if (m.dir === 'o') {
        const step = stepOfEm.get(m.at) ?? null;
        const status = (idx + i) % 3 === 0 ? 'delivered' : 'opened';
        emEntries.push({ direction: 'outbound', message: m.body, at, status, subject: m.subject, from: fromRep, to: toAddr, cc: m.cc ?? null, attachments: m.atts ?? null });
        emailLogs.push({
          id: `em-${emailLogs.length + 1}`, lead_id: id, direction: 'outbound', outreach_step: step, subject: m.subject, body: m.body,
          email_message_id: mid, status, interest: null, intent: null, interest_score: null, reply_summary: null, created_at: at,
          cc: m.cc ?? null, attachments: m.atts ?? null,
        });
      } else {
        emEntries.push({ direction: 'inbound', message: m.body, at, status: 'received', subject: m.subject, from: toAddr, to: fromRep, cc: m.cc ?? null, attachments: m.atts ?? null });
        emailLogs.push({
          id: `em-${emailLogs.length + 1}`, lead_id: id, direction: 'inbound', outreach_step: null, subject: m.subject, body: m.body,
          email_message_id: mid.replace('mail.happilo.com', domain), status: 'replied', interest, intent, interest_score: score, reply_summary: summary,
          created_at: at, cc: m.cc ?? null, attachments: m.atts ?? null,
        });
        emLast = at;
        lastReplyMs = Math.max(lastReplyMs ?? 0, m.at);
      }
    });

    // ---------- Voice ----------
    let voiceTranscript: string | null = null;
    let voiceStatus: string | null = null;
    let voiceAt: string | null = null;
    let voicePicked: string | null = null;
    let voiceNote: string | null = null;
    let voiceSentiment: string | null = null;
    plan.calls.forEach((c) => {
      const connected = c.outcome === 'completed';
      const transcript = connected && c.lines ? buildVoice(c.lines) : null;
      vapiCalls.push({
        id: `call-${vapiCalls.length + 1}`, started_at: iso(c.at), customer_phone: phone, customer_name: plan.who,
        duration_seconds: c.secs, status: connected ? 'ended' : c.outcome,
        cost_usd: Number(((c.secs / 60) * 0.09 + (c.secs ? 0.02 : 0)).toFixed(2)), source: 'b2b-follow-up',
        transcript, summary: c.summary, recording_url: null, created_at: iso(c.at), updated_at: iso(c.at + c.secs * 1000),
        vapi_account: 'happilo-outbound', assistantId: 'aarav-b2b', type: 'outboundPhoneCall', master_leads_id: id, lead_id_found: true,
        has_transcript: Boolean(transcript), vapi_pipeline: 'b2b_follow_up', vapi_stage: 'voice_follow_up',
        next_step: c.next, recording_seconds: connected ? c.secs : null,
      });
    });
    const lastCall = plan.calls[plan.calls.length - 1];
    if (lastCall) {
      voiceAt = iso(lastCall.at);
      voiceStatus = lastCall.outcome === 'completed' ? 'Connected' : lastCall.outcome === 'voicemail' ? 'Voicemail' : lastCall.outcome === 'busy' ? 'Busy' : 'No answer';
      voiceNote = lastCall.outcome === 'completed' ? (lastCall.next ?? 'Follow up on WhatsApp the same day.') : 'Try again on the next follow-up.';
    }
    const lastConnected = [...connectedCalls].pop();
    if (lastConnected) {
      voiceTranscript = lastConnected.lines ? buildVoice(lastConnected.lines) : null;
      voicePicked = iso(lastConnected.at + 5000);
      const vs = plan.voiceSent ?? plan.sent;
      voiceSentiment = vs ? `${vs[0]} - ${vs[1]} - ${vs[2]}` : null;
      lastReplyMs = Math.max(lastReplyMs ?? 0, lastConnected.at);
    }

    // ---------- timeline notes ----------
    const events: LeadEvent[] = [
      { at: iso(createdMs), kind: 'system', text: `Added from ${sourceLabel(plan.src)}` },
      { at: iso(createdMs + 20 * MIN), kind: 'system', text: `Assigned to ${rep.full}` },
      ...plan.events.map((e) => ({ at: iso(e.at), kind: e.kind, text: e.text })),
    ];
    if (plan.stage !== 'lead_generated' && !plan.events.some((e) => e.kind === 'stage')) {
      const firstOut = allOut.length ? Math.min(...allOut) : createdMs + DAY;
      const lastTouch = Math.max(firstOut, ...plan.wa.map((w) => w.at), ...plan.em.map((e) => e.at), ...plan.calls.map((c) => c.at));
      events.push({ at: iso(plan.stage === 'contacted' ? firstOut + 5 * MIN : Math.max(firstOut + HOUR, lastTouch - 2 * HOUR)), kind: 'stage', text: `Moved to ${stageLabel(plan.stage)}` });
    }
    events.sort((a, b) => (a.at < b.at ? -1 : 1));

    const waSentiment = waIn.length && interest ? `${interest} - ${intent} - ${summary}` : null;
    const emSentiment = emIn.length && interest ? `${interest} - ${intent} - ${summary}` : null;
    const lastTouch = Math.max(createdMs, lastReplyMs ?? 0, ...plan.wa.map((w) => w.at), ...plan.em.map((e) => e.at), ...plan.calls.map((c) => c.at), ...events.map((e) => +new Date(e.at)));

    leads.push({
      id,
      google_place_id: plan.src === 'google_maps' ? `ChIJ${slug}${idx + 11}` : null,
      company_name: plan.co,
      category: plan.cat,
      region: plan.region,
      city: plan.place,
      address: `${between(3, 612)}, ${plan.place}, ${plan.region}, ${state}`,
      latitude: Number((lat + (rnd() - 0.5) * 0.12).toFixed(5)),
      longitude: Number((lng + (rnd() - 0.5) * 0.12).toFixed(5)),
      phone,
      whatsapp_number: phone.replace(/\s/g, ''),
      email,
      google_rating: plan.src === 'google_maps' ? Number((3.7 + rnd() * 1.2).toFixed(1)) : null,
      google_reviews_count: plan.src === 'google_maps' ? between(18, 1260) : null,
      lead_source: plan.src,
      current_stage: plan.stage,
      assigned_rep_id: `rep-${plan.rep}`,
      is_active: plan.stage !== 'lost',
      notes: plan.note,
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
      updated_at: iso(Math.min(lastTouch, NOW)),
      system_events: events,
    });
  });

  outreachSequences.sort((a, b) => ((a.executed_at ?? a.scheduled_date) < (b.executed_at ?? b.scheduled_date) ? 1 : -1));
  vapiCalls.sort((a, b) => ((a.started_at ?? '') < (b.started_at ?? '') ? 1 : -1));
  return { leads, whatsappLogs, emailLogs, outreachSequences, vapiCalls };
}

/** Moves a planned time into working hours (10:00 to 17:30 IST) so upcoming steps look sensible. */
function bizTimeFixed(ms: number): number {
  const day = Math.floor((ms + IST) / DAY) * DAY - IST;
  const minutes = 10 * 60 + (Math.floor(ms / MIN) % 450);
  return day + minutes * MIN;
}

function RATE_FOR(cat: Cat): string {
  return cat === 'corporate_gifting' ? 'Corporate_Gifting_Catalogue_2026.pdf' : 'Happilo_B2B_RateCard_Nov2026.pdf';
}

// Persist across hot reloads / requests so Won / Lost updates stick for the session.
const g = globalThis as unknown as { __happiloB2Bv3?: B2BDataset };
export function getB2BDataset(): B2BDataset {
  if (!g.__happiloB2Bv3) g.__happiloB2Bv3 = build();
  return g.__happiloB2Bv3;
}

export function updateLeadStage(id: string, stage: string): Lead | null {
  const lead = getB2BDataset().leads.find((l) => l.id === id);
  if (!lead) return null;
  lead.current_stage = stage;
  lead.is_active = stage !== 'lost';
  lead.updated_at = new Date().toISOString();
  lead.system_events = [
    ...(lead.system_events ?? []),
    { at: lead.updated_at, kind: 'stage' as const, text: `Marked as ${stage === 'won' ? 'won' : 'lost'}` },
  ];
  return lead;
}
