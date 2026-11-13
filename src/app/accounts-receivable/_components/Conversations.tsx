'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Check,
  CheckCheck,
  Paperclip,
  FileText,
  ChevronDown,
  ChevronRight,
  PhoneCall,
  PhoneMissed,
  Voicemail,
  CalendarCheck,
  Clock,
  History,
  CornerUpRight,
} from 'lucide-react';
import { parseConversationTimestamp, type ConversationEntry } from '@/lib/data/receivables';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = (n: number) => String(n).padStart(2, '0');

export function dayLabel(d: Date | null): string {
  if (!d) return '';
  return `${WEEKDAYS[d.getDay()]}, ${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
export function timeLabel(d: Date | null): string {
  if (!d) return '';
  const h = d.getHours();
  return `${((h + 11) % 12) + 1}:${pad(d.getMinutes())} ${h < 12 ? 'am' : 'pm'}`;
}
export function shortDate(d: Date | null): string {
  if (!d) return '—';
  return `${pad(d.getDate())} ${MONTHS[d.getMonth()]}, ${timeLabel(d)}`;
}

export function isInboundEntry(entry: ConversationEntry): boolean {
  const role = (entry.role || '').toLowerCase();
  return role !== 'business' && role !== 'system' && role !== 'agent';
}

/** Link to the per-party activity timeline. */
export function ActivityLink({ party, compact = false }: { party: string | null | undefined; compact?: boolean }) {
  if (!party) return null;
  return (
    <Link
      href={`/accounts-receivable/activity?party=${encodeURIComponent(party)}`}
      className={compact ? undefined : 'btn-secondary'}
      style={
        compact
          ? { fontSize: '11px', color: 'var(--blue)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }
          : { fontSize: '12px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }
      }
      onClick={(e) => e.stopPropagation()}
    >
      <History size={compact ? 11 : 13} /> All activity
    </Link>
  );
}

export function AttachmentChip({ name }: { name: string }) {
  return (
    <span
      title={name}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 9px', borderRadius: '8px',
        background: 'var(--bg-layer1, #fff)', border: '1px solid var(--separator)', fontSize: '11.5px',
        color: 'var(--label-primary)', maxWidth: '100%',
      }}
    >
      <FileText size={13} style={{ color: name.toLowerCase().endsWith('.pdf') ? 'var(--pink)' : 'var(--blue)', flexShrink: 0 }} />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
    </span>
  );
}

/* ------------------------------ WhatsApp ------------------------------ */

function Ticks({ state }: { state?: string }) {
  if (state === 'sent') return <Check size={13} style={{ color: 'var(--label-tertiary)' }} aria-label="Sent" />;
  if (state === 'delivered') return <CheckCheck size={13} style={{ color: 'var(--label-tertiary)' }} aria-label="Delivered" />;
  return <CheckCheck size={13} style={{ color: 'var(--green)' }} aria-label="Read" />;
}

/** WhatsApp-style chat: day separators, left/right bubbles, attachments, time and delivery ticks. */
export function WaChatView({ entries, partyLabel }: { entries: ConversationEntry[]; partyLabel: string }) {
  let lastDay = '';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {entries.map((entry, idx) => {
        const at = parseConversationTimestamp(entry.timestamp);
        const day = dayLabel(at);
        const showDay = day && day !== lastDay;
        lastDay = day || lastDay;
        const inbound = isInboundEntry(entry);
        const prev = entries[idx - 1];
        const sameSender = prev && !showDay && isInboundEntry(prev) === inbound;
        return (
          <React.Fragment key={idx}>
            {showDay && (
              <div style={{ alignSelf: 'center', margin: '10px 0 4px', padding: '4px 12px', borderRadius: '8px', background: 'var(--bg-layer1, #fff)', border: '1px solid var(--separator)', fontSize: '11px', color: 'var(--label-secondary)', fontWeight: 600 }}>
                {day}
              </div>
            )}
            <div
              style={{
                alignSelf: inbound ? 'flex-start' : 'flex-end',
                maxWidth: '76%',
                marginTop: sameSender ? 0 : '4px',
                background: inbound ? 'var(--bg-layer1, #fff)' : 'rgba(0, 82, 59, 0.10)',
                border: `1px solid ${inbound ? 'var(--separator)' : 'rgba(0, 82, 59, 0.18)'}`,
                padding: '7px 10px 5px',
                borderRadius: inbound ? (sameSender ? '10px' : '2px 10px 10px 10px') : sameSender ? '10px' : '10px 2px 10px 10px',
                boxShadow: '0 1px 1px rgba(12, 62, 51, 0.05)',
              }}
            >
              {!sameSender && (
                <span style={{ fontSize: '10.5px', fontWeight: 700, display: 'block', marginBottom: '2px', color: inbound ? 'var(--purple)' : 'var(--blue)' }}>
                  {inbound ? partyLabel : 'Happilo Accounts'}
                </span>
              )}
              {entry.attachments && entry.attachments.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', margin: '3px 0 5px' }}>
                  {entry.attachments.map((a) => <AttachmentChip key={a} name={a} />)}
                </div>
              )}
              <p style={{ fontSize: '13px', margin: 0, whiteSpace: 'pre-wrap', color: 'var(--label-primary)', lineHeight: 1.45 }}>{entry.message}</p>
              <span style={{ fontSize: '10px', color: 'var(--label-tertiary)', display: 'flex', alignItems: 'center', gap: '3px', justifyContent: 'flex-end', marginTop: '2px' }}>
                {timeLabel(at) || entry.timestamp}
                {!inbound && <Ticks state={entry.delivery} />}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* -------------------------------- Email -------------------------------- */

/** Email body with the plain-text invoice table kept aligned. */
export function EmailPlainBody({ text }: { text: string }) {
  const lines = text.split('\n');
  const start = lines.findIndex((l) => l.startsWith('Invoice No.'));
  const end = start >= 0 ? lines.findIndex((l, i) => i > start && l.startsWith('Total pending')) : -1;
  const fwdAt = lines.findIndex((l) => l.startsWith('---------- Forwarded message'));
  const para = (t: string, key: string) => (
    <p key={key} style={{ fontSize: '13px', margin: 0, whiteSpace: 'pre-wrap', color: 'var(--label-primary)', lineHeight: 1.55 }}>{t}</p>
  );
  const blocks: React.ReactNode[] = [];
  if (start >= 0 && end > start) {
    blocks.push(para(lines.slice(0, start).join('\n'), 'a'));
    blocks.push(
      <pre key="t" style={{ fontFamily: 'var(--font-mono, ui-monospace, Menlo, Consolas, monospace)', fontSize: '11.5px', background: 'var(--fill-quaternary)', border: '1px solid var(--separator)', borderRadius: '8px', padding: '10px 12px', overflowX: 'auto', margin: '6px 0', color: 'var(--label-primary)' }}>
        {lines.slice(start, end + 1).join('\n')}
      </pre>
    );
    blocks.push(para(lines.slice(end + 1).join('\n'), 'b'));
  } else if (fwdAt >= 0) {
    blocks.push(para(lines.slice(0, fwdAt).join('\n'), 'a'));
    blocks.push(
      <div key="q" style={{ borderLeft: '3px solid var(--separator)', paddingLeft: '12px', marginTop: '8px', color: 'var(--label-secondary)' }}>
        <p style={{ fontSize: '12px', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{lines.slice(fwdAt).join('\n')}</p>
      </div>
    );
  } else {
    blocks.push(para(text, 'a'));
  }
  return <div>{blocks}</div>;
}

function HeaderRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', gap: '6px', fontSize: '12px', lineHeight: 1.5 }}>
      <span style={{ width: '38px', flexShrink: 0, color: 'var(--label-tertiary)' }}>{label}</span>
      <span style={{ color: 'var(--label-primary)', wordBreak: 'break-word' }}>{value}</span>
    </div>
  );
}

export function EmailMessageCard({ entry, defaultOpen }: { entry: ConversationEntry; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const inbound = isInboundEntry(entry);
  const at = parseConversationTimestamp(entry.timestamp);
  const isFwd = (entry.subject ?? '').startsWith('Fwd:');
  const fromName = (entry.from ?? (inbound ? 'Customer' : 'Happilo Accounts')).replace(/\s*<.*>$/, '');
  const preview = entry.message.replace(/^Dear [^\n]*\n+/, '').replace(/\s+/g, ' ').slice(0, 110);
  return (
    <div style={{ border: '1px solid var(--separator)', borderRadius: '12px', background: 'var(--bg-layer1, #fff)', overflow: 'hidden', borderLeft: `3px solid ${inbound ? 'var(--purple)' : isFwd ? 'var(--orange)' : 'var(--blue)'}` }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 14px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
      >
        <span
          style={{
            width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: 700, color: '#fff', background: inbound ? 'var(--purple)' : 'var(--blue)',
          }}
        >
          {fromName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'baseline' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--label-primary)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              {fromName}
              {isFwd && <span className="badge badge-orange" style={{ fontSize: '10px' }}><CornerUpRight size={10} /> Forwarded internally</span>}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--label-tertiary)', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              {entry.attachments && entry.attachments.length > 0 && <Paperclip size={11} />}
              {at ? `${dayLabel(at)}, ${timeLabel(at)}` : entry.timestamp}
            </span>
          </span>
          {!open && <span style={{ display: 'block', fontSize: '12px', color: 'var(--label-tertiary)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{preview}</span>}
        </span>
        {open ? <ChevronDown size={14} style={{ color: 'var(--label-tertiary)', marginTop: '8px' }} /> : <ChevronRight size={14} style={{ color: 'var(--label-tertiary)', marginTop: '8px' }} />}
      </button>
      {open && (
        <div style={{ padding: '0 14px 14px 54px' }}>
          <div style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid var(--separator)' }}>
            <HeaderRow label="From" value={entry.from} />
            <HeaderRow label="To" value={entry.to} />
            <HeaderRow label="Cc" value={entry.cc} />
            <HeaderRow label="Subj." value={entry.subject} />
          </div>
          <EmailPlainBody text={entry.message} />
          {entry.attachments && entry.attachments.length > 0 && (
            <div style={{ marginTop: '12px' }}>
              <span style={{ fontSize: '10.5px', color: 'var(--label-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>
                {entry.attachments.length} attachment{entry.attachments.length > 1 ? 's' : ''}
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                {entry.attachments.map((a) => <AttachmentChip key={a} name={a} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Groups email entries into threads by their subject (ignoring Re:/Fwd:), oldest first. */
export function groupEmailThreads(entries: ConversationEntry[]): Array<{ subject: string; entries: ConversationEntry[] }> {
  const map = new Map<string, ConversationEntry[]>();
  for (const e of entries) {
    const key = (e.subject ?? e.stage ?? 'Email').replace(/^((Re|Fwd):\s*)+/i, '');
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(e);
  }
  return Array.from(map.entries()).map(([subject, list]) => ({ subject, entries: list }));
}

export function EmailThreadView({ subject, entries }: { subject: string; entries: ConversationEntry[] }) {
  const replies = entries.filter(isInboundEntry).length;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
        <h4 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--label-primary)' }}>{subject}</h4>
        <span className="badge badge-grey">{entries.length} message{entries.length > 1 ? 's' : ''}</span>
        {replies > 0 ? <span className="badge badge-green">{replies} repl{replies > 1 ? 'ies' : 'y'}</span> : <span className="badge badge-orange">No reply yet</span>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {entries.map((e, i) => (
          <EmailMessageCard key={`${e.timestamp}-${i}`} entry={e} defaultOpen={i === 0 || i === entries.length - 1} />
        ))}
      </div>
    </div>
  );
}

/* -------------------------------- Calls -------------------------------- */

export interface CallView {
  step: number;
  status: string | null;
  sentAt: string | null;
  sentiment: string | null;
  note: string | null;
  content: string;
  duration: string | null;
  promiseDate: string | null;
  recordingUrl: string | null;
}

export function callStatusLabel(status: string | null): string {
  const s = (status ?? '').toLowerCase();
  if (s === 'connected') return 'Connected';
  if (s === 'voicemail') return 'Voicemail';
  if (s === 'no-answer') return 'No answer';
  return status ?? '—';
}

export function sentimentBadge(sentiment: string | null) {
  if (!sentiment) return null;
  const s = sentiment.toLowerCase();
  const cls = s.startsWith('pos') ? 'badge-green' : s.startsWith('neg') ? 'badge-red' : 'badge-orange';
  return <span className={`badge ${cls}`} style={{ textTransform: 'capitalize' }}>{sentiment}</span>;
}

export function parseTranscript(content: string): Array<{ agent: boolean; speaker: string; text: string }> {
  return content
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const m = l.match(/^([^:]{2,60}):\s*(.*)$/);
      if (!m) return { agent: false, speaker: '', text: l };
      const speaker = m[1].replace(/\s*\[voicemail\]$/, '');
      return { agent: /Happilo/i.test(speaker), speaker, text: m[2] };
    });
}

/** Call summary, promise-to-pay and the turn-by-turn transcript. */
export function CallTranscriptView({ call, partyOwner }: { call: CallView; partyOwner?: string }) {
  const connected = (call.status ?? '').toLowerCase() === 'connected';
  const voicemail = (call.status ?? '').toLowerCase() === 'voicemail';
  const turns = parseTranscript(call.content);
  const at = parseConversationTimestamp(call.sentAt);
  const StatusIcon = connected ? PhoneCall : voicemail ? Voicemail : PhoneMissed;
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '14px' }}>
        <span className={`badge ${connected ? 'badge-green' : voicemail ? 'badge-blue' : 'badge-orange'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <StatusIcon size={11} /> {callStatusLabel(call.status)}
        </span>
        {call.duration && (
          <span className="badge badge-grey" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Clock size={11} /> {call.duration} min</span>
        )}
        {sentimentBadge(call.sentiment)}
        <span style={{ fontSize: '11.5px', color: 'var(--label-tertiary)' }}>{at ? `${dayLabel(at)}, ${timeLabel(at)}` : call.sentAt}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '16px' }}>
        <div style={{ background: 'var(--fill-quaternary)', borderRadius: '10px', padding: '12px 14px', gridColumn: call.promiseDate ? undefined : '1 / -1' }}>
          <span style={{ fontSize: '10.5px', color: 'var(--label-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Call summary</span>
          <p style={{ fontSize: '12.5px', margin: '4px 0 0', color: 'var(--label-primary)', lineHeight: 1.5 }}>{call.note ?? '—'}</p>
        </div>
        {call.promiseDate && (
          <div style={{ background: 'rgba(217, 154, 11, 0.10)', border: '1px solid rgba(217, 154, 11, 0.35)', borderRadius: '10px', padding: '12px 14px' }}>
            <span style={{ fontSize: '10.5px', color: 'var(--purple)', textTransform: 'uppercase', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <CalendarCheck size={11} /> Promise to pay
            </span>
            <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--label-primary)', marginTop: '4px' }}>
              {dayLabel(parseConversationTimestamp(`${call.promiseDate} 10:00`)) || call.promiseDate}
            </div>
          </div>
        )}
      </div>

      {call.recordingUrl && (
        <div style={{ marginBottom: '16px' }}>
          <span style={{ fontSize: '10.5px', color: 'var(--label-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Call recording</span>
          <audio controls src={call.recordingUrl} style={{ width: '100%', marginTop: '6px', height: '36px' }} />
        </div>
      )}

      <span style={{ fontSize: '10.5px', color: 'var(--label-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>
        {connected ? `Transcript · ${turns.length} turns` : voicemail ? 'Voicemail left' : 'Attempt'}
      </span>
      {connected || voicemail ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
          {turns.map((t, i) => (
            <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', flexDirection: t.agent ? 'row' : 'row-reverse' }}>
              <span
                style={{
                  width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: 700, color: '#fff', background: t.agent ? 'var(--blue)' : 'var(--purple)',
                }}
                title={t.speaker}
              >
                {t.agent ? 'NR' : (partyOwner ?? t.speaker).split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
              </span>
              <div
                style={{
                  maxWidth: '78%', padding: '8px 12px', borderRadius: '10px',
                  background: t.agent ? 'rgba(0, 82, 59, 0.07)' : 'var(--bg-layer1, #fff)',
                  border: '1px solid var(--separator)',
                }}
              >
                <span style={{ display: 'block', fontSize: '10.5px', fontWeight: 700, color: t.agent ? 'var(--blue)' : 'var(--purple)', marginBottom: '2px' }}>
                  {t.agent ? 'Neha (Happilo Accounts)' : t.speaker}
                </span>
                <span style={{ fontSize: '13px', color: 'var(--label-primary)', lineHeight: 1.45 }}>{t.text}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ fontSize: '12.5px', background: 'var(--fill-quaternary)', padding: '12px 14px', borderRadius: '10px', color: 'var(--label-secondary)', marginTop: '6px' }}>
          {call.content}
        </p>
      )}
    </div>
  );
}
