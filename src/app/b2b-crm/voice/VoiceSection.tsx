'use client';

import React, { useMemo, useState } from 'react';
import { useAppContext } from '../../ClientWrapper';
import {
  Phone,
  PhoneCall,
  PhoneOff,
  Voicemail,
  Search,
  Clock,
  TrendingUp,
  CheckCheck,
  IndianRupee,
  PlayCircle,
  Link2,
  Check,
  X,
} from 'lucide-react';
import { isWithinDateRange } from '@/lib/dateRangeFilter';
import { parseSentiment, stageLabel, interestLabel, intentLabel, formatWhen, type Lead } from '@/lib/data/b2bCrm';
import {
  parseVoiceTranscript,
  callOutcome,
  isConnectedCall,
  formatUsd,
  formatDuration,
  type VapiCallLog,
  type CallOutcome,
} from '@/lib/data/vapiCalls';

type VoiceView = 'dashboard' | 'logs' | 'analytics';

/** How a call was tied back to a lead. */
type MatchKind = 'lead_id' | 'phone' | 'name' | 'none';

export interface VoiceCall {
  log: VapiCallLog;
  lead: Lead | null;
  /** How the lead was found. */
  match: MatchKind;
  at: string | null;
  atDate: Date | null;
  outcome: CallOutcome;
  connected: boolean;
  /** Turns of the conversation. */
  turns: ReturnType<typeof parseVoiceTranscript>;
  /** Interest level taken from the call note. */
  sentiment: string | null;
  /** Recording link, when there is one. */
  recordingUrl: string | null;
}

/** Digits-only tail of a phone number, for tolerant matching across formats. */
function phoneKey(value: string | null | undefined): string | null {
  if (!value) return null;
  const digits = String(value).replace(/\D/g, '');
  if (digits.length < 7) return null;
  return digits.slice(-10);
}

/** Anchor date for a call row: started_at, else created_at, else lead's voice_call_at. */
function callAnchor(log: VapiCallLog, lead: Lead | null): string | null {
  return log.started_at ?? log.created_at ?? lead?.voice_call_at ?? null;
}

function buildCalls(logs: VapiCallLog[], leads: Lead[]): VoiceCall[] {
  // Match by lead id first, then fall back to phone number and name.
  const byId = new Map(leads.map((s) => [String(s.id), s]));
  const byPhone = new Map<string, Lead>();
  const byName = new Map<string, Lead>();
  for (const s of leads) {
    for (const p of [s.phone, s.whatsapp_number]) {
      const k = phoneKey(p);
      if (k && !byPhone.has(k)) byPhone.set(k, s);
    }
    const nk = s.company_name?.trim().toLowerCase();
    if (nk && !byName.has(nk)) byName.set(nk, s);
  }

  return logs.map((log) => {
    let lead: Lead | null = null;
    let match: MatchKind = 'none';

    if (log.master_leads_id && byId.has(String(log.master_leads_id))) {
      lead = byId.get(String(log.master_leads_id))!;
      match = 'lead_id';
    }
    if (!lead) {
      const k = phoneKey(log.customer_phone);
      if (k && byPhone.has(k)) {
        lead = byPhone.get(k)!;
        match = 'phone';
      }
    }
    if (!lead) {
      const nk = log.customer_name?.trim().toLowerCase();
      if (nk && byName.has(nk)) {
        lead = byName.get(nk)!;
        match = 'name';
      }
    }

    const at = callAnchor(log, lead);
    const logTurns = parseVoiceTranscript(log.transcript);
    const turns = logTurns.length > 0 ? logTurns : parseVoiceTranscript(lead?.conversation_transcript_voice);
    const sentimentSource = lead?.voice_sentiment ?? null;

    return {
      log,
      lead,
      match,
      at,
      atDate: at ? new Date(at) : null,
      outcome: callOutcome(log),
      connected: isConnectedCall(log),
      turns,
      sentiment: parseSentiment(sentimentSource).interest,
      recordingUrl: log.recording_url ?? lead?.call_recording_url ?? null,
    };
  });
}

export default function VoiceSection({
  logs,
  leads,
  view,
}: {
  logs: VapiCallLog[];
  leads: Lead[];
  view: VoiceView;
}) {
  const { dateRange, dateLabel } = useAppContext();

  const calls = useMemo(() => {
    return buildCalls(logs, leads)
      .filter((c) => (c.atDate ? isWithinDateRange(c.atDate, dateRange) : true))
      .sort((a, b) => (b.atDate?.getTime() ?? 0) - (a.atDate?.getTime() ?? 0));
  }, [logs, leads, dateRange]);

  return (
    <div style={{ animation: 'fadeIn 300ms ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--label-primary)', margin: 0 }}>
            {view === 'dashboard' && 'Phone calls overview'}
            {view === 'logs' && 'Call history'}
            {view === 'analytics' && 'Phone call analytics'}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--label-secondary)', marginTop: '4px', marginBottom: 0 }}>
            Follow-up calls made by Aarav, Happilo's calling assistant{dateLabel ? ` · ${dateLabel}` : ''}.
          </p>
        </div>
      </div>

      {view === 'dashboard' && <VoiceDashboard calls={calls} />}
      {view === 'logs' && <VoiceLogs calls={calls} />}
      {view === 'analytics' && <VoiceAnalytics calls={calls} />}
    </div>
  );
}

/* ----------------------------- Dashboard ----------------------------- */

function VoiceDashboard({ calls }: { calls: VoiceCall[] }) {
  const connected = calls.filter((c) => c.connected);
  const voicemail = calls.filter((c) => c.outcome === 'voicemail');
  const noAnswer = calls.filter((c) => c.outcome === 'no_answer');
  const connectRate = calls.length > 0 ? Math.round((connected.length / calls.length) * 100) : 0;

  const totalTalkSec = connected.reduce((s, c) => s + (c.log.duration_seconds ?? 0), 0);
  const avgTalkSec = connected.length ? totalTalkSec / connected.length : 0;
  const totalCost = calls.reduce((s, c) => s + (c.log.cost_usd ?? 0), 0);
  const positive = calls.filter((c) => c.sentiment === 'positive').length;

  const recent = calls.slice(0, 8);

  return (
    <>
      <div className="metrics-grid mb-24">
        <Tile accent="var(--purple)" label="Calls placed" value={calls.length} icon={<PhoneCall size={12} />} sub="In this date range" />
        <Tile accent="var(--green)" label="Picked up" value={connected.length} icon={<CheckCheck size={12} />} sub={`${connectRate}% pick-up rate`} />
        <Tile accent="var(--orange)" label="Voicemail" value={voicemail.length} icon={<Voicemail size={12} />} sub={`${noAnswer.length} no answer`} />
        <Tile accent="var(--blue)" label="Positive calls" value={positive} icon={<TrendingUp size={12} />} sub="Keen to move ahead" />
      </div>

      <div className="liquid-card mb-24" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--label-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Average talk time</span>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--label-primary)' }}>{formatDuration(avgTalkSec)}</div>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--label-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Total talk time</span>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--label-primary)' }}>{formatDuration(totalTalkSec)}</div>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--label-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Calling cost</span>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--green)' }}>{formatUsd(totalCost)}</div>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--label-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Calls with notes</span>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--label-primary)' }}>
              {calls.filter((c) => c.turns.length > 0).length}
            </div>
          </div>
        </div>
      </div>

      <div className="liquid-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Recent calls</h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--separator)' }}>
                <th style={{ padding: '12px 8px' }}>Company</th>
                <th style={{ padding: '12px 8px' }}>Number</th>
                <th style={{ padding: '12px 8px' }}>Outcome</th>
                <th style={{ padding: '12px 8px' }}>Duration</th>
                <th style={{ padding: '12px 8px' }}>When</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--label-tertiary)' }}>No calls in this date range.</td></tr>
              ) : (
                recent.map((c) => (
                  <tr key={c.log.id} style={{ borderBottom: '1px solid var(--separator)' }}>
                    <td style={{ padding: '12px 8px', fontWeight: '700' }}>
                      {c.lead?.company_name ?? c.log.customer_name ?? '—'}
                    </td>
                    <td style={{ padding: '12px 8px' }}>{c.log.customer_phone ?? c.lead?.phone ?? '—'}</td>
                    <td style={{ padding: '12px 8px' }}><OutcomeBadge outcome={c.outcome} /></td>
                    <td style={{ padding: '12px 8px' }}>{formatDuration(c.log.duration_seconds)}</td>
                    <td style={{ padding: '12px 8px', fontSize: '11.5px', color: 'var(--label-tertiary)' }}>
                      {c.at ? formatWhen(c.at) : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/* ------------------------------- Logs ------------------------------- */

function VoiceLogs({ calls }: { calls: VoiceCall[] }) {
  const { dateLabel } = useAppContext();
  const [search, setSearch] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState<'all' | CallOutcome>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return calls.filter((c) => {
      const matchesSearch =
        !q ||
        [
          c.lead?.company_name,
          c.lead?.phone,
          c.lead?.city,
          c.lead?.region,
          c.lead?.email,
          c.log.customer_name,
          c.log.customer_phone,
          c.lead?.voice_call_status,
        ]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q));
      const matchesOutcome = outcomeFilter === 'all' || c.outcome === outcomeFilter;
      return matchesSearch && matchesOutcome;
    });
  }, [calls, search, outcomeFilter]);

  const active = selectedId ? filtered.find((c) => c.log.id === selectedId) ?? null : null;

  return (
    <div style={{ animation: 'fadeIn 200ms ease' }}>
      <div className="liquid-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>All calls</h3>
            <p style={{ fontSize: '12px', color: 'var(--label-tertiary)', margin: '4px 0 0' }}>
              {filtered.length} call{filtered.length === 1 ? '' : 's'}
              {dateLabel ? ` · ${dateLabel}` : ''}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--label-tertiary)' }} />
              <input
                type="text"
                placeholder="Search company, contact or phone..."
                className="input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ padding: '8px 12px 8px 30px', fontSize: '13px', width: '260px' }}
              />
            </div>
            <select
              className="input"
              value={outcomeFilter}
              onChange={(e) => setOutcomeFilter(e.target.value as 'all' | CallOutcome)}
              style={{ padding: '8px', fontSize: '13px' }}
            >
              <option value="all">All outcomes</option>
              <option value="connected">Picked up</option>
              <option value="voicemail">Voicemail</option>
              <option value="no_answer">No answer</option>
              <option value="unknown">Unknown</option>
            </select>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', whiteSpace: 'nowrap' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--separator)' }}>
                <th style={{ padding: '12px 8px' }}>Outcome</th>
                <th style={{ padding: '12px 8px' }}>Company</th>
                <th style={{ padding: '12px 8px' }}>Phone</th>
                <th style={{ padding: '12px 8px' }}>Called</th>
                <th style={{ padding: '12px 8px' }}>Duration</th>
                <th style={{ padding: '12px 8px' }}>Cost</th>
                <th style={{ padding: '12px 8px' }}>Mood</th>
                <th style={{ padding: '12px 8px' }}>Stage</th>
                <th style={{ padding: '12px 8px' }}>Recording</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '32px', textAlign: 'center', color: 'var(--label-tertiary)' }}>
                    No calls match this filter.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const s = c.lead;
                  return (
                    <tr
                      key={c.log.id}
                      onClick={() => setSelectedId(c.log.id)}
                      style={{ borderBottom: '1px solid var(--separator)', cursor: 'pointer' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--fill-quaternary)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '10px 8px' }}><OutcomeBadge outcome={c.outcome} compact /></td>
                      <td style={{ padding: '10px 8px', fontWeight: 700, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {s?.company_name ?? (
                          <span style={{ color: 'var(--label-tertiary)', fontWeight: 400 }}>
                            {c.log.customer_name ?? '—'}
                          </span>
                        )}
                        {s && (
                          <span style={{ display: 'block', fontSize: '10.5px', color: 'var(--label-tertiary)', fontWeight: 400 }}>
                            {s.city ? `${s.city}, ${s.region}` : s.region}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '10px 8px' }}>{c.log.customer_phone ?? s?.phone ?? '—'}</td>
                      <td style={{ padding: '10px 8px', color: 'var(--label-secondary)' }}>
                        {c.at ? formatWhen(c.at) : '—'}
                      </td>
                      <td style={{ padding: '10px 8px' }}>{formatDuration(c.log.duration_seconds)}</td>
                      <td style={{ padding: '10px 8px' }}>{formatUsd(c.log.cost_usd)}</td>
                      <td
                        style={{
                          padding: '10px 8px',
                          color:
                            c.sentiment === 'positive'
                              ? 'var(--green)'
                              : c.sentiment === 'negative' || c.sentiment === 'not_interested'
                              ? 'var(--red)'
                              : 'var(--label-secondary)',
                        }}
                      >
                        {c.sentiment ? interestLabel(c.sentiment) : '—'}
                      </td>
                      <td style={{ padding: '10px 8px' }}>
                        {s ? (
                          <span className="badge badge-blue" style={{ fontSize: '10px' }}>
                            {stageLabel(s.current_stage)}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td style={{ padding: '10px 8px' }}>
                        {c.recordingUrl ? <PlayCircle size={14} style={{ color: 'var(--brand)' }} /> : '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {active && <CallDetailModal call={active} onClose={() => setSelectedId(null)} />}
    </div>
  );
}

function CallDetailModal({ call, onClose }: { call: VoiceCall; onClose: () => void }) {
  const { showToast } = useAppContext();
  const { log, lead, turns, recordingUrl } = call;
  const sentimentValue = lead?.voice_sentiment ?? null;
  const transcriptFallback = log.transcript ?? lead?.conversation_transcript_voice ?? null;

  const [copied, setCopied] = useState(false);
  const copyShareLink = () => {
    if (!lead) return;
    const url = `${window.location.origin}/share/voice/${encodeURIComponent(lead.id)}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    showToast('Public share link copied to clipboard.', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="spotlight-overlay" style={{ display: 'flex' }} onClick={onClose}>
      <div className="spotlight-panel" style={{ maxWidth: '740px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
        <div className="spotlight-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px' }}>
          <div>
            <span style={{ fontWeight: 700, fontSize: '17px', display: 'block' }}>
              {lead?.company_name ?? log.customer_name ?? 'Phone call'}
            </span>
            <span style={{ fontSize: '11.5px', color: 'var(--label-tertiary)' }}>
              {formatWhen(log.started_at)}{log.customer_name ? ` · spoke with ${log.customer_name}` : ''}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <OutcomeBadge outcome={call.outcome} />
            <button className="btn-icon" onClick={onClose}><X size={16} /></button>
          </div>
        </div>

        <div style={{ padding: '20px', borderTop: '1px solid var(--separator)', borderBottom: '1px solid var(--separator)', maxHeight: '64vh', overflowY: 'auto' }}>
          <SectionLabel>Call details</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '13px', marginBottom: '20px' }}>
            <DetailField label="Called" value={formatWhen(log.started_at)} />
            <DetailField label="Talk time" value={formatDuration(log.duration_seconds)} />
            <DetailField label="Number" value={log.customer_phone ?? lead?.phone ?? null} />
            <DetailField label="Calling cost" value={formatUsd(log.cost_usd)} />
            {lead && <DetailField label="Stage" value={<span className="badge badge-blue">{stageLabel(lead.current_stage)}</span>} />}
            {lead && <DetailField label="City" value={lead.city ? `${lead.city}, ${lead.region}` : lead.region} />}
            {lead && <DetailField label="Email" value={lead.email} />}
            {lead?.voice_note && <DetailField label="Note for the team" value={lead.voice_note} full />}
          </div>

          {recordingUrl && (
            <div style={{ marginBottom: '18px' }}>
              <SectionLabel icon={<PlayCircle size={12} />}>Recording</SectionLabel>
              <audio controls src={recordingUrl} style={{ width: '100%', marginTop: '8px' }} />
            </div>
          )}

          {log.summary && (
            <div style={{ marginBottom: '18px' }}>
              <SectionLabel>Summary</SectionLabel>
              <p style={{ fontSize: '13px', lineHeight: 1.55, color: 'var(--label-secondary)', marginTop: '6px', marginBottom: 0 }}>{log.summary}</p>
            </div>
          )}

          {sentimentValue && (
            <div style={{ marginBottom: '18px' }}>
              <SectionLabel>How it went</SectionLabel>
              <SentimentLine value={sentimentValue} />
            </div>
          )}

          <div>
            <SectionLabel>Conversation</SectionLabel>
            {turns.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--label-tertiary)', marginTop: '8px', whiteSpace: 'pre-wrap' }}>
                {transcriptFallback ?? 'Nothing was recorded for this call.'}
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                {turns.map((turn, idx) => {
                  const customer = turn.role === 'customer';
                  return (
                    <div
                      key={idx}
                      style={{
                        alignSelf: customer ? 'flex-start' : 'flex-end',
                        maxWidth: '80%',
                        background: customer ? 'var(--fill-tertiary)' : 'rgba(0, 82, 59, 0.08)',
                        padding: '9px 13px',
                        borderRadius: customer ? '2px 12px 12px 12px' : '12px 2px 12px 12px',
                      }}
                    >
                      <span style={{ fontSize: '10px', color: 'var(--label-tertiary)', fontWeight: 600, display: 'block', marginBottom: '3px' }}>
                        {turn.role === 'customer' ? (log.customer_name ?? 'Lead') : turn.role === 'system' ? 'Note' : 'Aarav'}
                      </span>
                      <p style={{ fontSize: '13px', margin: 0, whiteSpace: 'pre-wrap', color: 'var(--label-primary)' }}>{turn.text}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '11px', color: 'var(--label-tertiary)' }}>
            {lead ? 'Anyone with the link can view this call, read-only.' : 'This call is not tied to a lead, so it cannot be shared.'}
          </span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn-secondary"
              onClick={copyShareLink}
              disabled={!lead}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', padding: '8px 14px', opacity: lead ? 1 : 0.5 }}
            >
              {copied ? <Check size={14} style={{ color: 'var(--green)' }} /> : <Link2 size={14} />}
              {copied ? 'Link copied' : 'Copy share link'}
            </button>
            <button className="btn-primary" onClick={onClose} style={{ fontSize: '12.5px', padding: '8px 14px' }}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <span
      style={{
        fontSize: '10.5px',
        color: 'var(--label-tertiary)',
        textTransform: 'uppercase',
        fontWeight: 700,
        letterSpacing: '0.04em',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginBottom: '8px',
      }}
    >
      {icon}
      {children}
    </span>
  );
}

function DetailField({ label, value, full = false }: { label: string; value: React.ReactNode; full?: boolean }) {
  return (
    <div style={{ gridColumn: full ? '1 / -1' : undefined }}>
      <span style={{ fontSize: '10.5px', color: 'var(--label-tertiary)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '2px' }}>
        {label}
      </span>
      <span style={{ color: 'var(--label-primary)', wordBreak: 'break-word' }}>
        {value ?? <span style={{ color: 'var(--label-tertiary)', fontStyle: 'italic' }}>—</span>}
      </span>
    </div>
  );
}

/* ---------------------------- Analytics ---------------------------- */

function VoiceAnalytics({ calls }: { calls: VoiceCall[] }) {
  const connected = calls.filter((c) => c.connected);
  const connectRate = calls.length > 0 ? Math.round((connected.length / calls.length) * 100) : 0;

  const outcomeCounts = ((): [CallOutcome, number][] => {
    const m = new Map<CallOutcome, number>();
    for (const c of calls) m.set(c.outcome, (m.get(c.outcome) ?? 0) + 1);
    return (['connected', 'voicemail', 'no_answer', 'unknown'] as CallOutcome[])
      .map((o) => [o, m.get(o) ?? 0] as [CallOutcome, number])
      .filter(([, n]) => n > 0);
  })();

  const sentimentCounts = ((): [string, number][] => {
    const m = new Map<string, number>();
    for (const c of calls) {
      if (!c.sentiment) continue;
      m.set(c.sentiment, (m.get(c.sentiment) ?? 0) + 1);
    }
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  })();

  const totalCost = calls.reduce((s, c) => s + (c.log.cost_usd ?? 0), 0);
  const avgCost = calls.length ? totalCost / calls.length : 0;
  const totalTalkSec = connected.reduce((s, c) => s + (c.log.duration_seconds ?? 0), 0);
  const avgTalkSec = connected.length ? totalTalkSec / connected.length : 0;

  const withLead = calls.filter((c) => c.lead);
  const wonCount = withLead.filter((c) => c.lead!.current_stage === 'won').length;
  const lostCount = withLead.filter((c) => c.lead!.current_stage === 'lost').length;
  const positive = calls.filter((c) => c.sentiment === 'positive').length;

  return (
    <>
      <div className="metrics-grid mb-24">
        <Tile accent="var(--purple)" label="Calls placed" value={calls.length} icon={<PhoneCall size={12} />} sub={`${withLead.length} tied to a lead`} />
        <Tile accent="var(--green)" label="Pick-up rate" value={`${connectRate}%`} icon={<CheckCheck size={12} />} sub={`${connected.length} of ${calls.length} picked up`} />
        <Tile accent="var(--blue)" label="Average talk time" value={formatDuration(avgTalkSec)} icon={<Clock size={12} />} sub={`${formatDuration(totalTalkSec)} total`} />
        <Tile accent="var(--orange)" label="Calling cost" value={formatUsd(totalCost)} icon={<IndianRupee size={12} />} sub={`${formatUsd(avgCost)} / call`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        <div className="liquid-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>How calls ended</h3>
          {outcomeCounts.length === 0 ? (
            <span style={{ fontSize: '13px', color: 'var(--label-tertiary)' }}>No calls in this date range.</span>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {outcomeCounts.map(([o, count]) => {
                const total = outcomeCounts.reduce((n, [, c]) => n + c, 0);
                const pct = Math.round((count / total) * 100);
                const color =
                  o === 'connected' ? 'var(--brand)' : o === 'voicemail' ? 'var(--brand-gold)' : o === 'no_answer' ? 'var(--red)' : 'var(--label-tertiary)';
                return (
                  <div key={o} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '12px', width: '110px', flexShrink: 0 }}>{o === 'connected' ? 'Picked up' : o === 'voicemail' ? 'Voicemail' : o === 'no_answer' ? 'No answer' : 'Unknown'}</span>
                    <div style={{ flex: 1, height: '12px', borderRadius: '6px', background: 'var(--fill-tertiary)', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: color }} />
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: '700', width: '32px', textAlign: 'right' }}>{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="liquid-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>How leads sounded</h3>
          {sentimentCounts.length === 0 ? (
            <span style={{ fontSize: '13px', color: 'var(--label-tertiary)' }}>Nothing to show yet.</span>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {sentimentCounts.map(([s, count]) => {
                const total = sentimentCounts.reduce((n, [, c]) => n + c, 0);
                const pct = Math.round((count / total) * 100);
                const color = s.startsWith('pos') ? 'var(--brand)' : s.startsWith('neg') || s === 'not_interested' ? 'var(--red)' : 'var(--brand-gold)';
                return (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '12px', width: '110px', flexShrink: 0 }}>{interestLabel(s)}</span>
                    <div style={{ flex: 1, height: '12px', borderRadius: '6px', background: 'var(--fill-tertiary)', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: color }} />
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: '700', width: '32px', textAlign: 'right' }}>{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="liquid-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Call funnel</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <FunnelRow label="Calls placed" value={calls.length} max={Math.max(calls.length, 1)} color="var(--blue)" />
            <FunnelRow label="Picked up" value={connected.length} max={Math.max(calls.length, 1)} color="var(--purple)" />
            <FunnelRow label="Positive calls" value={positive} max={Math.max(calls.length, 1)} color="var(--orange)" />
            <FunnelRow label="Won" value={wonCount} max={Math.max(calls.length, 1)} color="var(--green)" />
            <FunnelRow label="Lost" value={lostCount} max={Math.max(calls.length, 1)} color="var(--red)" />
          </div>
        </div>
      </div>
    </>
  );
}

/* ------------------------------ Shared ------------------------------ */

function OutcomeBadge({ outcome, compact = false }: { outcome: CallOutcome; compact?: boolean }) {
  const map: Record<CallOutcome, { cls: string; label: string; Icon: typeof Phone }> = {
    connected: { cls: 'badge-green', label: 'Picked up', Icon: PhoneCall },
    voicemail: { cls: 'badge-orange', label: 'Voicemail', Icon: Voicemail },
    no_answer: { cls: 'badge-red', label: 'No answer', Icon: PhoneOff },
    unknown: { cls: 'badge-blue', label: 'Unknown', Icon: Phone },
  };
  const { cls, label, Icon } = map[outcome];
  return (
    <span className={`badge ${cls}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
      <Icon size={compact ? 10 : 11} />
      {label}
    </span>
  );
}

function SentimentLine({ value }: { value: string }) {
  const { interest, intent, summary } = parseSentiment(value);
  const color =
    interest === 'positive' ? 'var(--brand)' : interest === 'negative' || interest === 'not_interested' ? 'var(--red)' : 'var(--brand-gold)';
  return (
    <div style={{ marginTop: '6px' }}>
      <span style={{ fontSize: '13px', fontWeight: 700, color }}>{interest ? interestLabel(interest) : '—'}</span>
      {intent && <span style={{ fontSize: '12px', color: 'var(--label-secondary)' }}> · {intentLabel(intent)}</span>}
      {summary && <p style={{ fontSize: '12px', color: 'var(--label-tertiary)', marginTop: '4px', marginBottom: 0 }}>{summary}</p>}
    </div>
  );
}

function Tile({ accent, label, value, icon, sub }: { accent: string; label: string; value: React.ReactNode; icon: React.ReactNode; sub: string }) {
  return (
    <div className="metric-tile liquid-card" style={{ '--tile-accent-color': accent } as React.CSSProperties}>
      <span className="label">{label}</span>
      <span className="value">{value}</span>
      <span className="trend up" style={{ color: accent }}>{icon} {sub}</span>
    </div>
  );
}

function FunnelRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <span style={{ fontSize: '12px', width: '150px', flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: '12px', borderRadius: '6px', background: 'var(--fill-tertiary)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color }} />
      </div>
      <span style={{ fontSize: '12px', fontWeight: '700', width: '36px', textAlign: 'right' }}>{value}</span>
    </div>
  );
}

