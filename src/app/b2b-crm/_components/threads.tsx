'use client';

import React from 'react';
import { Check, CheckCheck, AlertCircle, Paperclip, FileText, PlayCircle, MessageSquare, Mail, Phone, Flag, Package, IndianRupee, StickyNote, CircleDot, ArrowRight, CalendarClock } from 'lucide-react';
import type { TranscriptEntry, LeadEvent } from '@/lib/data/b2bCrm';
import { formatWhen } from '@/lib/data/b2bCrm';
import type { VapiCallLog, VoiceTurn } from '@/lib/data/vapiCalls';
import { callOutcome, outcomeLabel, formatDuration, parseVoiceTranscript } from '@/lib/data/vapiCalls';

/* ------------------------------ WhatsApp ------------------------------ */

type Tick = 'sent' | 'delivered' | 'read' | 'failed' | null;

export function tickOf(status: string | null | undefined): Tick {
  const s = (status ?? '').toLowerCase();
  if (s.startsWith('failed')) return 'failed';
  if (s === 'read') return 'read';
  if (s === 'delivered') return 'delivered';
  if (s === 'sent') return 'sent';
  return null;
}

export function TickIcon({ tick, size = 12 }: { tick: Tick; size?: number }) {
  if (tick === 'failed') return <AlertCircle size={size} style={{ color: 'var(--red)' }} />;
  if (tick === 'read') return <CheckCheck size={size} style={{ color: '#34B7F1' }} />;
  if (tick === 'delivered') return <CheckCheck size={size} style={{ color: 'var(--label-tertiary)' }} />;
  if (tick === 'sent') return <Check size={size} style={{ color: 'var(--label-tertiary)' }} />;
  return null;
}

const TICK_TEXT: Record<string, string> = { sent: 'Sent', delivered: 'Delivered', read: 'Read', failed: 'Not delivered' };

function AttachmentChip({ label }: { label: string }) {
  const m = label.match(/^\[([^\]]+)\]\s*(.*)$/);
  const kind = m ? m[1] : 'File';
  const name = m ? m[2] : label;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,82,59,0.06)', border: '1px solid var(--separator)', borderRadius: '8px', padding: '6px 9px', marginBottom: '6px' }}>
      <FileText size={16} style={{ color: 'var(--brand)', flexShrink: 0 }} />
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--label-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name || kind}</span>
        <span style={{ display: 'block', fontSize: '10px', color: 'var(--label-tertiary)' }}>{kind}</span>
      </span>
    </div>
  );
}

/** Groups a WhatsApp thread by calendar day with day dividers. */
export function WhatsappThread({ entries }: { entries: TranscriptEntry[] }) {
  let lastDay = '';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {entries.map((e, idx) => {
        const day = new Date(e.at).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', day: 'numeric', month: 'short' });
        const showDay = day !== lastDay;
        lastDay = day;
        const inbound = e.direction === 'inbound';
        const tick = inbound ? null : tickOf(e.status);
        const failDetail = tick === 'failed' ? (e.status ?? '').split(':').slice(1).join(':').trim() : '';
        const time = new Date(e.at).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit', hour12: true });
        return (
          <React.Fragment key={idx}>
            {showDay && (
              <div style={{ alignSelf: 'center', fontSize: '10.5px', color: 'var(--label-secondary)', background: 'var(--bg-layer1, #fff)', border: '1px solid var(--separator)', borderRadius: '8px', padding: '2px 10px', margin: '8px 0 4px' }}>
                {day}
              </div>
            )}
            <div
              style={{
                alignSelf: inbound ? 'flex-start' : 'flex-end',
                maxWidth: '78%',
                background: inbound ? 'var(--bg-layer1, #fff)' : '#DCF3E3',
                border: tick === 'failed' ? '1px solid var(--red)' : '1px solid var(--separator)',
                padding: '8px 12px',
                borderRadius: inbound ? '2px 12px 12px 12px' : '12px 2px 12px 12px',
              }}
            >
              {e.attachment && <AttachmentChip label={e.attachment} />}
              <p style={{ fontSize: '13px', margin: 0, whiteSpace: 'pre-wrap', color: 'var(--label-primary)', lineHeight: 1.45 }}>{e.message}</p>
              <span style={{ fontSize: '10px', color: 'var(--label-tertiary)', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end', marginTop: '3px' }}>
                {time}
                {tick && <span title={TICK_TEXT[tick]} style={{ display: 'flex' }}><TickIcon tick={tick} /></span>}
              </span>
              {failDetail && <p style={{ fontSize: '10.5px', color: 'var(--red)', margin: '3px 0 0', textAlign: 'right' }}>{failDetail}</p>}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* -------------------------------- Email -------------------------------- */

export function EmailMessage({ entry, leadName, defaultOpen = true }: { entry: TranscriptEntry; leadName: string; defaultOpen?: boolean }) {
  const [open, setOpen] = React.useState(defaultOpen);
  const inbound = entry.direction === 'inbound';
  const subject = entry.subject ?? entry.message.match(/^Subject: (.*)$/m)?.[1] ?? '(no subject)';
  const body = entry.subject ? entry.message : entry.message.replace(/^Subject: .*\n\n?/, '');
  const from = entry.from ?? (inbound ? leadName : 'Happilo B2B Team');
  return (
    <div style={{ background: 'var(--bg-layer1, #fff)', border: '1px solid var(--separator)', borderLeft: `3px solid ${inbound ? 'var(--brand-gold, #F2A71B)' : 'var(--brand)'}`, borderRadius: '10px', overflow: 'hidden' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', padding: '10px 14px', font: 'inherit', color: 'inherit' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'baseline' }}>
          <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--label-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{from}</span>
          <span style={{ fontSize: '10.5px', color: 'var(--label-tertiary)', flexShrink: 0 }}>{formatWhen(entry.at)}</span>
        </div>
        <div style={{ fontSize: '12.5px', color: 'var(--label-primary)', marginTop: '2px' }}>{subject}</div>
        {!open && <div style={{ fontSize: '11.5px', color: 'var(--label-tertiary)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{body.replace(/\s+/g, ' ').slice(0, 110)}</div>}
      </button>
      {open && (
        <div style={{ padding: '0 14px 12px' }}>
          <div style={{ fontSize: '11px', color: 'var(--label-secondary)', lineHeight: 1.6, borderBottom: '1px solid var(--separator)', paddingBottom: '8px', marginBottom: '10px' }}>
            {entry.to && <div><b style={{ fontWeight: 600 }}>To:</b> {entry.to}</div>}
            {entry.cc && <div><b style={{ fontWeight: 600 }}>Cc:</b> {entry.cc}</div>}
            {!inbound && entry.status && <div><b style={{ fontWeight: 600 }}>Status:</b> {entry.status === 'opened' ? 'Opened' : entry.status === 'delivered' ? 'Delivered' : entry.status}</div>}
          </div>
          <pre style={{ fontFamily: 'inherit', fontSize: '12.5px', margin: 0, whiteSpace: 'pre-wrap', color: 'var(--label-primary)', lineHeight: 1.55 }}>
            {renderBody(body)}
          </pre>
          {entry.attachments && entry.attachments.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
              {entry.attachments.map((a) => (
                <span key={a} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', border: '1px solid var(--separator)', borderRadius: '8px', padding: '4px 8px', background: 'var(--fill-quaternary)', color: 'var(--label-primary)' }}>
                  <Paperclip size={11} style={{ color: 'var(--brand)' }} /> {a}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Lines that look like a price table are shown in a fixed-width font so the columns line up. */
function renderBody(body: string): React.ReactNode {
  return body.split('\n').map((line, i) => {
    const tabular = /^\s{2}\S/.test(line) && /\s{3,}/.test(line.trim());
    return (
      <span key={i} style={tabular ? { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', fontSize: '11.5px' } : undefined}>
        {line}
        {'\n'}
      </span>
    );
  });
}

export function EmailThreadView({ entries, leadName }: { entries: TranscriptEntry[]; leadName: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {entries.map((e, i) => (
        <EmailMessage key={i} entry={e} leadName={leadName} defaultOpen={i >= entries.length - 2} />
      ))}
    </div>
  );
}

/* -------------------------------- Voice -------------------------------- */

export function PlayBar({ seconds }: { seconds: number | null | undefined }) {
  const total = formatDuration(seconds);
  const bars = Array.from({ length: 48 }, (_, i) => 6 + ((i * 37) % 17) + ((i * 11) % 7));
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--fill-quaternary)', border: '1px solid var(--separator)', borderRadius: '10px', padding: '8px 12px' }} title="Recording will be available once the call file is synced">
      <PlayCircle size={22} style={{ color: 'var(--brand)', flexShrink: 0, opacity: 0.85 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flex: 1, height: '26px', overflow: 'hidden' }}>
        {bars.map((h, i) => (
          <span key={i} style={{ width: '3px', height: `${h}px`, borderRadius: '2px', background: 'rgba(0,82,59,0.28)', flexShrink: 0 }} />
        ))}
      </div>
      <span style={{ fontSize: '11px', color: 'var(--label-secondary)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>0:00 / {total}</span>
    </div>
  );
}

export function TranscriptTurns({ turns, customerName }: { turns: VoiceTurn[]; customerName: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
      {turns.map((turn, idx) => {
        const customer = turn.role === 'customer';
        return (
          <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', flexDirection: customer ? 'row' : 'row-reverse' }}>
            <span style={{ width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, background: customer ? 'var(--fill-tertiary)' : 'var(--brand)', color: customer ? 'var(--label-primary)' : '#fff' }}>
              {customer ? customerName.charAt(0).toUpperCase() : 'A'}
            </span>
            <div style={{ maxWidth: '80%', background: customer ? 'var(--fill-tertiary)' : 'rgba(0, 82, 59, 0.08)', padding: '7px 11px', borderRadius: customer ? '2px 12px 12px 12px' : '12px 2px 12px 12px' }}>
              <span style={{ fontSize: '10px', color: 'var(--label-tertiary)', fontWeight: 600, display: 'block', marginBottom: '2px' }}>
                {customer ? customerName : turn.role === 'system' ? 'Note' : 'Aarav, Happilo'}
              </span>
              <p style={{ fontSize: '12.5px', margin: 0, whiteSpace: 'pre-wrap', color: 'var(--label-primary)', lineHeight: 1.45 }}>{turn.text}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function CallCard({ log, defaultOpen = false }: { log: VapiCallLog; defaultOpen?: boolean }) {
  const [open, setOpen] = React.useState(defaultOpen);
  const outcome = callOutcome(log);
  const turns = parseVoiceTranscript(log.transcript);
  const connected = outcome === 'connected';
  const label = connected ? 'Picked up' : (log.status ?? '').includes('busy') ? 'Busy' : outcomeLabel(outcome);
  return (
    <div style={{ background: 'var(--bg-layer1, #fff)', border: '1px solid var(--separator)', borderRadius: '10px', padding: '12px 14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', fontWeight: 700, color: 'var(--label-primary)' }}>
          <Phone size={13} style={{ color: connected ? 'var(--brand)' : 'var(--label-tertiary)' }} /> {formatWhen(log.started_at)}
        </span>
        <span style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '11px', color: 'var(--label-secondary)' }}>
          <span className={`badge ${connected ? 'badge-green' : 'badge-orange'}`}>{label}</span>
          {connected && <span>{formatDuration(log.duration_seconds)}</span>}
        </span>
      </div>
      {log.summary && <p style={{ fontSize: '12.5px', color: 'var(--label-secondary)', margin: '8px 0 0', lineHeight: 1.5 }}>{log.summary}</p>}
      {log.next_step && (
        <p style={{ fontSize: '12px', color: 'var(--brand)', margin: '6px 0 0', display: 'flex', gap: '6px', alignItems: 'flex-start', fontWeight: 600 }}>
          <ArrowRight size={13} style={{ flexShrink: 0, marginTop: '2px' }} /> Next step: {log.next_step}
        </p>
      )}
      {connected && turns.length > 0 && (
        <>
          <div style={{ marginTop: '10px' }}><PlayBar seconds={log.recording_seconds ?? log.duration_seconds} /></div>
          <button className="btn-secondary" onClick={() => setOpen((o) => !o)} style={{ marginTop: '10px', fontSize: '12px', padding: '5px 12px' }}>
            {open ? 'Hide conversation' : `Show conversation (${turns.length} turns)`}
          </button>
          {open && <div style={{ marginTop: '10px' }}><TranscriptTurns turns={turns} customerName={log.customer_name ?? 'Lead'} /></div>}
        </>
      )}
    </div>
  );
}

/* ------------------------------- Timeline ------------------------------- */

export type TimelineItem =
  | { kind: 'whatsapp'; at: string; entry: TranscriptEntry }
  | { kind: 'email'; at: string; entry: TranscriptEntry }
  | { kind: 'call'; at: string; log: VapiCallLog }
  | { kind: 'event'; at: string; event: LeadEvent }
  | { kind: 'scheduled'; at: string; label: string; channel: string };

const EVENT_ICON: Record<LeadEvent['kind'], React.ReactNode> = {
  stage: <Flag size={13} />,
  sample: <Package size={13} />,
  order: <IndianRupee size={13} />,
  quote: <FileText size={13} />,
  note: <StickyNote size={13} />,
  system: <CircleDot size={13} />,
};

function channelWord(ch: string) {
  return ch === 'whatsapp' ? 'WhatsApp' : ch === 'email' ? 'Email' : ch === 'call' ? 'Call' : 'Task';
}

export function Timeline({ items, leadName }: { items: TimelineItem[]; leadName: string }) {
  if (items.length === 0) return <p style={{ fontSize: '13px', color: 'var(--label-tertiary)' }}>Nothing on record yet.</p>;
  return (
    <div style={{ position: 'relative', paddingLeft: '30px' }}>
      <div style={{ position: 'absolute', left: '11px', top: '4px', bottom: '4px', width: '2px', background: 'var(--separator)' }} />
      {items.map((it, i) => {
        let icon: React.ReactNode;
        let color = 'var(--label-secondary)';
        let title: React.ReactNode;
        let body: React.ReactNode = null;
        if (it.kind === 'whatsapp') {
          const inbound = it.entry.direction === 'inbound';
          icon = <MessageSquare size={13} />;
          color = '#1E9E57';
          title = inbound ? `WhatsApp from ${leadName}` : 'WhatsApp sent';
          body = (
            <>
              {it.entry.attachment && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--brand)', marginBottom: '2px' }}><Paperclip size={11} /> {it.entry.attachment}</span>}
              <span style={{ display: 'block' }}>{it.entry.message}</span>
            </>
          );
        } else if (it.kind === 'email') {
          const inbound = it.entry.direction === 'inbound';
          icon = <Mail size={13} />;
          color = 'var(--blue)';
          title = `${inbound ? `Email from ${leadName}` : 'Email sent'}: ${it.entry.subject ?? ''}`;
          body = (
            <>
              <span style={{ display: 'block' }}>{it.entry.message.replace(/\s+/g, ' ').slice(0, 180)}{it.entry.message.length > 180 ? '…' : ''}</span>
              {it.entry.attachments && it.entry.attachments.length > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--brand)', marginTop: '3px' }}><Paperclip size={11} /> {it.entry.attachments.join(', ')}</span>
              )}
            </>
          );
        } else if (it.kind === 'call') {
          const outcome = callOutcome(it.log);
          icon = <Phone size={13} />;
          color = 'var(--purple)';
          title = `Call by Aarav: ${outcome === 'connected' ? `picked up, ${formatDuration(it.log.duration_seconds)}` : (it.log.status ?? '').includes('busy') ? 'busy' : outcomeLabel(outcome).toLowerCase()}`;
          body = (
            <>
              {it.log.summary}
              {it.log.next_step && <span style={{ display: 'block', color: 'var(--brand)', marginTop: '2px' }}>Next step: {it.log.next_step}</span>}
            </>
          );
        } else if (it.kind === 'event') {
          icon = EVENT_ICON[it.event.kind];
          color = it.event.kind === 'order' || it.event.kind === 'stage' ? 'var(--brand)' : 'var(--brand-gold, #C98A0B)';
          title = it.event.text;
        } else {
          icon = <CalendarClock size={13} />;
          color = 'var(--orange)';
          title = `Planned ${channelWord(it.channel).toLowerCase()}: ${it.label}`;
        }
        return (
          <div key={i} style={{ position: 'relative', paddingBottom: '14px' }}>
            <span style={{ position: 'absolute', left: '-30px', top: '0', width: '24px', height: '24px', borderRadius: '50%', background: 'var(--bg-layer1, #fff)', border: `1.5px solid ${color}`, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {icon}
            </span>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'baseline' }}>
              <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--label-primary)', fontStyle: it.kind === 'scheduled' ? 'italic' : undefined }}>{title}</span>
              <span style={{ fontSize: '10.5px', color: 'var(--label-tertiary)', flexShrink: 0 }}>{formatWhen(it.at)}</span>
            </div>
            {body && <div style={{ fontSize: '12px', color: 'var(--label-secondary)', marginTop: '2px', lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>{body}</div>}
          </div>
        );
      })}
    </div>
  );
}
