/**
 * Shapes and small helpers for the hand-written B2B outreach stories.
 * Times are "days ago" plus an IST clock time so threads read like real work days.
 */
import type { Interest } from './b2bSeeds';

/** WhatsApp message: [days ago, "HH:MM" IST, o = Happilo / i = lead, text, optional attachment]. */
export type WaM = [number, string, 'o' | 'i', string, string?];

export interface EmM {
  d: number;
  t: string;
  dir: 'o' | 'i';
  subject: string;
  body: string;
  cc?: string;
  atts?: string[];
}

export interface CallGen {
  /** What the call is about, said by Aarav in the opening. */
  topic: string;
  /** The objection the lead raises. */
  objection: string;
  /** How Aarav answers it. */
  answer: string;
  /** Agreed next step, spoken. */
  nextStep: string;
  /** Who the lead spoke to before (rep first name). */
  rep?: string;
  /** Lead's mood: warm leads are keen, cool ones are lukewarm. */
  tone?: 'warm' | 'cool';
}

export interface CallM {
  d: number;
  t: string;
  outcome: 'completed' | 'voicemail' | 'no-answer' | 'busy';
  secs?: number;
  /** Hand-written turns ("A:" Aarav, "U:" lead). Leave out to generate from `gen`. */
  lines?: string[];
  gen?: CallGen;
  summary?: string;
  next?: string;
}

export interface EventM {
  d: number;
  t: string;
  text: string;
  kind: 'stage' | 'sample' | 'order' | 'quote' | 'note' | 'system';
}

export interface UpcomingM {
  /** Days from now (0 = today). */
  inDays: number;
  t: string;
  ch: 'whatsapp' | 'email' | 'call';
  label: string;
}

export interface Story {
  co: string;
  wa: WaM[];
  em: EmM[];
  calls: CallM[];
  events: EventM[];
  upcoming?: UpcomingM[];
  sent: [Interest, string, string];
  voiceSent?: [Interest, string, string];
}

export const RATE_CARD = 'Happilo_B2B_RateCard_Nov2026.pdf';
export const GIFT_CAT = 'Corporate_Gifting_Catalogue_2026.pdf';
export const FSSAI_PDF = 'Happilo_FSSAI_Certificate.pdf';

export const sig = (name = 'Ritu Nambiar', role = 'Key Accounts') =>
  `Regards,\n${name}\n${role}, Happilo International Pvt Ltd\ncare@happilo.com | +91 88844 84000`;
