'use client';

import React, { useMemo, useState } from 'react';
import { useAppContext } from '../../ClientWrapper';
import type { Lead } from '@/lib/data/b2bCrm';
import { STAGE_ORDER, stageLabel, categoryLabel, sourceLabel, intentLabel, interestLabel, parseSentiment, formatWhen } from '@/lib/data/b2bCrm';
import { Search, MapPin, IndianRupee, Users, RefreshCw, TrendingUp, X, Star, CheckCircle2, XCircle } from 'lucide-react';
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

/** "positive - wants_pricing - note" becomes a readable one-liner. */
function sentimentText(raw: string | null): string | null {
  if (!raw) return null;
  const p = parseSentiment(raw);
  const head = [interestLabel(p.interest), intentLabel(p.intent)].filter(Boolean).join(' · ');
  return p.summary ? `${head}. ${p.summary}` : head;
}

export default function LeadsTable({ initialLeads }: { initialLeads: Lead[] }) {
  const { dateRange, showToast } = useAppContext();
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
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
      setLeads((prev) => prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)));
      setSelectedLead((prev) => (prev && prev.id === updated.id ? { ...prev, ...updated } : prev));
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
            Bulk, gifting, retail and distributor leads across cities. Click a row to see details.
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
                <th style={{ padding: '12px 8px' }}>Last reply</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--label-tertiary)' }}>
                    No leads match this filter.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => {
                  const lastReply = [s.whatsapp_last_reply_at, s.email_last_reply_at, s.last_reply_at]
                    .filter(Boolean)
                    .sort((a, b) => new Date(b as string).getTime() - new Date(a as string).getTime())[0];
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
                      <td style={{ padding: '12px 8px', fontSize: '11.5px', color: 'var(--label-tertiary)' }}>
                        {lastReply ? formatWhen(lastReply) : 'No reply yet'}
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
        <div
          className="spotlight-overlay"
          style={{ display: 'flex' }}
          onClick={() => setSelectedLead(null)}
        >
          <div className="spotlight-panel" style={{ maxWidth: '620px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <div className="spotlight-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px' }}>
              <div>
                <span style={{ fontWeight: '700', fontSize: '17px', display: 'block' }}>{selectedLead.company_name}</span>
                <span className={`badge ${STAGE_BADGE[selectedLead.current_stage] ?? 'badge-blue'}`} style={{ marginTop: '6px', display: 'inline-block' }}>
                  {stageLabel(selectedLead.current_stage)}
                </span>
              </div>
              <button className="btn-icon" onClick={() => setSelectedLead(null)}><X size={16} /></button>
            </div>

            <div style={{ padding: '20px', borderTop: '1px solid var(--separator)', borderBottom: '1px solid var(--separator)', maxHeight: '60vh', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '13px' }}>
                <DetailField label="Type of business" value={categoryLabel(selectedLead.category)} />
                <DetailField label="City" value={selectedLead.region} />
                <DetailField label="Locality" value={selectedLead.city} />
                <DetailField
                  label="Google rating"
                  value={selectedLead.google_rating ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Star size={12} style={{ color: 'var(--orange)' }} fill="var(--orange)" />
                      {selectedLead.google_rating} ({selectedLead.google_reviews_count ?? 0} reviews)
                    </span>
                  ) : null}
                />
                <DetailField label="Address" value={selectedLead.address} full />
                <DetailField label="Lead source" value={sourceLabel(selectedLead.lead_source)} />
                <DetailField label="Phone" value={selectedLead.phone} />
                <DetailField label="WhatsApp" value={selectedLead.whatsapp_number} />
                <DetailField label="Email" value={selectedLead.email} />
                <DetailField label="Added on" value={formatWhen(selectedLead.created_at)} />
                <DetailField label="Notes" value={selectedLead.notes} full />
                <DetailField
                  label="WhatsApp conversation"
                  value={sentimentText(selectedLead.whatsapp_sentiment)}
                  full
                  highlight={selectedLead.whatsapp_sentiment?.toLowerCase().startsWith('positive')}
                />
                <DetailField
                  label="Email conversation"
                  value={sentimentText(selectedLead.email_sentiment)}
                  full
                  highlight={selectedLead.email_sentiment?.toLowerCase().startsWith('positive')}
                />
                <DetailField
                  label="Phone call"
                  value={sentimentText(selectedLead.voice_sentiment)}
                  full
                  highlight={selectedLead.voice_sentiment?.toLowerCase().startsWith('positive')}
                />
              </div>
            </div>

            <div style={{ padding: '16px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              {selectedLead.current_stage !== 'won' && selectedLead.current_stage !== 'lost' ? (
                <>
                  <button
                    className="btn-secondary"
                    onClick={() => updateStage(selectedLead, 'lost')}
                    disabled={updatingStage}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--red)' }}
                  >
                    <XCircle size={14} /> Mark as lost
                  </button>
                  <button
                    className="btn-primary"
                    onClick={() => updateStage(selectedLead, 'won')}
                    disabled={updatingStage}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--green)' }}
                  >
                    <CheckCircle2 size={14} /> Mark as won
                  </button>
                </>
              ) : (
                <span style={{ fontSize: '12.5px', color: 'var(--label-tertiary)', fontStyle: 'italic' }}>
                  This lead is already marked {stageLabel(selectedLead.current_stage).toLowerCase()}.
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailField({
  label,
  value,
  full = false,
  highlight = false,
}: {
  label: string;
  value: React.ReactNode;
  full?: boolean;
  highlight?: boolean;
}) {
  return (
    <div style={{ gridColumn: full ? '1 / -1' : undefined }}>
      <span style={{ fontSize: '10.5px', color: 'var(--label-tertiary)', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '2px', letterSpacing: '0.03em' }}>
        {label}
      </span>
      <span style={{ color: highlight ? 'var(--green)' : 'var(--label-primary)', fontWeight: highlight ? 600 : 400 }}>
        {value ?? <span style={{ color: 'var(--label-tertiary)', fontStyle: 'italic' }}>—</span>}
      </span>
    </div>
  );
}
