'use client';

import React, { useState, useMemo, useRef } from 'react';
import { useAppContext } from '../ClientWrapper';
import type { ContentDraft } from '@/lib/mock/marketing';
import { INITIAL_CALENDAR_POSTS, productImage, type CalendarPost } from '@/lib/mock/marketingCalendar';
import {
  Sparkles, Calendar, FileText, Send, CheckCircle2, Clock, MessageSquare, Plus, Trash, X,
  Eye, AlertTriangle, History, ArrowRight, Layers, BarChart2, Users, CalendarClock,
} from 'lucide-react';
import { PlatformIcon, toCalPlatform, nowLabel, labelStyle } from './components/shared';
import CalendarTab from './components/CalendarTab';
import AnalyticsTab from './components/AnalyticsTab';
import CreatorsTab from './components/CreatorsTab';
import UgcTab, { ugcToScriptText, type UgcResult } from './components/UgcTab';

// ─── Stage Config ─────────────────────────────────────────────────────────────

const STAGES = [
  { key: 'draft',    label: 'Drafts',          color: 'var(--label-tertiary)', badge: 'badge-grey' },
  { key: 'review',   label: 'In Review',       color: 'var(--orange)',         badge: 'badge-orange' },
  { key: 'revision', label: 'Needs Revision',  color: 'var(--red)',            badge: 'badge-red' },
  { key: 'approved', label: 'Approved',        color: 'var(--green)',          badge: 'badge-green' },
  { key: 'live',     label: 'Published',       color: 'var(--blue)',           badge: 'badge-blue' },
];

const REVIEWER = 'Mehul Jain';
const TODAY_ISO = '2026-11-13';

type Tab = 'maker-checker' | 'calendar' | 'ugc' | 'creators' | 'analytics';
type DetailMode = 'view' | 'comment' | 'reject' | 'schedule';

const fmtSchedule = (iso?: string, time?: string) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  return time ? `${date}, ${time}` : date;
};
const to12h = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return `${String(h % 12 || 12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

export default function MarketingPage() {
  const { contentDrafts, setContentDrafts, showToast } = useAppContext();
  const drafts = contentDrafts as ContentDraft[];

  const [activeTab, setActiveTab] = useState<Tab>('maker-checker');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailMode, setDetailMode] = useState<DetailMode>('view');
  const [commentInput, setCommentInput] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [scheduleDate, setScheduleDate] = useState('2026-11-18');
  const [scheduleTime, setScheduleTime] = useState('12:00');
  const [calendarPosts, setCalendarPosts] = useState<CalendarPost[]>(INITIAL_CALENDAR_POSTS);
  const [presetCreator, setPresetCreator] = useState('');

  const selectedDraft = drafts.find((d) => d.id === selectedId) ?? null;

  // Drag and drop
  const dragId = useRef<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  const draftsByStage = useMemo(() => {
    const map: Record<string, ContentDraft[]> = {};
    STAGES.forEach((s) => { map[s.key] = []; });
    drafts.forEach((d) => (map[d.status] ?? map['draft']).push(d));
    return map;
  }, [drafts]);

  const stageCounts = useMemo(() => {
    const o: Record<string, number> = {};
    STAGES.forEach((s) => { o[s.key] = draftsByStage[s.key].length; });
    return o;
  }, [draftsByStage]);

  // ── Actions ─────────────────────────────────────────────────────────────────

  const updateDraft = (id: string, status: string, extra: Partial<ContentDraft> = {}, note = '') => {
    setContentDrafts((prev) => (prev as ContentDraft[]).map((d) => {
      if (d.id !== id) return d;
      const by = status === 'approved' || status === 'revision' ? REVIEWER : d.author || 'Content team';
      return { ...d, status, ...extra, history: [...(d.history || []), { status, by, time: nowLabel(), note }] };
    }));
  };

  const handleDrop = (e: React.DragEvent, target: string) => {
    e.preventDefault();
    setDragOverStage(null);
    const id = dragId.current;
    dragId.current = null;
    if (!id) return;
    const d = drafts.find((x) => x.id === id);
    if (!d || d.status === target) return;
    updateDraft(id, target, target === 'revision' && !d.rejectionReason ? { rejectionReason: 'Moved back for changes.' } : {}, 'Moved on the board');
    showToast(`"${d.title}" moved to ${STAGES.find((s) => s.key === target)?.label}.`, 'success');
  };

  const handleSubmitForReview = (d: ContentDraft) => {
    updateDraft(d.id, 'review', { version: d.status === 'revision' ? (d.version ?? 1) + 1 : d.version ?? 1, rejectionReason: undefined }, d.status === 'revision' ? 'Resubmitted after changes' : 'Sent for review');
    showToast(`"${d.title}" is with ${REVIEWER} for review.`, 'success');
  };

  const handleApprove = (d: ContentDraft) => {
    updateDraft(d.id, 'approved', { reviewedBy: REVIEWER, rejectionReason: undefined }, 'Approved');
    showToast(`"${d.title}" approved. Pick a publish time or publish now.`, 'success');
  };

  const handleRequestRevision = (d: ContentDraft) => {
    if (!rejectionReason.trim()) { showToast('Add a note so the creator knows what to change.', 'error'); return; }
    updateDraft(d.id, 'revision', { rejectionReason: rejectionReason.trim(), reviewedBy: REVIEWER }, rejectionReason.trim());
    showToast('Sent back for revision with your note.', 'info');
    setRejectionReason('');
    setDetailMode('view');
  };

  const handleSchedule = (d: ContentDraft) => {
    if (!scheduleDate || scheduleDate < TODAY_ISO) { showToast('Pick a date from today onwards.', 'error'); return; }
    updateDraft(d.id, 'approved', { scheduleDate, scheduleTime }, `Scheduled for ${fmtSchedule(scheduleDate, scheduleTime)}`);
    const post: CalendarPost = {
      id: `cal-${Date.now()}`, date: scheduleDate, platform: toCalPlatform(d.platform), title: d.title, time: to12h(scheduleTime),
      status: 'Scheduled', img: productImage(d.product), description: d.scriptText.split('\n')[0].slice(0, 160), draftId: d.id,
    };
    setCalendarPosts((prev) => [...prev.filter((p) => p.draftId !== d.id), post]);
    showToast(`Scheduled for ${fmtSchedule(scheduleDate, scheduleTime)}. It now shows on the calendar.`, 'success');
    setDetailMode('view');
  };

  const handlePublishNow = (d: ContentDraft) => {
    const t = new Date();
    const post: CalendarPost = {
      id: `cal-${Date.now()}`, date: TODAY_ISO, platform: toCalPlatform(d.platform), title: d.title,
      time: t.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase(),
      status: 'Published', img: productImage(d.product), description: d.scriptText.split('\n')[0].slice(0, 160), draftId: d.id,
    };
    setCalendarPosts((prev) => [...prev.filter((p) => p.draftId !== d.id), post]);
    updateDraft(d.id, 'live', { scheduleDate: TODAY_ISO }, 'Published');
    setSelectedId(null);
    showToast(`"${d.title}" is live on ${toCalPlatform(d.platform)}.`, 'success');
  };

  const handleAddComment = (id: string) => {
    if (!commentInput.trim()) return;
    const text = commentInput.trim();
    setContentDrafts((prev) => (prev as ContentDraft[]).map((d) => (d.id === id ? { ...d, comments: [...(d.comments || []), { author: REVIEWER, text, time: nowLabel() }] } : d)));
    setCommentInput('');
    showToast('Comment added.', 'success');
  };

  const handleDelete = (d: ContentDraft) => {
    setContentDrafts((prev) => (prev as ContentDraft[]).filter((x) => x.id !== d.id));
    setCalendarPosts((prev) => prev.filter((p) => p.draftId !== d.id || p.status === 'Published'));
    if (selectedId === d.id) setSelectedId(null);
    showToast('Draft deleted.', 'info');
  };

  const saveUgc = (u: UgcResult) => {
    const d: ContentDraft = {
      id: `c-${Date.now()}`,
      title: `${u.product.name.replace(/ with Free Nut Cracker$/, '')}: ${u.angle.toLowerCase()}`,
      type: 'Creator brief',
      platform: u.platform,
      product: u.product.name,
      status: 'draft',
      scriptText: ugcToScriptText(u),
      author: 'Riya Shetty',
      version: 1,
      comments: [],
      history: [{ status: 'draft', by: 'Riya Shetty', time: nowLabel(), note: 'Created from the brief builder' }],
    };
    setContentDrafts((prev) => [d, ...(prev as ContentDraft[])]);
    setActiveTab('maker-checker');
    setSelectedId(d.id);
    setDetailMode('view');
    showToast('Saved to Drafts. Submit it when it reads right.', 'success');
  };

  const stageInfo = (k: string) => STAGES.find((s) => s.key === k);

  // ── Render ──────────────────────────────────────────────────────────────────

  const tabs: [Tab, string, React.ElementType][] = [
    ['maker-checker', 'Approvals', Layers],
    ['calendar', 'Content Calendar', Calendar],
    ['ugc', 'Brief Builder', Sparkles],
    ['creators', 'Creators', Users],
    ['analytics', 'Analytics', BarChart2],
  ];

  return (
    <div style={{ animation: 'fadeIn 300ms ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--label-primary)', margin: 0 }}>Marketing and Content</h2>
          <p style={{ fontSize: '13px', color: 'var(--label-secondary)', marginTop: '4px', marginBottom: 0 }}>
            Drafts, reviews and approvals, the November and December calendar, creators and campaign numbers.
          </p>
        </div>
        <button className="btn-primary" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => setActiveTab('ugc')}>
          <Plus size={13} /> New brief
        </button>
      </div>

      <div className="metrics-grid mb-24">
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--blue)' } as React.CSSProperties}>
          <span className="label">Pieces in pipeline</span>
          <span className="value">{drafts.length}</span>
          <span className="trend up"><FileText size={12} /> {stageCounts.draft} still drafts</span>
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--orange)' } as React.CSSProperties}>
          <span className="label">Waiting for review</span>
          <span className="value">{stageCounts.review}</span>
          <span className="trend down" style={{ color: 'var(--orange)' }}><Clock size={12} /> Needs a decision</span>
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--red)' } as React.CSSProperties}>
          <span className="label">Sent back</span>
          <span className="value">{stageCounts.revision}</span>
          <span className="trend down" style={{ color: 'var(--red)' }}><AlertTriangle size={12} /> With the creator</span>
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--green)' } as React.CSSProperties}>
          <span className="label">Approved or live</span>
          <span className="value">{stageCounts.approved + stageCounts.live}</span>
          <span className="trend up"><CheckCircle2 size={12} /> {stageCounts.approved} ready to go out</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', background: 'var(--fill-tertiary)', padding: '3px', borderRadius: '10px', width: 'fit-content', maxWidth: '100%', overflowX: 'auto' }}>
        {tabs.map(([key, label, Icon]) => (
          <button key={key} onClick={() => setActiveTab(key)} style={{ padding: '6px 14px', borderRadius: '7px', border: 'none', fontSize: '12px', fontWeight: 700, background: activeTab === key ? 'var(--bg-layer1)' : 'transparent', color: activeTab === key ? 'var(--blue)' : 'var(--label-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
            <Icon size={13} />{label}
          </button>
        ))}
      </div>

      {/* ── APPROVALS ─────────────────────────────────────────────────────────── */}
      {activeTab === 'maker-checker' && (
        <div className="maker-checker-layout" style={{ display: 'grid', gridTemplateColumns: selectedDraft ? '1fr 380px' : '1fr', gap: '20px', alignItems: 'start' }}>
          <div style={{ minWidth: 0, overflowX: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px', fontSize: '11px', color: 'var(--label-secondary)', flexWrap: 'wrap' }}>
              {STAGES.map((s, i) => (
                <React.Fragment key={s.key}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color, display: 'inline-block' }} />
                    <span style={{ fontWeight: 600 }}>{s.label}</span>
                    <span style={{ background: 'var(--fill-primary)', borderRadius: '10px', padding: '1px 6px', fontSize: '10px', fontWeight: 700 }}>{stageCounts[s.key]}</span>
                  </div>
                  {i < STAGES.length - 1 && <ArrowRight size={11} style={{ color: 'var(--separator)' }} />}
                </React.Fragment>
              ))}
            </div>

            <div className="kanban-board" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(190px, 1fr))', gap: '12px', alignItems: 'start' }}>
              {STAGES.map((stage) => (
                <div
                  key={stage.key}
                  onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverStage(stage.key); }}
                  onDragLeave={() => setDragOverStage(null)}
                  onDrop={(e) => handleDrop(e, stage.key)}
                  style={{ background: dragOverStage === stage.key ? 'var(--fill-tertiary)' : 'var(--fill-quaternary)', borderRadius: '12px', padding: '12px', minHeight: '320px', borderTop: `3px solid ${stage.color}`, outline: dragOverStage === stage.key ? `2px dashed ${stage.color}` : '2px dashed transparent', transition: 'background 120ms, outline 120ms' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--label-secondary)', textTransform: 'uppercase' }}>{stage.label}</span>
                    <span style={{ fontSize: '10px', background: 'var(--fill-primary)', borderRadius: '10px', padding: '1px 6px', fontWeight: 700 }}>{stageCounts[stage.key]}</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {draftsByStage[stage.key].map((d) => (
                      <div
                        key={d.id}
                        draggable
                        onDragStart={(e) => { dragId.current = d.id; e.dataTransfer.effectAllowed = 'move'; }}
                        onDragEnd={() => { setDragOverStage(null); dragId.current = null; }}
                        onClick={() => { setSelectedId(d.id); setDetailMode('view'); }}
                        style={{ background: 'var(--bg-layer1)', padding: '10px', borderRadius: '8px', cursor: 'grab', border: selectedId === d.id ? '1.5px solid var(--blue)' : '1.5px solid transparent', boxShadow: '0 1px 2px rgba(12,62,51,0.06)', userSelect: 'none' }}
                      >
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                          <img src={productImage(d.product)} alt="" draggable={false} style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover', background: 'var(--bg-layer2)', flexShrink: 0 }} />
                          <div style={{ fontSize: '11px', fontWeight: 700, lineHeight: 1.3 }}>{d.title}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: '6px 0 2px' }}>
                          <PlatformIcon platform={d.platform} size={11} />
                          <span style={{ fontSize: '10px', color: 'var(--label-secondary)' }}>{d.platform}</span>
                        </div>
                        {d.author && <div style={{ fontSize: '10px', color: 'var(--label-secondary)' }}>{d.author} · v{d.version ?? 1}</div>}
                        {d.rejectionReason && stage.key === 'revision' && (
                          <div style={{ fontSize: '10px', color: 'var(--red)', marginTop: '4px', display: 'flex', gap: '4px' }}><AlertTriangle size={10} style={{ flexShrink: 0, marginTop: '1px' }} />{d.rejectionReason}</div>
                        )}
                        {d.scheduleDate && (stage.key === 'approved' || stage.key === 'live') && (
                          <div style={{ fontSize: '10px', color: 'var(--blue)', marginTop: '4px', display: 'flex', gap: '4px', alignItems: 'center' }}><CalendarClock size={10} />{fmtSchedule(d.scheduleDate, d.scheduleTime)}</div>
                        )}
                        {(d.comments?.length ?? 0) > 0 && (
                          <div style={{ fontSize: '10px', color: 'var(--label-secondary)', marginTop: '4px', display: 'flex', gap: '4px', alignItems: 'center' }}><MessageSquare size={10} />{d.comments!.length}</div>
                        )}

                        <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }} onClick={(e) => e.stopPropagation()}>
                          {stage.key === 'draft' && <button className="btn-primary" style={{ fontSize: '10px', padding: '3px 6px', flexGrow: 1 }} onClick={() => handleSubmitForReview(d)}>Submit</button>}
                          {stage.key === 'review' && (
                            <>
                              <button className="btn-primary" style={{ fontSize: '10px', padding: '3px 6px', flexGrow: 1, background: 'var(--green)' }} onClick={() => handleApprove(d)}>Approve</button>
                              <button className="btn-secondary" style={{ fontSize: '10px', padding: '3px 6px', color: 'var(--red)' }} onClick={() => { setSelectedId(d.id); setDetailMode('reject'); }}>Revise</button>
                            </>
                          )}
                          {stage.key === 'revision' && <button className="btn-secondary" style={{ fontSize: '10px', padding: '3px 6px', flexGrow: 1 }} onClick={() => handleSubmitForReview(d)}>Resubmit</button>}
                          {stage.key === 'approved' && (
                            <>
                              <button className="btn-primary" style={{ fontSize: '10px', padding: '3px 6px', flexGrow: 1 }} onClick={() => handlePublishNow(d)}>Publish</button>
                              <button className="btn-secondary" style={{ fontSize: '10px', padding: '3px 6px' }} title="Schedule" onClick={() => { setSelectedId(d.id); setDetailMode('schedule'); if (d.scheduleDate) { setScheduleDate(d.scheduleDate); setScheduleTime(d.scheduleTime || '12:00'); } }}><CalendarClock size={11} /></button>
                            </>
                          )}
                          <button aria-label="Delete draft" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--label-tertiary)', padding: '2px' }} onClick={() => handleDelete(d)}><Trash size={11} /></button>
                        </div>
                      </div>
                    ))}
                    {draftsByStage[stage.key].length === 0 && (
                      <div style={{ textAlign: 'center', padding: '20px 0', fontSize: '11px', color: dragOverStage === stage.key ? stage.color : 'var(--label-tertiary)', fontStyle: 'italic' }}>
                        {dragOverStage === stage.key ? `Drop to move to ${stage.label}` : 'Nothing here'}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedDraft && (
            <div className="liquid-card draft-detail-panel" style={{ padding: '20px', position: 'sticky', top: '80px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', borderBottom: '1px solid var(--separator)', paddingBottom: '12px', gap: '8px' }}>
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 4px' }}>{selectedDraft.title}</h4>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span className={`badge ${stageInfo(selectedDraft.status)?.badge || 'badge-grey'}`} style={{ fontSize: '9px' }}>{stageInfo(selectedDraft.status)?.label}</span>
                    <span style={{ fontSize: '10px', color: 'var(--label-secondary)' }}>v{selectedDraft.version ?? 1}</span>
                  </div>
                </div>
                <button aria-label="Close" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--label-secondary)' }} onClick={() => setSelectedId(null)}><X size={16} /></button>
              </div>

              <div style={{ display: 'flex', gap: '4px', marginBottom: '14px', background: 'var(--fill-tertiary)', padding: '2px', borderRadius: '8px' }}>
                {([['view', 'Script', Eye], ['comment', 'Comments', MessageSquare], ['reject', 'Revision', AlertTriangle], ['schedule', 'Schedule', Calendar]] as [DetailMode, string, React.ElementType][]).map(([m, l, Icon]) => (
                  <button key={m} onClick={() => setDetailMode(m)} style={{ flex: 1, padding: '4px', borderRadius: '6px', border: 'none', fontSize: '10px', fontWeight: 700, background: detailMode === m ? 'var(--bg-layer1)' : 'transparent', color: detailMode === m ? 'var(--blue)' : 'var(--label-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                    <Icon size={11} />{l}
                  </button>
                ))}
              </div>

              {detailMode === 'view' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', gap: '10px', fontSize: '11px', flexWrap: 'wrap' }}>
                    <div><span style={{ color: 'var(--label-secondary)' }}>Platform: </span><strong>{selectedDraft.platform}</strong></div>
                    <div><span style={{ color: 'var(--label-secondary)' }}>Type: </span><strong>{selectedDraft.type}</strong></div>
                    <div><span style={{ color: 'var(--label-secondary)' }}>By: </span><strong>{selectedDraft.author || 'Team'}</strong></div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '11px', color: 'var(--label-secondary)' }}>
                    <img src={productImage(selectedDraft.product)} alt="" style={{ width: '28px', height: '28px', borderRadius: '5px', objectFit: 'cover', background: 'var(--bg-layer2)' }} />
                    {selectedDraft.product}
                  </div>
                  <div style={{ background: 'var(--fill-quaternary)', padding: '12px', borderRadius: '8px', fontSize: '12px', lineHeight: 1.6, color: 'var(--label-secondary)', whiteSpace: 'pre-line', maxHeight: '260px', overflowY: 'auto' }}>
                    {selectedDraft.scriptText}
                  </div>
                  {selectedDraft.rejectionReason && selectedDraft.status === 'revision' && (
                    <div style={{ background: 'rgba(229,72,61,0.07)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(229,72,61,0.2)' }}>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--red)', marginBottom: '3px' }}>Note from {selectedDraft.reviewedBy || REVIEWER}</div>
                      <div style={{ fontSize: '11px', color: 'var(--label-secondary)' }}>{selectedDraft.rejectionReason}</div>
                    </div>
                  )}
                  {selectedDraft.scheduleDate && selectedDraft.status !== 'draft' && (
                    <div style={{ fontSize: '11px', color: 'var(--label-secondary)', display: 'flex', gap: '5px', alignItems: 'center' }}><CalendarClock size={12} style={{ color: 'var(--blue)' }} /> {selectedDraft.status === 'live' ? 'Published' : 'Scheduled'} {fmtSchedule(selectedDraft.scheduleDate, selectedDraft.scheduleTime)}</div>
                  )}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {selectedDraft.status === 'draft' && <button className="btn-primary" style={{ fontSize: '11px', flexGrow: 1 }} onClick={() => handleSubmitForReview(selectedDraft)}>Submit for review</button>}
                    {selectedDraft.status === 'review' && (
                      <>
                        <button className="btn-primary" style={{ fontSize: '11px', flexGrow: 1, background: 'var(--green)' }} onClick={() => handleApprove(selectedDraft)}>Approve</button>
                        <button className="btn-secondary" style={{ fontSize: '11px', color: 'var(--red)' }} onClick={() => setDetailMode('reject')}>Request revision</button>
                      </>
                    )}
                    {selectedDraft.status === 'revision' && <button className="btn-secondary" style={{ fontSize: '11px', flexGrow: 1 }} onClick={() => handleSubmitForReview(selectedDraft)}>Resubmit</button>}
                    {selectedDraft.status === 'approved' && (
                      <>
                        <button className="btn-primary" style={{ fontSize: '11px', flexGrow: 1 }} onClick={() => handlePublishNow(selectedDraft)}>Publish now</button>
                        <button className="btn-secondary" style={{ fontSize: '11px' }} onClick={() => setDetailMode('schedule')}>Schedule</button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {detailMode === 'comment' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(selectedDraft.comments || []).length === 0 && <div style={{ fontSize: '12px', color: 'var(--label-secondary)', textAlign: 'center', padding: '20px' }}>No comments yet.</div>}
                    {(selectedDraft.comments || []).map((c, i) => (
                      <div key={i} style={{ background: 'var(--fill-quaternary)', padding: '10px', borderRadius: '8px', fontSize: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', gap: '8px' }}>
                          <span style={{ fontWeight: 700, color: 'var(--blue)' }}>{c.author}</span>
                          <span style={{ fontSize: '10px', color: 'var(--label-secondary)' }}>{c.time}</span>
                        </div>
                        <div style={{ color: 'var(--label-secondary)' }}>{c.text}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="text" className="input" placeholder="Add a comment" value={commentInput} onChange={(e) => setCommentInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment(selectedDraft.id); }} style={{ flexGrow: 1, fontSize: '12px', padding: '7px 10px' }} />
                    <button className="btn-primary" aria-label="Send comment" onClick={() => handleAddComment(selectedDraft.id)}><Send size={13} /></button>
                  </div>
                </div>
              )}

              {detailMode === 'reject' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ background: 'rgba(229,72,61,0.06)', padding: '10px', borderRadius: '8px', fontSize: '11px', color: 'var(--label-secondary)', border: '1px solid rgba(229,72,61,0.15)' }}>
                    The draft moves to Needs Revision and your note goes to {selectedDraft.author || 'the creator'}.
                  </div>
                  <div>
                    <label style={labelStyle}>What needs to change</label>
                    <textarea className="input" rows={4} value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="e.g. The hook is generic. Start with the 4 pm slump. Show the price in the first 3 seconds." style={{ width: '100%', fontSize: '12px', resize: 'none', padding: '8px 10px' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-secondary" style={{ flexGrow: 1, fontSize: '11px' }} onClick={() => setDetailMode('view')}>Cancel</button>
                    <button className="btn-primary" style={{ flexGrow: 1, fontSize: '11px', background: 'var(--red)' }} onClick={() => handleRequestRevision(selectedDraft)}>Send back</button>
                  </div>
                </div>
              )}

              {detailMode === 'schedule' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {selectedDraft.status !== 'approved' ? (
                    <div style={{ background: 'rgba(242,167,27,0.12)', padding: '10px', borderRadius: '8px', fontSize: '11px', color: 'var(--label-secondary)' }}>Only approved pieces can be scheduled. Approve this one first.</div>
                  ) : (
                    <>
                      <div style={{ background: 'rgba(0,82,59,0.06)', padding: '10px', borderRadius: '8px', fontSize: '11px', color: 'var(--label-secondary)' }}>
                        Goes out on <strong>{selectedDraft.platform}</strong> at the chosen time and appears on the calendar.
                      </div>
                      <div>
                        <label style={labelStyle}>Date</label>
                        <input type="date" className="input" min={TODAY_ISO} value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} style={{ width: '100%', fontSize: '12px' }} />
                      </div>
                      <div>
                        <label style={labelStyle}>Time</label>
                        <input type="time" className="input" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} style={{ width: '100%', fontSize: '12px' }} />
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn-secondary" style={{ flexGrow: 1, fontSize: '11px' }} onClick={() => setDetailMode('view')}>Cancel</button>
                        <button className="btn-primary" style={{ flexGrow: 1, fontSize: '11px' }} onClick={() => handleSchedule(selectedDraft)}>Confirm schedule</button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {(selectedDraft.history || []).length > 0 && (
                <div style={{ marginTop: '14px', borderTop: '1px solid var(--separator)', paddingTop: '12px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--label-secondary)', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <History size={11} /> History
                  </div>
                  {[...(selectedDraft.history || [])].reverse().map((h, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', fontSize: '10px', marginBottom: '5px', flexWrap: 'wrap' }}>
                      <span style={{ color: 'var(--label-secondary)', whiteSpace: 'nowrap' }}>{h.time}</span>
                      <span><strong>{h.by}</strong> <span className={`badge ${stageInfo(h.status)?.badge || 'badge-grey'}`} style={{ fontSize: '8px' }}>{stageInfo(h.status)?.label ?? h.status}</span></span>
                      {h.note && <span style={{ color: 'var(--label-secondary)' }}>{h.note}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'calendar' && <CalendarTab posts={calendarPosts} />}

      {activeTab === 'ugc' && <UgcTab showToast={showToast} onSave={saveUgc} presetCreator={presetCreator} />}

      {activeTab === 'creators' && (
        <CreatorsTab
          showToast={showToast}
          onUseInBrief={(name) => { setPresetCreator(name); setActiveTab('ugc'); showToast(`Brief builder opened for ${name.split(' ')[0]}.`, 'info'); }}
        />
      )}

      {activeTab === 'analytics' && <AnalyticsTab stageCounts={stageCounts} />}
    </div>
  );
}
