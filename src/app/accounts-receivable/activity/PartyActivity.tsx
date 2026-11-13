'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  MessageSquare,
  Mail,
  Phone,
  Receipt,
  IndianRupee,
  FileMinus,
  Search,
  ChevronDown,
  ChevronRight,
  CalendarCheck,
  AlertTriangle,
  ArrowDownUp,
} from 'lucide-react';
import {
  normalizeConversation,
  parseConversationTimestamp,
  parseAmount,
  formatINR,
  outreachOwedAmount,
  callStep,
  type ConversationEntry,
  type PartyLedgerRow,
  type RecoveryOutreachRow,
} from '@/lib/data/receivables';
import {
  WaChatView,
  EmailMessageCard,
  CallTranscriptView,
  callStatusLabel,
  dayLabel,
  timeLabel,
  isInboundEntry,
  sentimentBadge,
  type CallView,
} from '../_components/Conversations';

type Kind = 'whatsapp' | 'email' | 'call' | 'ledger';

interface Event {
  key: string;
  kind: Kind;
  at: Date;
  title: string;
  detail?: string;
  wa?: ConversationEntry[];
  email?: ConversationEntry;
  call?: CallView;
  icon: 'invoice' | 'receipt' | 'cn' | 'wa' | 'email' | 'call';
}

const KIND_META: Record<Kind, { label: string; color: string }> = {
  whatsapp: { label: 'WhatsApp', color: 'var(--green)' },
  email: { label: 'Email', color: 'var(--blue)' },
  call: { label: 'Calls', color: 'var(--purple)' },
  ledger: { label: 'Ledger', color: 'var(--indigo)' },
};

function iconFor(e: Event) {
  const s = 14;
  switch (e.icon) {
    case 'wa': return <MessageSquare size={s} />;
    case 'email': return <Mail size={s} />;
    case 'call': return <Phone size={s} />;
    case 'receipt': return <IndianRupee size={s} />;
    case 'cn': return <FileMinus size={s} />;
    default: return <Receipt size={s} />;
  }
}

const dmy = (s: string): Date | null => {
  const m = s.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  return m ? new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), 14, 0) : null;
};

function buildEvents(row: RecoveryOutreachRow | undefined, ledger: PartyLedgerRow[]): Event[] {
  const ev: Event[] = [];

  // Ledger: invoices, receipts, credit notes
  ledger.forEach((l) => {
    const created = l.created_at ? new Date(l.created_at) : null;
    if (!created) return;
    const isCn = (l.particulars ?? '').startsWith('Credit Note');
    if (isCn) {
      ev.push({
        key: `cn-${l.id}`, kind: 'ledger', icon: 'cn', at: created,
        title: `Credit note ${l.bill_no} for ${formatINR(parseAmount(l.credit))}`,
        detail: `${(l.particulars ?? '').replace(/^Credit Note - /, '')}. ${l.narration ?? ''}`,
      });
      return;
    }
    ev.push({
      key: `inv-${l.id}`, kind: 'ledger', icon: 'invoice', at: created,
      title: `Invoice ${l.bill_no} raised for ${formatINR(parseAmount(l.debit))}`,
      detail: `${(l.particulars ?? '').replace(/^Sales - /, '')}. ${(l.narration ?? '').split(';')[0].replace(/\.$/, '')}.`,
    });
    const re = /received (₹[\d,]+) on (\d{2}-\d{2}-\d{4})( \(net of TDS (₹[\d,]+)\))?/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(l.narration ?? ''))) {
      const at = dmy(m[2]);
      if (!at) continue;
      ev.push({
        key: `rcpt-${l.id}-${m.index}`, kind: 'ledger', icon: 'receipt', at,
        title: `Payment of ${m[1]} received against ${l.bill_no}`,
        detail: m[4] ? `TDS of ${m[4]} deducted by the party.` : undefined,
      });
    }
  });

  if (!row) return ev;

  // WhatsApp: one item per exchange (same WA step on the same day)
  const wa = normalizeConversation(row.wa_conversation);
  const groups = new Map<string, ConversationEntry[]>();
  wa.forEach((e) => {
    const at = parseConversationTimestamp(e.timestamp);
    const key = `${e.stage ?? ''}|${at ? at.toDateString() : ''}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(e);
  });
  groups.forEach((list, key) => {
    const at = parseConversationTimestamp(list[0].timestamp);
    if (!at) return;
    const replies = list.filter(isInboundEntry).length;
    const firstIn = list.find(isInboundEntry);
    ev.push({
      key: `wa-${key}`, kind: 'whatsapp', icon: 'wa', at,
      title: `WhatsApp · ${list.length} message${list.length > 1 ? 's' : ''}${replies ? `, ${replies} from the party` : ', no reply'}`,
      detail: firstIn ? `“${firstIn.message.slice(0, 140)}${firstIn.message.length > 140 ? '…' : ''}”` : list[0].message.slice(0, 140),
      wa: list,
    });
  });

  // Email: one item per message
  normalizeConversation(row.email_conversation).forEach((e, i) => {
    const at = parseConversationTimestamp(e.timestamp);
    if (!at) return;
    const inbound = isInboundEntry(e);
    const fwd = (e.subject ?? '').startsWith('Fwd:');
    ev.push({
      key: `em-${i}`, kind: 'email', icon: 'email', at,
      title: inbound ? `Email received from ${(e.from ?? 'party').replace(/\s*<.*>$/, '')}` : fwd ? `Email forwarded to ${(e.to ?? '').replace(/\s*<.*>$/, '')}` : 'Email sent by Happilo Accounts',
      detail: e.subject,
      email: e,
    });
  });

  // Calls
  for (let n = 1; n <= 8; n++) {
    const c = callStep(row, n as 1);
    if (!c.sent_at || !c.content) continue;
    const at = parseConversationTimestamp(c.sent_at);
    if (!at) continue;
    ev.push({
      key: `call-${n}`, kind: 'call', icon: 'call', at,
      title: `Call ${n} · ${callStatusLabel(c.status)}${c.duration ? ` · ${c.duration} min` : ''}`,
      detail: c.note ?? undefined,
      call: { step: n, status: c.status, sentAt: c.sent_at, sentiment: c.sentiment, note: c.note, content: c.content, duration: c.duration, promiseDate: c.promise_date, recordingUrl: c.recording_url },
    });
  }
  return ev;
}

export default function PartyActivity({
  ledger,
  outreach,
  initialParty,
}: {
  ledger: PartyLedgerRow[];
  outreach: RecoveryOutreachRow[];
  initialParty: string | null;
}) {
  const router = useRouter();
  const parties = useMemo(() => {
    const names = Array.from(new Set([...outreach.map((r) => r.party_name), ...ledger.map((l) => l.party_name)].filter(Boolean))) as string[];
    return names
      .map((name) => {
        const row = outreach.find((r) => r.party_name === name);
        return { name, row, owed: row ? outreachOwedAmount(row) : 0 };
      })
      .sort((a, b) => b.owed - a.owed);
  }, [outreach, ledger]);

  const [selected, setSelected] = useState<string>(initialParty && parties.some((p) => p.name === initialParty) ? initialParty : parties[0]?.name ?? '');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | Kind>('all');
  const [newestFirst, setNewestFirst] = useState(true);

  const choose = (name: string) => {
    setSelected(name);
    router.replace(`/accounts-receivable/activity?party=${encodeURIComponent(name)}`, { scroll: false });
  };

  const row = outreach.find((r) => r.party_name === selected);
  const partyLedger = useMemo(() => ledger.filter((l) => l.party_name === selected), [ledger, selected]);
  const events = useMemo(() => buildEvents(row, partyLedger), [row, partyLedger]);
  const counts = useMemo(() => {
    const c: Record<Kind, number> = { whatsapp: 0, email: 0, call: 0, ledger: 0 };
    events.forEach((e) => c[e.kind]++);
    return c;
  }, [events]);
  const shown = useMemo(
    () => events.filter((e) => filter === 'all' || e.kind === filter).sort((a, b) => (newestFirst ? b.at.getTime() - a.at.getTime() : a.at.getTime() - b.at.getTime())),
    [events, filter, newestFirst]
  );

  const latestPromise = useMemo(() => {
    let best: string | null = null;
    events.forEach((e) => { if (e.call?.promiseDate) best = e.call.promiseDate; });
    return best as string | null;
  }, [events]);

  const filteredParties = parties.filter((p) => !search.trim() || p.name.toLowerCase().includes(search.trim().toLowerCase()));

  let lastDay = '';
  return (
    <div style={{ animation: 'fadeIn 300ms ease' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--label-primary)', margin: 0 }}>All Activity</h2>
        <p style={{ fontSize: '13px', color: 'var(--label-secondary)', marginTop: '4px', marginBottom: 0 }}>
          Every invoice, payment, WhatsApp message, email and call with a party, in one timeline.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 300px) minmax(0, 1fr)', gap: '24px', alignItems: 'start' }}>
        <div className="liquid-card" style={{ padding: '16px' }}>
          <div style={{ position: 'relative', marginBottom: '12px' }}>
            <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--label-tertiary)' }} />
            <input type="text" placeholder="Search party..." className="input" value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: '100%', padding: '8px 12px 8px 30px', fontSize: '13px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxHeight: '680px', overflowY: 'auto' }}>
            {filteredParties.map((p) => (
              <button
                key={p.name}
                onClick={() => choose(p.name)}
                style={{
                  display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left', padding: '9px 12px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                  background: selected === p.name ? 'var(--fill-tertiary)' : 'transparent',
                }}
              >
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--label-primary)' }}>{p.name}</span>
                <span style={{ fontSize: '11px', color: 'var(--label-tertiary)', display: 'flex', justifyContent: 'space-between', gap: '6px' }}>
                  <span>{p.row?.current_stage ?? 'No follow-up'}</span>
                  <span style={{ fontWeight: 600, color: p.owed > 0 ? 'var(--label-secondary)' : 'var(--green)' }}>{p.owed > 0 ? formatINR(p.owed) : 'Settled'}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 }}>
          <div className="liquid-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0 }}>{selected || '—'}</h3>
                <span style={{ fontSize: '12px', color: 'var(--label-tertiary)' }}>
                  {[row?.phone ?? partyLedger[0]?.phone, row?.email ?? partyLedger[0]?.email, row?.gstin ? `GSTIN ${row.gstin}` : null].filter(Boolean).join(' · ')}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {row?.current_stage && <span className="badge badge-blue">{row.current_stage}</span>}
                {sentimentBadge(row?.sentiment ?? null)}
                {row?.founder_review === 'yes' && <span className="badge badge-purple">Founder review</span>}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginTop: '16px' }}>
              <Stat label="Outstanding" value={row ? formatINR(outreachOwedAmount(row)) : '—'} />
              <Stat label="Overdue by" value={row && Number(row.max_overdue_days) > 0 ? `${row.max_overdue_days} days` : 'Not overdue'} />
              <Stat label="Promise to pay" value={latestPromise ?? '—'} icon={<CalendarCheck size={12} />} gold={Boolean(latestPromise)} />
              <Stat label="Next action due" value={row?.next_action_date ?? '—'} />
            </div>
            {row?.dispute && row.dispute !== 'no' && (
              <div style={{ marginTop: '14px', padding: '10px 12px', borderRadius: '10px', background: 'rgba(217, 83, 79, 0.08)', border: '1px solid rgba(217, 83, 79, 0.25)', fontSize: '12.5px', display: 'flex', gap: '8px' }}>
                <AlertTriangle size={14} style={{ color: 'var(--pink)', flexShrink: 0, marginTop: '1px' }} />
                <span><strong>Dispute: </strong>{row.dispute}</span>
              </div>
            )}
            {row?.summary && (
              <p style={{ fontSize: '12.5px', color: 'var(--label-secondary)', margin: '14px 0 0', lineHeight: 1.55 }}>
                <strong style={{ color: 'var(--label-primary)' }}>Where it stands: </strong>{row.summary}
                {row.next_action && <><br /><strong style={{ color: 'var(--label-primary)' }}>Next: </strong>{row.next_action}</>}
              </p>
            )}
          </div>

          <div className="liquid-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <Chip active={filter === 'all'} onClick={() => setFilter('all')} label={`All · ${events.length}`} />
                {(Object.keys(KIND_META) as Kind[]).map((k) => (
                  <Chip key={k} active={filter === k} onClick={() => setFilter(k)} label={`${KIND_META[k].label} · ${counts[k]}`} color={KIND_META[k].color} />
                ))}
              </div>
              <button className="btn-secondary" onClick={() => setNewestFirst((v) => !v)} style={{ fontSize: '12px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <ArrowDownUp size={12} /> {newestFirst ? 'Newest first' : 'Oldest first'}
              </button>
            </div>

            {shown.length === 0 ? (
              <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--label-tertiary)', fontSize: '13px' }}>Nothing recorded yet.</div>
            ) : (
              <div style={{ position: 'relative' }}>
                {shown.map((e) => {
                  const day = dayLabel(e.at);
                  const showDay = day !== lastDay;
                  lastDay = day;
                  return (
                    <React.Fragment key={e.key}>
                      {showDay && (
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--label-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '14px 0 8px' }}>{day}</div>
                      )}
                      <TimelineItem e={e} party={selected} />
                    </React.Fragment>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, icon, gold }: { label: string; value: string; icon?: React.ReactNode; gold?: boolean }) {
  return (
    <div style={{ background: gold ? 'rgba(217, 154, 11, 0.10)' : 'var(--fill-quaternary)', borderRadius: '10px', padding: '10px 12px' }}>
      <span style={{ fontSize: '10.5px', color: gold ? 'var(--purple)' : 'var(--label-tertiary)', textTransform: 'uppercase', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>{icon}{label}</span>
      <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--label-primary)', marginTop: '2px' }}>{value}</div>
    </div>
  );
}

function Chip({ label, active, onClick, color }: { label: string; active: boolean; onClick: () => void; color?: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontSize: '12px', fontWeight: 600, padding: '5px 11px', borderRadius: '999px', cursor: 'pointer',
        border: `1px solid ${active ? color ?? 'var(--blue)' : 'var(--separator)'}`,
        background: active ? 'var(--fill-tertiary)' : 'transparent',
        color: active ? color ?? 'var(--blue)' : 'var(--label-secondary)',
      }}
    >
      {label}
    </button>
  );
}

function TimelineItem({ e, party }: { e: Event; party: string }) {
  const [open, setOpen] = useState(false);
  const meta = KIND_META[e.kind];
  const expandable = Boolean(e.wa || e.email || (e.call && e.call.status === 'connected'));
  return (
    <div style={{ display: 'flex', gap: '12px', paddingBottom: '10px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <span style={{ width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', background: meta.color }}>
          {iconFor(e)}
        </span>
        <span style={{ flex: 1, width: '2px', background: 'var(--separator)', marginTop: '4px' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0, border: '1px solid var(--separator)', borderRadius: '12px', background: 'var(--bg-layer1, #fff)' }}>
        <button
          onClick={() => expandable && setOpen((o) => !o)}
          style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', padding: '10px 14px', cursor: expandable ? 'pointer' : 'default', display: 'flex', gap: '8px', alignItems: 'flex-start' }}
        >
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--label-primary)' }}>{e.title}</span>
              <span style={{ fontSize: '11px', color: 'var(--label-tertiary)', whiteSpace: 'nowrap' }}>{timeLabel(e.at)}</span>
            </span>
            {e.detail && <span style={{ display: 'block', fontSize: '12px', color: 'var(--label-secondary)', marginTop: '2px', lineHeight: 1.45 }}>{e.detail}</span>}
            {e.call?.promiseDate && (
              <span className="badge badge-purple" style={{ marginTop: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <CalendarCheck size={10} /> Promised for {e.call.promiseDate}
              </span>
            )}
          </span>
          {expandable && (open ? <ChevronDown size={14} style={{ color: 'var(--label-tertiary)', marginTop: '2px' }} /> : <ChevronRight size={14} style={{ color: 'var(--label-tertiary)', marginTop: '2px' }} />)}
        </button>
        {open && (
          <div style={{ padding: '0 14px 14px' }}>
            {e.wa && (
              <div style={{ background: 'var(--fill-quaternary)', borderRadius: '10px', padding: '10px 12px' }}>
                <WaChatView entries={e.wa} partyLabel={party} />
              </div>
            )}
            {e.email && <EmailMessageCard entry={e.email} defaultOpen />}
            {e.call && <CallTranscriptView call={e.call} />}
          </div>
        )}
      </div>
    </div>
  );
}
