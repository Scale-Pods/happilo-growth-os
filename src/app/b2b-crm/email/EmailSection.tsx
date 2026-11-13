'use client';

import React, { useMemo, useState } from 'react';
import { useAppContext } from '../../ClientWrapper';
import { Send, Inbox, Reply, Search, Clock, MessageSquareText, X } from 'lucide-react';
import { isWithinDateRange } from '@/lib/dateRangeFilter';
import { normalizeTranscript } from '@/lib/data/transcript';
import { parseSentiment, stageLabel, interestLabel, formatWhen, type Lead, type TranscriptEntry } from '@/lib/data/b2bCrm';

type EmailView = 'dashboard' | 'inbox' | 'analytics';

interface EmailThread {
  lead: Lead;
  entries: TranscriptEntry[];
  lastAt: string | null;
}

function buildThreads(leads: Lead[]): EmailThread[] {
  return leads
    .map((lead) => {
      const entries = normalizeTranscript(lead.conversation_transcript_email)
        .slice()
        .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
      return { lead, entries, lastAt: entries[entries.length - 1]?.at ?? null };
    })
    .filter((t) => t.entries.length > 0);
}

export default function EmailSection({ leads, view }: { leads: Lead[]; view: EmailView }) {
  const { dateRange, dateLabel } = useAppContext();

  const threads = useMemo(() => {
    return buildThreads(leads)
      .filter((t) => (t.lastAt ? isWithinDateRange(t.lastAt, dateRange) : true))
      .sort((a, b) => new Date(b.lastAt ?? 0).getTime() - new Date(a.lastAt ?? 0).getTime());
  }, [leads, dateRange]);

  // All outbound / inbound email messages in range (message-level, filtered on the message's own `at`).
  const messages = useMemo(() => {
    const rows: Array<{ lead: Lead; entry: TranscriptEntry }> = [];
    for (const t of buildThreads(leads)) {
      for (const entry of t.entries) {
        if (isWithinDateRange(entry.at, dateRange)) rows.push({ lead: t.lead, entry });
      }
    }
    return rows.sort((a, b) => new Date(b.entry.at).getTime() - new Date(a.entry.at).getTime());
  }, [leads, dateRange]);

  const sent = useMemo(() => messages.filter((m) => m.entry.direction === 'outbound'), [messages]);
  const received = useMemo(() => messages.filter((m) => m.entry.direction === 'inbound'), [messages]);

  return (
    <div style={{ animation: 'fadeIn 300ms ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--label-primary)', margin: 0 }}>
            {view === 'dashboard' && 'Email overview'}
            {view === 'inbox' && 'Email inbox'}
            {view === 'analytics' && 'Email analytics'}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--label-secondary)', marginTop: '4px', marginBottom: 0 }}>
            Email conversations with gifting, retail and distributor leads{dateLabel ? ` · ${dateLabel}` : ''}.
          </p>
        </div>
      </div>

      {view === 'dashboard' && <EmailDashboard threads={threads} sent={sent} received={received} />}
      {view === 'inbox' && <EmailInbox threads={threads} />}
      {view === 'analytics' && <EmailAnalytics threads={threads} sent={sent} received={received} />}
    </div>
  );
}

/* ----------------------------- Dashboard ----------------------------- */

function EmailDashboard({
  threads,
  sent,
  received,
}: {
  threads: EmailThread[];
  sent: Array<{ lead: Lead; entry: TranscriptEntry }>;
  received: Array<{ lead: Lead; entry: TranscriptEntry }>;
}) {
  const repliedThreads = threads.filter((t) => t.entries.some((e) => e.direction === 'inbound'));
  const awaiting = threads.length - repliedThreads.length;
  const replyRate = threads.length > 0 ? Math.round((repliedThreads.length / threads.length) * 100) : 0;

  const stageCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of threads) {
      const s = (t.lead.current_stage || 'unknown').trim();
      m.set(s, (m.get(s) ?? 0) + 1);
    }
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [threads]);

  const recent = sent.slice(0, 8);

  return (
    <>
      <div className="metrics-grid mb-24">
        <Tile accent="var(--blue)" label="Emails sent" value={sent.length} icon={<Send size={12} />} sub="In this date range" />
        <Tile accent="var(--green)" label="Conversations replied" value={repliedThreads.length} icon={<Reply size={12} />} sub={`${replyRate}% reply rate`} />
        <Tile accent="var(--orange)" label="Waiting for reply" value={awaiting} icon={<Clock size={12} />} sub="No answer yet" />
        <Tile accent="var(--purple)" label="Emails received" value={received.length} icon={<Inbox size={12} />} sub="From leads" />
      </div>

      <div className="liquid-card mb-24" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Email conversations by stage</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {stageCounts.length === 0 ? (
            <span style={{ fontSize: '13px', color: 'var(--label-tertiary)' }}>No email conversations yet.</span>
          ) : (
            stageCounts.map(([stage, count]) => {
              const pct = Math.round((count / threads.length) * 100);
              return (
                <div key={stage} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '12px', width: '150px', flexShrink: 0 }}>{stageLabel(stage)}</span>
                  <div style={{ flex: 1, height: '10px', borderRadius: '6px', background: 'var(--fill-tertiary)', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'var(--brand-mid)' }} />
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: '700', width: '40px', textAlign: 'right' }}>{count}</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="liquid-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Recently sent</h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--separator)' }}>
                <th style={{ padding: '12px 8px' }}>Company</th>
                <th style={{ padding: '12px 8px' }}>City</th>
                <th style={{ padding: '12px 8px' }}>Stage</th>
                <th style={{ padding: '12px 8px' }}>Sent</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: 'var(--label-tertiary)' }}>No emails sent in this date range.</td></tr>
              ) : (
                recent.map((m, i) => (
                  <tr key={`${m.lead.id}-${i}`} style={{ borderBottom: '1px solid var(--separator)' }}>
                    <td style={{ padding: '12px 8px', fontWeight: '700' }}>{m.lead.company_name}</td>
                    <td style={{ padding: '12px 8px' }}>{m.lead.city ? `${m.lead.city}, ${m.lead.region}` : m.lead.region}</td>
                    <td style={{ padding: '12px 8px' }}><span className="badge badge-blue">{stageLabel(m.lead.current_stage)}</span></td>
                    <td style={{ padding: '12px 8px', fontSize: '11.5px', color: 'var(--label-tertiary)' }}>{formatWhen(m.entry.at)}</td>
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

/* ------------------------------- Inbox ------------------------------- */

function EmailInbox({ threads }: { threads: EmailThread[] }) {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter((t) =>
      [t.lead.company_name, t.lead.email, t.lead.city].filter(Boolean).some((v) => String(v).toLowerCase().includes(q))
    );
  }, [threads, search]);

  const active = filtered.find((t) => t.lead.id === selectedId) ?? filtered[0] ?? null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '24px', alignItems: 'start' }}>
      <div className="liquid-card" style={{ padding: '16px' }}>
        <SearchBox value={search} onChange={setSearch} placeholder="Search company or email..." />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '620px', overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <Empty text="No email conversations match." />
          ) : (
            filtered.map((t) => {
              const last = t.entries[t.entries.length - 1];
              const replied = t.entries.some((e) => e.direction === 'inbound');
              return (
                <button key={t.lead.id} onClick={() => setSelectedId(t.lead.id)} style={rowBtnStyle(active?.lead.id === t.lead.id)}>
                  <span style={{ fontSize: '13px', fontWeight: '700', display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                    {t.lead.company_name}
                    <span className={`badge ${replied ? 'badge-green' : 'badge-orange'}`} style={{ flexShrink: 0 }}>{replied ? 'Replied' : 'Waiting'}</span>
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--label-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {last ? `${last.direction === 'inbound' ? '← ' : '→ '}${stripLines(last.message).slice(0, 58)}` : ''}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="liquid-card" style={{ padding: '20px', minHeight: '420px' }}>
        {!active ? (
          <Empty text="Pick a conversation from the list." pad />
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '8px', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', margin: 0 }}>{active.lead.company_name}</h3>
              <span style={{ fontSize: '11.5px', color: 'var(--label-tertiary)' }}>{active.lead.email ?? '—'}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '560px', overflowY: 'auto' }}>
              {active.entries.map((entry, idx) => {
                const inbound = entry.direction === 'inbound';
                return (
                  <div
                    key={idx}
                    style={{
                      background: inbound ? 'var(--fill-tertiary)' : 'rgba(0, 82, 59, 0.06)',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      borderLeft: `3px solid ${inbound ? 'var(--green)' : 'var(--blue)'}`,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '10.5px', color: 'var(--label-tertiary)', fontWeight: 600 }}>{inbound ? 'Lead' : 'Happilo'}</span>
                      <span style={{ fontSize: '10.5px', color: 'var(--label-tertiary)' }}>{formatWhen(entry.at)}</span>
                    </div>
                    <MessageBody text={entry.message} compact />
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------------------- Analytics ---------------------------- */

function EmailAnalytics({
  threads,
  sent,
  received,
}: {
  threads: EmailThread[];
  sent: Array<{ lead: Lead; entry: TranscriptEntry }>;
  received: Array<{ lead: Lead; entry: TranscriptEntry }>;
}) {
  const repliedThreads = threads.filter((t) => t.entries.some((e) => e.direction === 'inbound'));
  const replyRate = threads.length > 0 ? Math.round((repliedThreads.length / threads.length) * 100) : 0;

  const responseHours: number[] = [];
  for (const t of threads) {
    const firstOut = t.entries.find((e) => e.direction === 'outbound')?.at ?? null;
    const firstIn = t.entries.find((e) => e.direction === 'inbound')?.at ?? null;
    if (firstOut && firstIn && new Date(firstIn).getTime() > new Date(firstOut).getTime()) {
      responseHours.push((new Date(firstIn).getTime() - new Date(firstOut).getTime()) / 3_600_000);
    }
  }
  const avgResponse = responseHours.length ? responseHours.reduce((a, b) => a + b, 0) / responseHours.length : null;

  const sentimentCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of threads) {
      const s = parseSentiment(t.lead.email_sentiment).interest;
      if (!s) continue;
      m.set(s, (m.get(s) ?? 0) + 1);
    }
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [threads]);

  const wonCount = threads.filter((t) => t.lead.current_stage === 'won').length;
  const lostCount = threads.filter((t) => t.lead.current_stage === 'lost').length;
  const avgMessages = threads.length ? (threads.reduce((n, t) => n + t.entries.length, 0) / threads.length) : 0;

  return (
    <>
      <div className="metrics-grid mb-24">
        <Tile accent="var(--blue)" label="Emails sent" value={sent.length} icon={<Send size={12} />} sub={`${received.length} received`} />
        <Tile accent="var(--green)" label="Reply rate" value={`${replyRate}%`} icon={<Reply size={12} />} sub={`${repliedThreads.length} of ${threads.length} conversations`} />
        <Tile accent="var(--purple)" label="Average reply time" value={avgResponse != null ? `${avgResponse.toFixed(1)}h` : '—'} icon={<Clock size={12} />} sub="Until the first reply" />
        <Tile accent="var(--orange)" label="Emails per conversation" value={avgMessages.toFixed(1)} icon={<MessageSquareText size={12} />} sub={`${threads.length} conversations`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        <div className="liquid-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>How leads feel</h3>
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
          <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Email funnel</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <FunnelRow label="Leads emailed" value={new Set(sent.map((m) => m.lead.id)).size} max={Math.max(threads.length, 1)} color="var(--blue)" />
            <FunnelRow label="Replied" value={repliedThreads.length} max={Math.max(threads.length, 1)} color="var(--purple)" />
            <FunnelRow label="Won" value={wonCount} max={Math.max(threads.length, 1)} color="var(--green)" />
            <FunnelRow label="Lost" value={lostCount} max={Math.max(threads.length, 1)} color="var(--red)" />
          </div>
        </div>

        <div className="liquid-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Sent vs received</h3>
          <div style={{ height: '24px', display: 'flex', borderRadius: '12px', overflow: 'hidden', background: 'var(--fill-tertiary)', marginBottom: '16px' }}>
            {(() => {
              const total = sent.length + received.length || 1;
              const sPct = Math.round((sent.length / total) * 100);
              return (
                <>
                  <div style={{ width: `${sPct}%`, background: 'var(--blue)' }} title={`Sent ${sent.length}`} />
                  <div style={{ width: `${100 - sPct}%`, background: 'var(--green)' }} title={`Received ${received.length}`} />
                </>
              );
            })()}
          </div>
          <div style={{ display: 'flex', gap: '20px', fontSize: '13px' }}>
            <div><span style={{ color: 'var(--blue)', fontWeight: 700 }}>{sent.length}</span><div style={{ fontSize: '11px', color: 'var(--label-tertiary)' }}>Sent</div></div>
            <div><span style={{ color: 'var(--green)', fontWeight: 700 }}>{received.length}</span><div style={{ fontSize: '11px', color: 'var(--label-tertiary)' }}>Received</div></div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ------------------------------ Shared ------------------------------ */

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

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div style={{ position: 'relative', marginBottom: '12px' }}>
      <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--label-tertiary)' }} />
      <input
        type="text"
        placeholder={placeholder}
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: '100%', padding: '8px 12px 8px 30px', fontSize: '13px' }}
      />
    </div>
  );
}

function Empty({ text, pad = false }: { text: string; pad?: boolean }) {
  return (
    <div style={{ padding: pad ? '60px 0' : '20px', textAlign: 'center', color: 'var(--label-tertiary)', fontSize: '13px' }}>{text}</div>
  );
}

function rowBtnStyle(activeRow: boolean): React.CSSProperties {
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    textAlign: 'left',
    padding: '10px 12px',
    borderRadius: '10px',
    border: 'none',
    cursor: 'pointer',
    background: activeRow ? 'var(--fill-tertiary)' : 'transparent',
  };
}

/** Renders an HTML email body sandboxed in an iframe, or plain text if it isn't HTML. */
function MessageBody({ text, compact = false }: { text: string; compact?: boolean }) {
  const looksHtml = /<\s*(html|body|table|div|p|h1|td|tr)[\s>]/i.test(text);
  const [open, setOpen] = useState(false);

  if (!looksHtml) {
    return <p style={{ fontSize: '13px', margin: 0, whiteSpace: 'pre-wrap', color: 'var(--label-secondary)' }}>{text}</p>;
  }

  return (
    <>
      <div style={{ border: '1px solid var(--separator)', borderRadius: '10px', overflow: 'hidden', background: '#fff' }}>
        <iframe
          title="email-body"
          srcDoc={text}
          sandbox=""
          style={{ width: '100%', height: compact ? '320px' : '520px', border: 'none', display: 'block' }}
        />
      </div>
      <button className="btn-secondary" onClick={() => setOpen(true)} style={{ marginTop: '8px', fontSize: '12px', padding: '6px 12px' }}>
        Open full size
      </button>
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(12,62,51,0.35)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '760px', maxWidth: '100%', height: '90vh', display: 'flex', flexDirection: 'column',
              background: 'var(--bg-layer1, #ffffff)', borderRadius: '14px', border: '1px solid var(--separator)',
              overflow: 'hidden', boxShadow: '0 24px 60px rgba(12,62,51,0.25)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid var(--separator)', flexShrink: 0 }}>
              <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--label-primary)' }}>Email preview</span>
              <button className="btn-icon" onClick={() => setOpen(false)}><X size={14} /></button>
            </div>
            <iframe title="email-full" srcDoc={text} sandbox="" style={{ flex: 1, width: '100%', border: 'none', background: '#fff', display: 'block' }} />
          </div>
        </div>
      )}
    </>
  );
}

function stripLines(s: string): string {
  return s.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}
