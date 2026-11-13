/**
 * One row per outbound voice call made by Aarav, Happilo's calling agent.
 * Every field is optional because a row is written while the call is still
 * in progress.
 */
export interface VapiCallLog {
  id: string;
  started_at: string | null;
  customer_phone: string | null;
  customer_name: string | null;
  duration_seconds: number | null;
  status: string | null;
  cost_usd: number | null;
  source: string | null;
  transcript: string | null;
  summary: string | null;
  recording_url: string | null;
  created_at: string | null;
  updated_at: string | null;
  vapi_account: string | null;
  assistantId: string | null;
  type: string | null;
  master_leads_id: string | null;
  lead_id_found: boolean | null;
  has_transcript: boolean | null;
  vapi_pipeline: string | null;
  vapi_stage: string | null;
  /** What Aarav agreed as the next step, in plain words. */
  next_step?: string | null;
  /** Recording length in seconds, for the play bar. */
  recording_seconds?: number | null;
}

export interface VoiceTurn {
  role: 'agent' | 'customer' | 'system';
  text: string;
}

const AGENT_RE = /^\s*(ai|assistant|agent|bot|aarav|happilo)\s*[:\-]/i;
const CUSTOMER_RE = /^\s*(user|customer|human|caller|lead)\s*[:\-]/i;
const SYSTEM_RE = /^\s*(system|tool|function)\s*[:\-]/i;

/**
 * A call transcript is stored as one string, usually one speaker per line
 * prefixed with "AI:" / "User:". Some rows are JSON (an array of {role,message}
 * turns) — handle both, and fall back to one agent turn.
 */
export function parseVoiceTranscript(value: string | null | undefined): VoiceTurn[] {
  if (!value || !value.trim()) return [];

  const trimmed = value.trim();
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      const arr = Array.isArray(parsed) ? parsed : parsed?.messages ?? parsed?.transcript ?? [];
      if (Array.isArray(arr) && arr.length > 0) {
        return arr
          .map((t): VoiceTurn | null => {
            const rawRole = String(t?.role ?? t?.speaker ?? '').toLowerCase();
            const text = String(t?.message ?? t?.text ?? t?.content ?? '').trim();
            if (!text) return null;
            const role: VoiceTurn['role'] =
              rawRole.includes('assistant') || rawRole.includes('bot') || rawRole.includes('agent') || rawRole === 'ai'
                ? 'agent'
                : rawRole.includes('system') || rawRole.includes('tool')
                ? 'system'
                : 'customer';
            return { role, text };
          })
          .filter((t): t is VoiceTurn => t !== null);
      }
    } catch {
      /* fall through to line parsing */
    }
  }

  const turns: VoiceTurn[] = [];
  for (const rawLine of trimmed.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    let role: VoiceTurn['role'] = 'agent';
    let text = line;
    if (CUSTOMER_RE.test(line)) {
      role = 'customer';
      text = line.replace(CUSTOMER_RE, '').trim();
    } else if (AGENT_RE.test(line)) {
      role = 'agent';
      text = line.replace(AGENT_RE, '').trim();
    } else if (SYSTEM_RE.test(line)) {
      role = 'system';
      text = line.replace(SYSTEM_RE, '').trim();
    } else if (turns.length > 0) {
      // Continuation of the previous speaker's turn.
      turns[turns.length - 1].text += `\n${line}`;
      continue;
    }
    if (text) turns.push({ role, text });
  }
  return turns;
}

/** A call counts as connected when someone picked up and spoke. */
export function isConnectedCall(log: VapiCallLog): boolean {
  const status = (log.status ?? '').toLowerCase();
  if (['completed', 'ended', 'answered', 'in-progress', 'forwarding'].some((s) => status.includes(s))) {
    return (log.duration_seconds ?? 0) > 0 || Boolean(log.has_transcript) || Boolean(log.transcript?.trim());
  }
  return false;
}

const NO_ANSWER = ['no-answer', 'no_answer', 'noanswer', 'busy', 'failed', 'not-answered', 'unanswered', 'canceled', 'cancelled'];
const VOICEMAIL = ['voicemail', 'machine', 'answering'];

export type CallOutcome = 'connected' | 'voicemail' | 'no_answer' | 'unknown';

export function callOutcome(log: VapiCallLog): CallOutcome {
  const status = (log.status ?? '').toLowerCase();
  if (VOICEMAIL.some((s) => status.includes(s))) return 'voicemail';
  if (isConnectedCall(log)) return 'connected';
  if (NO_ANSWER.some((s) => status.includes(s))) return 'no_answer';
  return 'unknown';
}

/** USD → formatted string, tolerating missing values. */
export function formatUsd(value: number | null | undefined): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return '$0.00';
  return `$${n.toFixed(2)}`;
}

/** Seconds → "m:ss", tolerating null/NaN. */
export function formatDuration(seconds: number | null | undefined): string {
  const n = Number(seconds);
  if (!Number.isFinite(n) || n <= 0) return '—';
  const m = Math.floor(n / 60);
  const s = Math.round(n % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Friendly label for a call outcome. */
export function outcomeLabel(outcome: CallOutcome): string {
  return outcome === 'connected' ? 'Connected' : outcome === 'voicemail' ? 'Voicemail' : outcome === 'no_answer' ? 'No answer' : 'Unknown';
}
