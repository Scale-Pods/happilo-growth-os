'use client';

import React, { useMemo, useState } from 'react';
import { useAppContext } from '../../ClientWrapper';
import { Phone, PhoneCall, Search, Clock, Reply, TrendingUp } from 'lucide-react';
import { isWithinDateRange } from '@/lib/dateRangeFilter';
import {
  parseConversationTimestamp,
  formatINR,
  outreachOwedAmount,
  callStep,
  type RecoveryOutreachRow,
} from '@/lib/data/receivables';
import { CallTranscriptView, ActivityLink, callStatusLabel, shortDate } from '../_components/Conversations';

type VoiceView = 'dashboard' | 'logs' | 'analytics';

interface CallItem {
  row: RecoveryOutreachRow;
  step: number; // 1-8
  content: string;
  status: string | null;
  sentAt: string | null;
  sentAtDate: Date | null;
  sentiment: string | null;
  note: string | null;
  recordingUrl: string | null;
  duration: string | null;
  promiseDate: string | null;
}

function collectCalls(rows: RecoveryOutreachRow[]): CallItem[] {
  const out: CallItem[] = [];
  for (const row of rows) {
    for (let n = 1; n <= 8; n++) {
      const { content, status, sent_at: sentAt, sentiment, note, recording_url: recordingUrl, duration, promise_date: promiseDate } = callStep(row, n as 1);
      if (!sentAt) continue;
      if (!content || !content.trim()) continue;
      out.push({ row, step: n, content, status, sentAt, sentAtDate: parseConversationTimestamp(sentAt), sentiment, note, recordingUrl, duration, promiseDate });
    }
  }
  return out;
}

/** A call counts as answered when it connected and a sentiment was recorded. */
function hasReply(c: CallItem): boolean {
  return Boolean(c.sentiment && c.sentiment.trim());
}

export default function VoiceSection({ rows, view }: { rows: RecoveryOutreachRow[]; view: VoiceView }) {
  const { dateRange, dateLabel } = useAppContext();

  const calls = useMemo(() => {
    return collectCalls(rows)
      .filter((c) => (c.sentAtDate ? isWithinDateRange(c.sentAtDate, dateRange) : true))
      .sort((a, b) => (b.sentAtDate?.getTime() ?? 0) - (a.sentAtDate?.getTime() ?? 0));
  }, [rows, dateRange]);

  const header = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
      <div>
        <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--label-primary)', margin: 0 }}>
          {view === 'dashboard' && 'Voice — Dashboard'}
          {view === 'logs' && 'Voice — Call Logs'}
          {view === 'analytics' && 'Voice — Analytics'}
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--label-secondary)', marginTop: '4px', marginBottom: 0 }}>
          Collection call log for credit customers
          {dateLabel ? ` · ${dateLabel}` : ''}.
        </p>
      </div>
    </div>
  );

  return (
    <div style={{ animation: 'fadeIn 300ms ease' }}>
      {header}
      {view === 'dashboard' && <VoiceDashboard calls={calls} />}
      {view === 'logs' && <VoiceLogs calls={calls} />}
      {view === 'analytics' && <VoiceAnalytics calls={calls} />}
    </div>
  );
}

/* ----------------------------- Dashboard ----------------------------- */

function VoiceDashboard({ calls }: { calls: CallItem[] }) {
  const replied = calls.filter(hasReply).length;
  const replyRate = calls.length > 0 ? Math.round((replied / calls.length) * 100) : 0;
  const outstandingInPlay = useMemo(() => {
    const seen = new Set<number>();
    let sum = 0;
    for (const c of calls) {
      if (seen.has(c.row.id)) continue;
      seen.add(c.row.id);
      sum += outreachOwedAmount(c.row);
    }
    return sum;
  }, [calls]);

  const recent = calls.slice(0, 8);

  return (
    <>
      <div className="metrics-grid mb-24">
        <Tile accent="var(--purple)" label="Calls Placed" value={calls.length} icon={<PhoneCall size={12} />} sub="In range" />
        <Tile accent="var(--green)" label="Calls Connected" value={replied} icon={<Reply size={12} />} sub={`${calls.filter((c) => c.promiseDate).length} with a promise to pay`} />
        <Tile accent="var(--blue)" label="Connect Rate" value={`${replyRate}%`} icon={<Phone size={12} />} sub={`${calls.length - replied} no answer or voicemail`} />
        <Tile accent="var(--orange)" label="Final Amount in Calls" value={formatINR(outstandingInPlay)} icon={<Clock size={12} />} sub="Across parties called" />
      </div>

      <div className="liquid-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Recent Calls</h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--separator)' }}>
                <th style={{ padding: '12px 8px' }}>Party</th>
                <th style={{ padding: '12px 8px' }}>Phone</th>
                <th style={{ padding: '12px 8px' }}>Step</th>
                <th style={{ padding: '12px 8px' }}>Outcome</th>
                <th style={{ padding: '12px 8px' }}>Promise to pay</th>
                <th style={{ padding: '12px 8px' }}>Called</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: 'var(--label-tertiary)' }}>No calls in range.</td></tr>
              ) : (
                recent.map((c, i) => (
                  <tr key={`${c.row.id}-${c.step}-${i}`} style={{ borderBottom: '1px solid var(--separator)' }}>
                    <td style={{ padding: '12px 8px', fontWeight: '700' }}>{c.row.party_name ?? '—'}</td>
                    <td style={{ padding: '12px 8px' }}>{c.row.phone ?? '—'}</td>
                    <td style={{ padding: '12px 8px' }}><span className="badge badge-blue">Call {c.step}</span></td>
                    <td style={{ padding: '12px 8px' }}>
                      <span className={`badge ${hasReply(c) ? 'badge-green' : 'badge-orange'}`}>{callStatusLabel(c.status)}{c.duration ? ` · ${c.duration}` : ''}</span>
                    </td>
                    <td style={{ padding: '12px 8px', fontWeight: 600 }}>{c.promiseDate ?? '—'}</td>
                    <td style={{ padding: '12px 8px', fontSize: '11.5px', color: 'var(--label-tertiary)' }}>{c.sentAt ?? '—'}</td>
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

/* -------------------------------- Logs -------------------------------- */

function VoiceLogs({ calls }: { calls: CallItem[] }) {
  const [search, setSearch] = useState('');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return calls;
    return calls.filter((c) =>
      [c.row.party_name, c.row.phone, c.row.bill_no].filter(Boolean).some((v) => String(v).toLowerCase().includes(q))
    );
  }, [calls, search]);

  const keyOf = (c: CallItem) => `${c.row.id}-${c.step}`;
  const active = filtered.find((c) => keyOf(c) === selectedKey) ?? filtered[0] ?? null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 340px) minmax(0, 1fr)', gap: '24px', alignItems: 'start' }}>
      <div className="liquid-card" style={{ padding: '16px' }}>
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--label-tertiary)' }} />
          <input
            type="text"
            placeholder="Search party or phone..."
            className="input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '8px 12px 8px 30px', fontSize: '13px' }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '560px', overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--label-tertiary)', fontSize: '13px' }}>No calls in range.</div>
          ) : (
            filtered.map((c) => (
              <button
                key={keyOf(c)}
                onClick={() => setSelectedKey(keyOf(c))}
                style={{
                  display: 'flex', flexDirection: 'column', gap: '3px', textAlign: 'left',
                  padding: '10px 12px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                  background: active && keyOf(active) === keyOf(c) ? 'var(--fill-tertiary)' : 'transparent',
                }}
              >
                <span style={{ fontSize: '13px', fontWeight: '700', display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                  {c.row.party_name ?? '—'}
                  <span className="badge badge-blue" style={{ flexShrink: 0 }}>Call {c.step}</span>
                </span>
                <span style={{ fontSize: '11px', color: 'var(--label-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.note ?? ''}</span>
                <span style={{ fontSize: '10.5px', color: 'var(--label-tertiary)', display: 'flex', justifyContent: 'space-between', gap: '6px' }}>
                  <span>{shortDate(c.sentAtDate)}</span>
                  <span style={{ color: hasReply(c) ? 'var(--green)' : 'var(--orange)', fontWeight: 600 }}>{callStatusLabel(c.status)}{c.duration ? ` · ${c.duration}` : ''}</span>
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="liquid-card" style={{ padding: '20px', minHeight: '400px' }}>
        {!active ? (
          <div style={{ textAlign: 'center', color: 'var(--label-tertiary)', padding: '60px 0' }}>Select a call.</div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', gap: '8px', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', margin: 0 }}>{active.row.party_name ?? '—'} · Call {active.step}</h3>
              <ActivityLink party={active.row.party_name} />
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--label-tertiary)', marginBottom: '14px' }}>
              {active.row.phone ?? '—'} · Bill {active.row.bill_no ?? '—'} · Outstanding {formatINR(outreachOwedAmount(active.row))}
            </div>
            <div style={{ maxHeight: '640px', overflowY: 'auto', paddingRight: '4px' }}>
              <CallTranscriptView
                call={{
                  step: active.step,
                  status: active.status,
                  sentAt: active.sentAt,
                  sentiment: active.sentiment,
                  note: active.note,
                  content: active.content,
                  duration: active.duration,
                  promiseDate: active.promiseDate,
                  recordingUrl: active.recordingUrl,
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------ Analytics ------------------------------ */

function VoiceAnalytics({ calls }: { calls: CallItem[] }) {
  const replied = calls.filter(hasReply);
  const replyRate = calls.length > 0 ? Math.round((replied.length / calls.length) * 100) : 0;

  const stepCounts = useMemo(() => {
    const counts = new Array(8).fill(0);
    for (const c of calls) counts[c.step - 1]++;
    return counts;
  }, [calls]);

  const sentimentCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of calls) {
      if (!c.sentiment) continue;
      const s = c.sentiment.trim().toLowerCase();
      m.set(s, (m.get(s) ?? 0) + 1);
    }
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [calls]);

  const { recoveredValue, openValue } = useMemo(() => {
    const seen = new Set<number>();
    let recovered = 0;
    let open = 0;
    for (const c of calls) {
      if (seen.has(c.row.id)) continue;
      seen.add(c.row.id);
      const amt = outreachOwedAmount(c.row);
      const isClosed = String(c.row.closed).toLowerCase() === 'yes' || String(c.row.status).toLowerCase() === 'closed';
      if (isClosed) recovered += amt;
      else open += amt;
    }
    return { recoveredValue: recovered, openValue: open };
  }, [calls]);

  return (
    <>
      <div className="metrics-grid mb-24">
        <Tile accent="var(--purple)" label="Calls Placed" value={calls.length} icon={<PhoneCall size={12} />} sub="In range" />
        <Tile accent="var(--blue)" label="Reply Rate" value={`${replyRate}%`} icon={<Reply size={12} />} sub={`${replied.length}/${calls.length} calls`} />
        <Tile accent="var(--green)" label="Recovered Value" value={formatINR(recoveredValue)} icon={<TrendingUp size={12} />} sub="Closed accounts" />
        <Tile accent="var(--orange)" label="Still Open" value={formatINR(openValue)} icon={<Clock size={12} />} sub="Open accounts" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        <div className="liquid-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Calls by Step</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {stepCounts.map((count, i) => {
              const max = Math.max(...stepCounts, 1);
              const pct = Math.round((count / max) * 100);
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '12px', width: '56px', flexShrink: 0 }}>Call {i + 1}</span>
                  <div style={{ flex: 1, height: '12px', borderRadius: '6px', background: 'var(--fill-tertiary)', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'var(--purple)' }} />
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: '700', width: '32px', textAlign: 'right' }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="liquid-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Sentiment Distribution</h3>
          {sentimentCounts.length === 0 ? (
            <span style={{ fontSize: '13px', color: 'var(--label-tertiary)' }}>No sentiment data.</span>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {sentimentCounts.map(([s, count]) => {
                const total = sentimentCounts.reduce((n, [, c]) => n + c, 0);
                const pct = Math.round((count / total) * 100);
                const color = s.startsWith('pos') ? 'var(--green)' : s.startsWith('neg') ? 'var(--red)' : 'var(--orange)';
                return (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '12px', width: '90px', flexShrink: 0, textTransform: 'capitalize' }}>{s}</span>
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
          <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Recovered vs Open Value</h3>
          <div style={{ height: '24px', display: 'flex', borderRadius: '12px', overflow: 'hidden', background: 'var(--fill-tertiary)', marginBottom: '16px' }}>
            {(() => {
              const total = recoveredValue + openValue || 1;
              const cPct = Math.round((recoveredValue / total) * 100);
              return (
                <>
                  <div style={{ width: `${cPct}%`, background: 'var(--green)' }} />
                  <div style={{ width: `${100 - cPct}%`, background: 'var(--orange)' }} />
                </>
              );
            })()}
          </div>
          <div style={{ display: 'flex', gap: '20px', fontSize: '13px' }}>
            <div><span style={{ color: 'var(--green)', fontWeight: 700 }}>{formatINR(recoveredValue)}</span><div style={{ fontSize: '11px', color: 'var(--label-tertiary)' }}>Recovered</div></div>
            <div><span style={{ color: 'var(--orange)', fontWeight: 700 }}>{formatINR(openValue)}</span><div style={{ fontSize: '11px', color: 'var(--label-tertiary)' }}>Open</div></div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ------------------------------- Shared ------------------------------- */

function Tile({
  accent,
  label,
  value,
  icon,
  sub,
}: {
  accent: string;
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  sub: string;
}) {
  return (
    <div className="metric-tile liquid-card" style={{ '--tile-accent-color': accent } as React.CSSProperties}>
      <span className="label">{label}</span>
      <span className="value">{value}</span>
      <span className="trend up" style={{ color: accent }}>{icon} {sub}</span>
    </div>
  );
}
