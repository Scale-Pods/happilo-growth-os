'use client';

import React, { useMemo, useState } from 'react';
import { X, CheckCircle2, XCircle, CalendarPlus, Send, Star, MessageSquare, Mail, Phone, ListOrdered, StickyNote, Link2 } from 'lucide-react';
import type { Lead, OutreachSequence, TranscriptEntry } from '@/lib/data/b2bCrm';
import { stageLabel, categoryLabel, sourceLabel, intentLabel, interestLabel, parseSentiment, formatWhen } from '@/lib/data/b2bCrm';
import type { VapiCallLog } from '@/lib/data/vapiCalls';
import { WhatsappThread, EmailThreadView, CallCard, Timeline, type TimelineItem } from '../_components/threads';

type Tab = 'timeline' | 'whatsapp' | 'email' | 'voice' | 'notes';

const STAGE_BADGE: Record<string, string> = {
  lead_generated: 'badge-blue', contacted: 'badge-blue', interested: 'badge-orange', sample_sent: 'badge-orange',
  demo_booked: 'badge-orange', negotiation: 'badge-orange', won: 'badge-green', lost: 'badge-red',
};

const REP_NAMES: Record<string, string> = { 'rep-1': 'Karthik Iyer', 'rep-2': 'Divya Nair', 'rep-3': 'Rohan Verma' };

const TEMPLATES: Array<{ id: string; name: string; text: (first: string, rep: string) => string; attachment?: string }> = [
  { id: 'rate', name: 'Share rate card', text: (f, r) => `Hi ${f}, ${r} from Happilo. Sharing our latest trade rate card for your reference. Happy to help with a first order list.`, attachment: '[Rate card] Happilo_B2B_RateCard_Nov2026.pdf' },
  { id: 'gift', name: 'New Year gifting catalogue', text: (f, r) => `Hi ${f}, ${r} here. New Year and Christmas gifting slots are filling up. Sharing the 2026 gifting catalogue, boxes from Rs 799.`, attachment: '[Catalogue PDF] Corporate_Gifting_Catalogue_2026.pdf' },
  { id: 'sample', name: 'Sample feedback check', text: (f, r) => `Hi ${f}, ${r} from Happilo. Hope the sample reached you safely. Did you and your team get a chance to try it?` },
  { id: 'reorder', name: 'Reorder reminder', text: (f, r) => `Hi ${f}, ${r} here. Your last order should be running low by now. Shall I send the reorder list for this week?` },
];

export interface ScheduledLocal {
  id: string;
  lead_id: string;
  channel: 'whatsapp' | 'email' | 'call';
  label: string;
  at: string;
}

export default function LeadDrawer({
  lead,
  calls,
  sequences,
  updating,
  onClose,
  onStage,
  onAppendWhatsapp,
  onNotes,
  onSchedule,
  showToast,
}: {
  lead: Lead;
  calls: VapiCallLog[];
  sequences: OutreachSequence[];
  updating: boolean;
  onClose: () => void;
  onStage: (stage: 'won' | 'lost') => void;
  onAppendWhatsapp: (entry: TranscriptEntry) => void;
  onNotes: (notes: string) => void;
  onSchedule: (s: Omit<ScheduledLocal, 'id' | 'lead_id'>) => void;
  showToast: (msg: string, kind?: 'success' | 'error' | 'info') => void;
}) {
  const [tab, setTab] = useState<Tab>('timeline');
  const [noteDraft, setNoteDraft] = useState(lead.notes ?? '');
  const [showSchedule, setShowSchedule] = useState(false);
  const [showTemplate, setShowTemplate] = useState(false);
  const [schedCh, setSchedCh] = useState<'whatsapp' | 'email' | 'call'>('whatsapp');
  const [schedDays, setSchedDays] = useState(2);
  const [schedTime, setSchedTime] = useState('11:00');
  const [schedLabel, setSchedLabel] = useState('Follow up on the quote');

  const contactFirst = (calls[0]?.customer_name ?? 'there').replace(/^(Dr\.|Coach|Sister|Mrs\.|Ms\.|Mr\.)\s+/, '').split(' ')[0];
  const repName = REP_NAMES[lead.assigned_rep_id ?? ''] ?? 'Happilo B2B Team';

  const wa = useMemo(() => [...lead.conversation_transcript].sort((a, b) => (a.at < b.at ? -1 : 1)), [lead.conversation_transcript]);
  const em = useMemo(() => [...lead.conversation_transcript_email].sort((a, b) => (a.at < b.at ? -1 : 1)), [lead.conversation_transcript_email]);
  const leadCalls = useMemo(() => [...calls].sort((a, b) => ((a.started_at ?? '') < (b.started_at ?? '') ? -1 : 1)), [calls]);
  const upcoming = useMemo(
    () => sequences.filter((s) => s.status === 'scheduled').sort((a, b) => (a.scheduled_date < b.scheduled_date ? -1 : 1)),
    [sequences]
  );

  const timeline = useMemo<TimelineItem[]>(() => {
    const items: TimelineItem[] = [
      ...wa.map((entry) => ({ kind: 'whatsapp' as const, at: entry.at, entry })),
      ...em.map((entry) => ({ kind: 'email' as const, at: entry.at, entry })),
      ...leadCalls.map((log) => ({ kind: 'call' as const, at: log.started_at ?? '', log })),
      ...(lead.system_events ?? []).map((event) => ({ kind: 'event' as const, at: event.at, event })),
    ];
    items.sort((a, b) => (a.at < b.at ? -1 : 1));
    return [...items, ...upcoming.map((s) => ({ kind: 'scheduled' as const, at: s.scheduled_date, label: s.label ?? 'Follow-up', channel: s.channel }))];
  }, [wa, em, leadCalls, lead.system_events, upcoming]);

  const closed = lead.current_stage === 'won' || lead.current_stage === 'lost';
  const sentiments = [
    ['WhatsApp', lead.whatsapp_sentiment],
    ['Email', lead.email_sentiment],
    ['Phone', lead.voice_sentiment],
  ].filter(([, v]) => v) as Array<[string, string]>;

  const sendTemplate = (t: (typeof TEMPLATES)[number]) => {
    onAppendWhatsapp({
      direction: 'outbound',
      message: t.text(contactFirst, repName.split(' ')[0]),
      at: new Date().toISOString(),
      status: 'sent',
      attachment: t.attachment ?? null,
    });
    setShowTemplate(false);
    setTab('whatsapp');
    showToast(`"${t.name}" sent to ${lead.company_name} on WhatsApp.`, 'success');
  };

  const saveSchedule = () => {
    const [h, m] = schedTime.split(':').map(Number);
    const d = new Date();
    d.setDate(d.getDate() + schedDays);
    d.setHours(h, m, 0, 0);
    onSchedule({ channel: schedCh, label: schedLabel.trim() || 'Follow-up', at: d.toISOString() });
    setShowSchedule(false);
    showToast(`Follow-up scheduled for ${formatWhen(d.toISOString())}.`, 'success');
  };

  const tabs: Array<{ id: Tab; label: string; icon: React.ReactNode; count?: number }> = [
    { id: 'timeline', label: 'Timeline', icon: <ListOrdered size={13} />, count: timeline.length },
    { id: 'whatsapp', label: 'WhatsApp', icon: <MessageSquare size={13} />, count: wa.length },
    { id: 'email', label: 'Email', icon: <Mail size={13} />, count: em.length },
    { id: 'voice', label: 'Voice', icon: <Phone size={13} />, count: leadCalls.length },
    { id: 'notes', label: 'Notes', icon: <StickyNote size={13} /> },
  ];

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 8000, background: 'rgba(12,62,51,0.28)', display: 'flex', justifyContent: 'flex-end' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '760px', maxWidth: '100%', height: '100%', background: 'var(--bg-layer1, #fff)', borderLeft: '1px solid var(--separator)',
          boxShadow: '-12px 0 40px rgba(12,62,51,0.16)', display: 'flex', flexDirection: 'column', animation: 'fadeIn 200ms ease',
        }}
      >
        {/* Header */}
        <div style={{ padding: '18px 20px 12px', borderBottom: '1px solid var(--separator)', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ minWidth: 0 }}>
              <span style={{ fontWeight: 700, fontSize: '18px', display: 'block', color: 'var(--label-primary)' }}>{lead.company_name}</span>
              <span style={{ fontSize: '12px', color: 'var(--label-secondary)' }}>
                {categoryLabel(lead.category)} · {lead.city ? `${lead.city}, ${lead.region}` : lead.region} · Owner: {repName}
              </span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px', flexWrap: 'wrap' }}>
                <span className={`badge ${STAGE_BADGE[lead.current_stage] ?? 'badge-blue'}`}>{stageLabel(lead.current_stage)}</span>
                {lead.google_rating && (
                  <span style={{ fontSize: '11.5px', color: 'var(--label-secondary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Star size={11} style={{ color: 'var(--orange)' }} fill="var(--orange)" /> {lead.google_rating} ({lead.google_reviews_count ?? 0})
                  </span>
                )}
                <span style={{ fontSize: '11.5px', color: 'var(--label-tertiary)' }}>{sourceLabel(lead.lead_source)} · added {formatWhen(lead.created_at)}</span>
              </div>
            </div>
            <button className="btn-icon" onClick={onClose} aria-label="Close"><X size={16} /></button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '6px 16px', fontSize: '12px', marginTop: '12px', color: 'var(--label-secondary)' }}>
            <span>Phone: <b style={{ color: 'var(--label-primary)', fontWeight: 600 }}>{lead.phone ?? '—'}</b></span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Email: <b style={{ color: 'var(--label-primary)', fontWeight: 600 }}>{lead.email ?? '—'}</b></span>
            <span>Last reply: <b style={{ color: 'var(--label-primary)', fontWeight: 600 }}>{formatWhen(lead.last_reply_at)}</b></span>
          </div>

          {sentiments.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '10px' }}>
              {sentiments.map(([ch, raw]) => {
                const p = parseSentiment(raw);
                const good = p.interest === 'positive';
                const bad = p.interest === 'negative' || p.interest === 'not_interested';
                return (
                  <span key={ch} style={{ fontSize: '11.5px', color: 'var(--label-secondary)' }}>
                    <b style={{ color: good ? 'var(--green)' : bad ? 'var(--red)' : 'var(--orange)', fontWeight: 700 }}>{ch}: {interestLabel(p.interest)}</b>
                    {p.intent ? ` · ${intentLabel(p.intent)}` : ''}{p.summary ? `. ${p.summary}` : ''}
                  </span>
                );
              })}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
            <button className="btn-secondary" onClick={() => { setShowTemplate((v) => !v); setShowSchedule(false); }} style={actBtn}>
              <Send size={13} /> Send template message
            </button>
            <button className="btn-secondary" onClick={() => { setShowSchedule((v) => !v); setShowTemplate(false); }} style={actBtn}>
              <CalendarPlus size={13} /> Schedule follow-up
            </button>
            {lead.whatsapp_number && wa.length > 0 && (
              <button
                className="btn-secondary"
                style={actBtn}
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/share/whatsapp/${encodeURIComponent(lead.whatsapp_number!)}`);
                  showToast('Share link for the WhatsApp chat copied.', 'success');
                }}
              >
                <Link2 size={13} /> Copy chat link
              </button>
            )}
            <span style={{ flex: 1 }} />
            {!closed ? (
              <>
                <button className="btn-secondary" onClick={() => onStage('lost')} disabled={updating} style={{ ...actBtn, color: 'var(--red)' }}>
                  <XCircle size={13} /> Mark as lost
                </button>
                <button className="btn-primary" onClick={() => onStage('won')} disabled={updating} style={{ ...actBtn, background: 'var(--green)' }}>
                  <CheckCircle2 size={13} /> Mark as won
                </button>
              </>
            ) : (
              <span style={{ fontSize: '12px', color: 'var(--label-tertiary)', fontStyle: 'italic', alignSelf: 'center' }}>Marked {stageLabel(lead.current_stage).toLowerCase()}</span>
            )}
          </div>

          {showTemplate && (
            <div style={panel}>
              <span style={panelTitle}>Pick a message to send on WhatsApp</span>
              {TEMPLATES.map((t) => (
                <button key={t.id} onClick={() => sendTemplate(t)} style={{ textAlign: 'left', background: 'var(--bg-layer1, #fff)', border: '1px solid var(--separator)', borderRadius: '8px', padding: '8px 10px', cursor: 'pointer', font: 'inherit', color: 'inherit' }}>
                  <span style={{ display: 'block', fontSize: '12.5px', fontWeight: 600 }}>{t.name}</span>
                  <span style={{ display: 'block', fontSize: '11.5px', color: 'var(--label-secondary)', marginTop: '2px' }}>{t.text(contactFirst, repName.split(' ')[0])}</span>
                </button>
              ))}
            </div>
          )}

          {showSchedule && (
            <div style={panel}>
              <span style={panelTitle}>Schedule a follow-up</span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <select className="input" value={schedCh} onChange={(e) => setSchedCh(e.target.value as typeof schedCh)} style={inp}>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="email">Email</option>
                  <option value="call">Call</option>
                </select>
                <select className="input" value={schedDays} onChange={(e) => setSchedDays(Number(e.target.value))} style={inp}>
                  <option value={1}>Tomorrow</option>
                  <option value={2}>In 2 days</option>
                  <option value={3}>In 3 days</option>
                  <option value={5}>In 5 days</option>
                  <option value={7}>In a week</option>
                </select>
                <input className="input" type="time" value={schedTime} onChange={(e) => setSchedTime(e.target.value)} style={inp} />
              </div>
              <input className="input" value={schedLabel} onChange={(e) => setSchedLabel(e.target.value)} placeholder="What is this follow-up about?" style={{ ...inp, width: '100%' }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button className="btn-secondary" onClick={() => setShowSchedule(false)} style={actBtn}>Cancel</button>
                <button className="btn-primary" onClick={saveSchedule} style={actBtn}>Save</button>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', padding: '0 16px', borderBottom: '1px solid var(--separator)', flexShrink: 0, overflowX: 'auto' }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 12px', fontSize: '12.5px', fontWeight: tab === t.id ? 700 : 500,
                border: 'none', background: 'transparent', cursor: 'pointer', font: 'inherit', whiteSpace: 'nowrap',
                color: tab === t.id ? 'var(--brand)' : 'var(--label-secondary)', borderBottom: `2px solid ${tab === t.id ? 'var(--brand)' : 'transparent'}`,
              }}
            >
              {t.icon} {t.label}{t.count !== undefined ? <span style={{ fontSize: '11px', color: 'var(--label-tertiary)' }}>{t.count}</span> : null}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px 20px', background: tab === 'whatsapp' ? '#EEF3EE' : undefined }}>
          {tab === 'timeline' && <Timeline items={timeline} leadName={lead.company_name} />}
          {tab === 'whatsapp' && (wa.length ? <WhatsappThread entries={wa} /> : <Empty text="No WhatsApp messages yet." />)}
          {tab === 'email' && (em.length ? <EmailThreadView entries={em} leadName={lead.company_name} /> : <Empty text="No emails yet." />)}
          {tab === 'voice' && (
            leadCalls.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[...leadCalls].reverse().map((c, i) => <CallCard key={c.id} log={c} defaultOpen={i === 0} />)}
              </div>
            ) : <Empty text="Aarav has not called this lead yet." />
          )}
          {tab === 'notes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span style={{ fontSize: '12px', color: 'var(--label-secondary)' }}>Notes are visible to everyone on the B2B team.</span>
              <textarea
                className="input"
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                rows={10}
                style={{ width: '100%', fontSize: '13px', padding: '10px 12px', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button className="btn-secondary" onClick={() => setNoteDraft(lead.notes ?? '')} style={actBtn}>Discard changes</button>
                <button
                  className="btn-primary"
                  disabled={noteDraft === (lead.notes ?? '')}
                  onClick={() => { onNotes(noteDraft); showToast('Notes saved.', 'success'); }}
                  style={actBtn}
                >
                  Save notes
                </button>
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--label-tertiary)', marginTop: '6px' }}>
                Address: {lead.address ?? '—'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--label-tertiary)', fontSize: '13px' }}>{text}</div>;
}

const actBtn: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', padding: '7px 12px' };
const panel: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px', padding: '12px', background: 'var(--fill-quaternary)', border: '1px solid var(--separator)', borderRadius: '10px' };
const panelTitle: React.CSSProperties = { fontSize: '11px', fontWeight: 700, color: 'var(--label-secondary)', textTransform: 'uppercase', letterSpacing: '0.03em' };
const inp: React.CSSProperties = { padding: '7px 8px', fontSize: '12.5px' };
