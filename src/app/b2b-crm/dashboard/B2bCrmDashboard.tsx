'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import Chart from 'chart.js/auto';
import { useAppContext } from '../../ClientWrapper';
import type { Lead, OutreachSequence } from '@/lib/data/b2bCrm';
import { parseSentiment, stageLabel, STAGE_ORDER } from '@/lib/data/b2bCrm';
import { Users, MapPin, MessageSquare, Mail, TrendingUp, Calendar, Send, Reply, Phone, PhoneCall } from 'lucide-react';
import { isWithinDateRange } from '@/lib/dateRangeFilter';
import {
  isConnectedCall,
  formatDuration,
  formatUsd,
  type VapiCallLog,
} from '@/lib/data/vapiCalls';

const STAGES = STAGE_ORDER as readonly string[];

function formatKolkata(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export default function B2bCrmDashboard({
  leads,
  outreachSequences,
  vapiCalls = [],
}: {
  leads: Lead[];
  outreachSequences: OutreachSequence[];
  vapiCalls?: VapiCallLog[];
}) {
  const funnelChartRef = useRef<HTMLCanvasElement | null>(null);
  const funnelChartInstance = useRef<Chart | null>(null);
  const regionChartRef = useRef<HTMLCanvasElement | null>(null);
  const regionChartInstance = useRef<Chart | null>(null);

  const { dateRange, dateLabel } = useAppContext();

  // Leads (funnel/region/win-rate) filtered by created_at
  const dateLeads = useMemo(
    () => leads.filter((s) => isWithinDateRange(s.created_at, dateRange)),
    [leads, dateRange]
  );

  // Outreach sends filtered by executed_at
  const dateOutreach = useMemo(
    () => outreachSequences.filter((o) => isWithinDateRange(o.executed_at, dateRange)),
    [outreachSequences, dateRange]
  );

  // Replies/engagement/sentiment filtered by their own *_last_reply_at column
  const dateEmailReplyLeads = useMemo(
    () => leads.filter((s) => s.email_last_reply_at && isWithinDateRange(s.email_last_reply_at, dateRange)),
    [leads, dateRange]
  );
  const dateWhatsappReplyLeads = useMemo(
    () => leads.filter((s) => s.whatsapp_last_reply_at && isWithinDateRange(s.whatsapp_last_reply_at, dateRange)),
    [leads, dateRange]
  );

  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const stage of STAGES) counts[stage] = 0;
    for (const s of dateLeads) counts[s.current_stage] = (counts[s.current_stage] ?? 0) + 1;
    return counts;
  }, [dateLeads]);

  const regionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of dateLeads) counts[s.region] = (counts[s.region] ?? 0) + 1;
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [dateLeads]);

  const totalLeads = dateLeads.length;
  const activeLeads = dateLeads.filter((s) => s.current_stage !== 'won' && s.current_stage !== 'lost').length;
  const wonCount = stageCounts.won ?? 0;
  const lostCount = stageCounts.lost ?? 0;
  const winRate = wonCount + lostCount > 0 ? ((wonCount / (wonCount + lostCount)) * 100).toFixed(1) : '—';

  // Follow-ups sent per channel
  const emailsSent = dateOutreach.filter((o) => o.channel === 'email' && o.status === 'sent');
  const whatsappSent = dateOutreach.filter((o) => o.channel === 'whatsapp' && o.status === 'sent');
  const lastEmailSentAt = emailsSent[0]?.executed_at ?? null;
  const lastWhatsappSentAt = whatsappSent[0]?.executed_at ?? null;

  // Replies: leads.email_last_reply_at / whatsapp_last_reply_at not null, within range
  const emailReplies = dateEmailReplyLeads;
  const whatsappReplies = dateWhatsappReplyLeads;
  const lastEmailReplyAt = emailReplies
    .map((s) => s.email_last_reply_at as string)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? null;
  const lastWhatsappReplyAt = whatsappReplies
    .map((s) => s.whatsapp_last_reply_at as string)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? null;

  // Phone calls, anchored on started_at || created_at, within range
  const dateVoiceCalls = useMemo(
    () =>
      vapiCalls.filter((c) =>
        isWithinDateRange(c.started_at ?? c.created_at, dateRange)
      ),
    [vapiCalls, dateRange]
  );
  const voiceConnected = useMemo(() => dateVoiceCalls.filter(isConnectedCall), [dateVoiceCalls]);
  const voiceConnectRate =
    dateVoiceCalls.length > 0 ? Math.round((voiceConnected.length / dateVoiceCalls.length) * 100) : 0;
  const voiceTalkSec = voiceConnected.reduce((s, c) => s + (c.duration_seconds ?? 0), 0);
  const voiceSpendUsd = dateVoiceCalls.reduce((s, c) => s + (c.cost_usd ?? 0), 0);
  const lastVoiceCallAt =
    dateVoiceCalls
      .map((c) => c.started_at ?? c.created_at)
      .filter(Boolean)
      .sort((a, b) => new Date(b as string).getTime() - new Date(a as string).getTime())[0] ?? null;
  const voicePositive = useMemo(() => {
    const calledLeadIds = new Set(
      dateVoiceCalls.map((c) => c.master_leads_id).filter(Boolean).map(String)
    );
    return leads.filter(
      (s) => calledLeadIds.has(String(s.id)) && parseSentiment(s.voice_sentiment).interest === 'positive'
    ).length;
  }, [dateVoiceCalls, leads]);

  // Leads Engaged: any channel's last_reply_at is set, or a voice call connected, within range
  const engagedVoiceLeadIds = useMemo(() => {
    const connectedLeadIds = new Set(voiceConnected.map((c) => c.master_leads_id).filter(Boolean).map(String));
    return leads.filter((s) => connectedLeadIds.has(String(s.id))).map((s) => s.id);
  }, [voiceConnected, leads]);
  const engagedLeads = new Set(
    [...emailReplies, ...whatsappReplies].map((s) => s.id).concat(engagedVoiceLeadIds)
  ).size;

  // Positive Signals: parse "positive - wants_sample - ..." format from both sentiment columns,
  // gated by whether that channel's reply falls within the selected date range
  const positiveSignals = useMemo(() => {
    const waIds = new Set(whatsappReplies.map((s) => s.id));
    const emailIds = new Set(emailReplies.map((s) => s.id));
    let waPositive = 0;
    let emailPositive = 0;
    for (const s of dateLeads) {
      if (waIds.has(s.id) && parseSentiment(s.whatsapp_sentiment).interest === 'positive') waPositive++;
      if (emailIds.has(s.id) && parseSentiment(s.email_sentiment).interest === 'positive') emailPositive++;
    }
    return { waPositive, emailPositive, total: waPositive + emailPositive };
  }, [dateLeads, whatsappReplies, emailReplies]);

  useEffect(() => {
    if (funnelChartRef.current) {
      if (funnelChartInstance.current) funnelChartInstance.current.destroy();
      const ctx = funnelChartRef.current.getContext('2d');
      if (ctx) {
        funnelChartInstance.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: STAGES.map(stageLabel),
            datasets: [
              {
                label: 'Leads',
                data: STAGES.map((s) => stageCounts[s] ?? 0),
                backgroundColor: STAGES.map((s) =>
                  s === 'won' ? '#00523B' : s === 'lost' ? '#D9534F' : s === 'negotiation' ? '#F2A71B' : '#348A5C'
                ),
                borderRadius: 6,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { grid: { display: false }, ticks: { color: 'rgba(60,60,67,0.7)', font: { size: 10 } } },
              y: { grid: { color: 'rgba(60,60,67,0.10)' }, ticks: { color: 'rgba(60,60,67,0.7)', precision: 0 } },
            },
          },
        });
      }
    }
    return () => { funnelChartInstance.current?.destroy(); };
  }, [stageCounts]);

  useEffect(() => {
    if (regionChartRef.current) {
      if (regionChartInstance.current) regionChartInstance.current.destroy();
      const ctx = regionChartRef.current.getContext('2d');
      if (ctx) {
        regionChartInstance.current = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: regionCounts.map(([region]) => region),
            datasets: [
              {
                data: regionCounts.map(([, count]) => count),
                backgroundColor: ['#00523B', '#F2A71B', '#348A5C', '#0C3E33', '#F9C200', '#7FB89A', '#C98A0B', '#B7CDBF'],
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'right', labels: { color: 'rgba(60,60,67,0.8)', font: { size: 11 } } } },
          },
        });
      }
    }
    return () => { regionChartInstance.current?.destroy(); };
  }, [regionCounts]);

  return (
    <div style={{ animation: 'fadeIn 300ms ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--label-primary)', margin: 0 }}>B2B CRM Dashboard</h2>
          <p style={{ fontSize: '13px', color: 'var(--label-secondary)', marginTop: '4px', marginBottom: 0 }}>
            How the bulk, gifting and distributor pipeline is moving: new leads, follow-ups sent, replies and Aarav's phone calls.
          </p>
        </div>
      </div>

      {/* Row 1: Pipeline overview */}
      <div className="metrics-grid mb-24">
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--brand)' } as React.CSSProperties}>
          <span className="label">Total leads</span>
          <span className="value">{totalLeads}</span>
          <span className="trend up" style={{ color: 'var(--blue)' }}><Users size={12} /> {activeLeads} still open</span>
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--green)' } as React.CSSProperties}>
          <span className="label">Win rate</span>
          <span className="value">{winRate}{winRate !== '—' ? '%' : ''}</span>
          <span className="trend up" style={{ color: 'var(--green)' }}><TrendingUp size={12} /> {wonCount} won / {lostCount} lost</span>
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--purple)' } as React.CSSProperties}>
          <span className="label">Leads engaged</span>
          <span className="value">{engagedLeads}</span>
          <span className="trend up" style={{ color: 'var(--purple)' }}><Calendar size={12} /> Replied or picked up the phone</span>
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--orange)' } as React.CSSProperties}>
          <span className="label">Positive replies</span>
          <span className="value">{positiveSignals.total + voicePositive}</span>
          <span className="trend up" style={{ color: 'var(--orange)' }}><MessageSquare size={12} /> {positiveSignals.waPositive} WhatsApp, {positiveSignals.emailPositive} email, {voicePositive} phone</span>
        </div>
      </div>

      {/* Row 2: Channel sends & replies */}
      <div className="metrics-grid mb-24">
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--green)' } as React.CSSProperties}>
          <span className="label">Emails sent</span>
          <span className="value">{emailsSent.length}</span>
          <span className="trend up" style={{ color: 'var(--green)' }}><Send size={12} /> Last: {formatKolkata(lastEmailSentAt)}</span>
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--brand)' } as React.CSSProperties}>
          <span className="label">Email replies</span>
          <span className="value">{emailReplies.length}</span>
          <span className="trend up" style={{ color: 'var(--blue)' }}><Reply size={12} /> Last: {formatKolkata(lastEmailReplyAt)}</span>
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--green)' } as React.CSSProperties}>
          <span className="label">WhatsApp messages sent</span>
          <span className="value">{whatsappSent.length}</span>
          <span className="trend up" style={{ color: 'var(--green)' }}><Send size={12} /> Last: {formatKolkata(lastWhatsappSentAt)}</span>
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--purple)' } as React.CSSProperties}>
          <span className="label">WhatsApp replies</span>
          <span className="value">{whatsappReplies.length}</span>
          <span className="trend up" style={{ color: 'var(--purple)' }}><Reply size={12} /> Last: {formatKolkata(lastWhatsappReplyAt)}</span>
        </div>
      </div>

      {/* Row 3: phone calls by Aarav */}
      <div className="metrics-grid mb-24">
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--purple)' } as React.CSSProperties}>
          <span className="label">Calls placed</span>
          <span className="value">{dateVoiceCalls.length}</span>
          <span className="trend up" style={{ color: 'var(--purple)' }}><PhoneCall size={12} /> Last: {formatKolkata(lastVoiceCallAt)}</span>
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--green)' } as React.CSSProperties}>
          <span className="label">Pick-up rate</span>
          <span className="value">{dateVoiceCalls.length ? `${voiceConnectRate}%` : '—'}</span>
          <span className="trend up" style={{ color: 'var(--green)' }}><Phone size={12} /> {voiceConnected.length} picked up</span>
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--brand)' } as React.CSSProperties}>
          <span className="label">Talk time</span>
          <span className="value">{formatDuration(voiceTalkSec)}</span>
          <span className="trend up" style={{ color: 'var(--blue)' }}><Calendar size={12} /> Across answered calls</span>
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--orange)' } as React.CSSProperties}>
          <span className="label">Calling cost</span>
          <span className="value">{formatUsd(voiceSpendUsd)}</span>
          <span className="trend up" style={{ color: 'var(--orange)' }}><TrendingUp size={12} /> {dateVoiceCalls.length} calls</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div className="liquid-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Where leads are in the pipeline</h3>
          <div style={{ height: '300px', position: 'relative' }}>
            <canvas ref={funnelChartRef}></canvas>
          </div>
        </div>

        <div className="liquid-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={16} /> Leads by city
          </h3>
          <div style={{ height: '260px', position: 'relative' }}>
            {regionCounts.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--label-tertiary)', fontSize: '13px' }}>
                No leads in this date range.
              </div>
            ) : (
              <canvas ref={regionChartRef}></canvas>
            )}
          </div>
        </div>
      </div>

      <div className="liquid-card" style={{ padding: '24px', marginTop: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Mail size={16} /> Follow-up activity
        </h3>
        <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          <div style={{ background: 'var(--fill-quaternary)', padding: '14px', borderRadius: '12px' }}>
            <span style={{ fontSize: '11px', color: 'var(--label-secondary)', textTransform: 'uppercase', fontWeight: '600' }}>WhatsApp follow-ups</span>
            <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--green)', marginTop: '4px' }}>{whatsappSent.length}</div>
            <div style={{ fontSize: '11px', color: 'var(--label-tertiary)', marginTop: '2px' }}>{whatsappReplies.length} leads replied</div>
          </div>
          <div style={{ background: 'var(--fill-quaternary)', padding: '14px', borderRadius: '12px' }}>
            <span style={{ fontSize: '11px', color: 'var(--label-secondary)', textTransform: 'uppercase', fontWeight: '600' }}>Email follow-ups</span>
            <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--blue)', marginTop: '4px' }}>{emailsSent.length}</div>
            <div style={{ fontSize: '11px', color: 'var(--label-tertiary)', marginTop: '2px' }}>{emailReplies.length} leads replied</div>
          </div>
          <div style={{ background: 'var(--fill-quaternary)', padding: '14px', borderRadius: '12px' }}>
            <span style={{ fontSize: '11px', color: 'var(--label-secondary)', textTransform: 'uppercase', fontWeight: '600' }}>Phone calls</span>
            <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--purple)', marginTop: '4px' }}>{dateVoiceCalls.length}</div>
            <div style={{ fontSize: '11px', color: 'var(--label-tertiary)', marginTop: '2px' }}>{voiceConnected.length} picked up · {voicePositive} positive</div>
          </div>
          <div style={{ background: 'var(--fill-quaternary)', padding: '14px', borderRadius: '12px' }}>
            <span style={{ fontSize: '11px', color: 'var(--label-secondary)', textTransform: 'uppercase', fontWeight: '600' }}>Meetings & negotiation</span>
            <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--purple)', marginTop: '4px' }}>
              {(stageCounts.demo_booked ?? 0) + (stageCounts.negotiation ?? 0)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--label-tertiary)', marginTop: '2px' }}>Late-stage open leads</div>
          </div>
        </div>
      </div>
    </div>
  );
}
