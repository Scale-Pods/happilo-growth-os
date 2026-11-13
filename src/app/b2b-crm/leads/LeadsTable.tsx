'use client';

import React, { useMemo, useState } from 'react';
import { useAppContext } from '../../ClientWrapper';
import type { Lead, OutreachSequence, TranscriptEntry } from '@/lib/data/b2bCrm';
import { STAGE_ORDER, stageLabel, categoryLabel, sourceLabel, formatWhen } from '@/lib/data/b2bCrm';
import type { VapiCallLog } from '@/lib/data/vapiCalls';
import { Search, MapPin, IndianRupee, Users, RefreshCw, TrendingUp, MessageSquare, Mail, Phone } from 'lucide-react';
import LeadDrawer, { type ScheduledLocal } from './LeadDrawer';
import { isWithinDateRange } from '@/lib/dateRangeFilter';

const STAGES = STAGE_ORDER as readonly string[];

const STAGE_BADGE: Record<string, string> = {
  lead_generated: 'badge-blue',
  contacted: 'badge-blue',
  interested: 'badge-orange',
  sample_sent: 'badge-orange',
  demo_booked: 'badge-orange',
  negotiation: 'badge-orange',
  won: 'badge-green',
  lost: 'badge-red',
};

export default function LeadsTable({
  initialLeads,
  calls = [],
  sequences = [],
}: {
  initialLeads: Lead[];
  calls?: VapiCallLog[];
  sequences?: OutreachSequence[];
}) {
  const { dateRange, showToast } = useAppContext();
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [localSteps, setLocalSteps] = useState<ScheduledLocal[]>([]);

  const callsByLead = useMemo(() => {
    const m = new Map<string, VapiCallLog[]>();
    for (const c of calls) {
      if (!c.master_leads_id) continue;
      const arr = m.get(c.master_leads_id) ?? [];
      arr.push(c);
      m.set(c.master_leads_id, arr);
    }
    return m;
  }, [calls]);

  const seqByLead = useMemo(() => {
    const m = new Map<string, OutreachSequence[]>();
    const all: OutreachSequence[] = [
      ...sequences,
      ...localSteps.map((l) => ({
        id: l.id, lead_id: l.lead_id, outreach_step: 'follow_up', channel: l.channel, scheduled_date: l.at, status: 'scheduled',
        executed_at: null, n8n_execution_id: null, created_at: l.at, label: l.label, skip_reason: null,
      })),
    ];
    for (const s of all) {
      const arr = m.get(s.lead_id) ?? [];
      arr.push(s);
      m.set(s.lead_id, arr);
    }
    return m;
  }, [sequences, localSteps]);

  const patchLead = (id: string, fn: (l: Lead) => Lead) => {
    setLeads((prev) => prev.map((l) => (l.id === id ? fn(l) : l)));
    setSelectedLead((prev) => (prev && prev.id === id ? fn(prev) : prev));
  };
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const refreshing = false;
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [updatingStage, setUpdatingStage] = useState(false);

  const regions = useMemo(
    () => Array.from(new Set(leads.map((s) => s.region).filter(Boolean))).sort(),
    [leads]
  );

  const dateFiltered = useMemo(
    () => leads.filter((s) => isWithinDateRange(s.created_at, dateRange)),
    [leads, dateRange]
  );

  const filtered = useMemo(() => {
    return dateFiltered.filter((s) => {
      const matchesSearch =
        s.company_name.toLowerCase().includes(search.toLowerCase()) ||
        (s.city ?? '').toLowerCase().includes(search.toLowerCase()) ||
        s.region.toLowerCase().includes(search.toLowerCase()) ||
        (s.notes ?? '').toLowerCase().includes(search.toLowerCase());
      const matchesStage = stageFilter === 'all' || s.current_stage === stageFilter;
      const matchesRegion = regionFilter === 'all' || s.region === regionFilter;
      return matchesSearch && matchesStage && matchesRegion;
    });
  }, [dateFiltered, search, stageFilter, regionFilter]);

  const activeCount = dateFiltered.filter((s) => s.current_stage !== 'won' && s.current_stage !== 'lost').length;
  const wonCount = dateFiltered.filter((s) => s.current_stage === 'won').length;
  const interestedCount = dateFiltered.filter((s) => s.current_stage === 'interested').length;

  const updateStage = async (lead: Lead, stage: 'won' | 'lost') => {
    setUpdatingStage(true);
    try {
      const res = await fetch(`/api/b2b-crm/leads/${lead.id}/stage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to update stage');
      const { lead: updated } = await res.json();
      // Keep messages and notes added in this session; take stage and timeline from the server.
      const merge = (l: Lead): Lead => ({
        ...l,
        current_stage: updated.current_stage,
        is_active: updated.is_active,
        updated_at: updated.updated_at,
        system_events: updated.system_events ?? l.system_events,
      });
      patchLead(updated.id, merge);
      showToast(`${updated.company_name} marked as ${stage === 'won' ? 'won' : 'lost'}.`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not update this lead. Please try again.', 'error');
    } finally {
      setUpdatingStage(false);
    }
  };

  return (
    <div style={{ animation: 'fadeIn 300ms ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--label-primary)', margin: 0 }}>B2B Leads</h2>
          <p style={{ fontSize: '13px', color: 'var(--label-secondary)', marginTop: '4px', marginBottom: 0 }}>
            Bulk, gifting, retail and distributor leads across cities. Click a row to open the full history: WhatsApp, email, calls and notes.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            className="btn-secondary"
            onClick={() => window.location.reload()}
            disabled={refreshing}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '13px' }}
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      <div className="metrics-grid mb-24">
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--blue)' } as React.CSSProperties}>
          <span className="label">Total leads</span>
          <span className="value">{dateFiltered.length}</span>
          <span className="trend up" style={{ color: 'var(--blue)' }}><Users size={12} /> All regions</span>
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--orange)' } as React.CSSProperties}>
          <span className="label">Open in pipeline</span>
          <span className="value">{activeCount}</span>
          <span className="trend up" style={{ color: 'var(--orange)' }}><MapPin size={12} /> Not yet won or lost</span>
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--purple)' } as React.CSSProperties}>
          <span className="label">Interested</span>
          <span className="value">{interestedCount}</span>
          <span className="trend up" style={{ color: 'var(--purple)' }}><TrendingUp size={12} /> Asked for prices or details</span>
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--green)' } as React.CSSProperties}>
          <span className="label">Won deals</span>
          <span className="value">{wonCount}</span>
          <span className="trend up" style={{ color: 'var(--green)' }}><IndianRupee size={12} /> Orders confirmed</span>
        </div>
      </div>

      <div className="liquid-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Lead pipeline</h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--label-tertiary)' }} />
              <input
                type="text"
                placeholder="Search company or locality..."
                className="input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ padding: '8px 12px 8px 30px', fontSize: '13px', width: '200px' }}
              />
            </div>
            <select className="input" value={stageFilter} onChange={(e) => setStageFilter(e.target.value)} style={{ padding: '8px', fontSize: '13px' }}>
              <option value="all">All stages</option>
              {STAGES.map((s) => (
                <option key={s} value={s}>{stageLabel(s)}</option>
              ))}
            </select>
            <select className="input" value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)} style={{ padding: '8px', fontSize: '13px' }}>
              <option value="all">All cities</option>
              {regions.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--separator)' }}>
                <th style={{ padding: '12px 8px' }}>Company</th>
                <th style={{ padding: '12px 8px' }}>City</th>
                <th style={{ padding: '12px 8px' }}>Contact</th>
                <th style={{ padding: '12px 8px' }}>Source</th>
                <th style={{ padding: '12px 8px' }}>Stage</th>
                <th style={{ padding: '12px 8px' }}>Touches</th>
                <th style={{ padding: '12px 8px' }}>Last reply</th>
                <th style={{ padding: '12px 8px' }}>Next step</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: 'var(--label-tertiary)' }}>
                    No leads match this filter.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => {
                  const lastReply = [s.whatsapp_last_reply_at, s.email_last_reply_at, s.last_reply_at]
                    .filter(Boolean)
                    .sort((a, b) => new Date(b as string).getTime() - new Date(a as string).getTime())[0];
                  const nCalls = callsByLead.get(s.id)?.length ?? 0;
                  const next = (seqByLead.get(s.id) ?? [])
                    .filter((q) => q.status === 'scheduled')
                    .sort((a, b) => (a.scheduled_date < b.scheduled_date ? -1 : 1))[0];
                  return (
                    <tr
                      key={s.id}
                      onClick={() => setSelectedLead(s)}
                      style={{ borderBottom: '1px solid var(--separator)', cursor: 'pointer' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--fill-quaternary)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '12px 8px' }}>
                        <span style={{ fontWeight: '700', display: 'block' }}>{s.company_name}</span>
                        <span style={{ fontSize: '11px', color: 'var(--label-tertiary)' }}>{categoryLabel(s.category)}{s.google_rating ? ` • ${s.google_rating}★` : ''}</span>
                      </td>
                      <td style={{ padding: '12px 8px' }}>{s.city ? `${s.city}, ${s.region}` : s.region}</td>
                      <td style={{ padding: '12px 8px' }}>
                        <span style={{ display: 'block' }}>{s.whatsapp_number ?? s.phone ?? '—'}</span>
                        <span style={{ fontSize: '11px', color: 'var(--label-tertiary)' }}>{s.email ?? '—'}</span>
                      </td>
                      <td style={{ padding: '12px 8px' }}>{sourceLabel(s.lead_source)}</td>
                      <td style={{ padding: '12px 8px' }}>
                        <span className={`badge ${STAGE_BADGE[s.current_stage] ?? 'badge-blue'}`}>{stageLabel(s.current_stage)}</span>
                      </td>
                      <td style={{ padding: '12px 8px', fontSize: '11.5px', color: 'var(--label-secondary)', whiteSpace: 'nowrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', marginRight: '8px' }} title="WhatsApp messages"><MessageSquare size={11} /> {s.conversation_transcript.length}</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', marginRight: '8px' }} title="Emails"><Mail size={11} /> {s.conversation_transcript_email.length}</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }} title="Calls"><Phone size={11} /> {nCalls}</span>
                      </td>
                      <td style={{ padding: '12px 8px', fontSize: '11.5px', color: 'var(--label-tertiary)' }}>
                        {lastReply ? formatWhen(lastReply) : 'No reply yet'}
                      </td>
                      <td style={{ padding: '12px 8px', fontSize: '11.5px', color: 'var(--label-secondary)', maxWidth: '220px' }}>
                        {next ? (
                          <>
                            <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{next.label ?? 'Follow-up'}</span>
                            <span style={{ fontSize: '10.5px', color: 'var(--label-tertiary)' }}>{formatWhen(next.scheduled_date)}</span>
                          </>
                        ) : '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedLead && (
        <LeadDrawer
          key={selectedLead.id}
          lead={selectedLead}
          calls={callsByLead.get(selectedLead.id) ?? []}
          sequences={seqByLead.get(selectedLead.id) ?? []}
          updating={updatingStage}
          onClose={() => setSelectedLead(null)}
          onStage={(stage) => updateStage(selectedLead, stage)}
          onAppendWhatsapp={(entry: TranscriptEntry) =>
            patchLead(selectedLead.id, (l) => ({ ...l, conversation_transcript: [...l.conversation_transcript, entry], updated_at: entry.at }))
          }
          onNotes={(notes) => patchLead(selectedLead.id, (l) => ({ ...l, notes }))}
          onSchedule={(st) =>
            setLocalSteps((prev) => [...prev, { ...st, id: `local-${Date.now()}`, lead_id: selectedLead.id }])
          }
          showToast={showToast}
        />
      )}
    </div>
  );
}
