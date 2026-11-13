'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import Chart from 'chart.js/auto';
import { useAppContext } from '../../ClientWrapper';
import type { Lead, OutreachSequence } from '@/lib/data/b2bCrm';
import { parseSentiment, stageLabel, STAGE_ORDER } from '@/lib/data/b2bCrm';
import { Users, MapPin, MessageSquare, Mail, TrendingUp, Calendar, Send, Reply, Phone, PhoneCall, Clock, Package, CalendarClock } from 'lucide-react';
import Link from 'next/link';
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

  // Messages actually sent per channel, counted from the conversations themselves
  const outboundAt = (key: 'conversation_transcript' | 'conversation_transcript_email') =>
    leads
      .flatMap((l) => (l[key] ?? []).filter((e) => e.direction === 'outbound' && isWithinDateRange(e.at, dateRange)).map((e) => e.at))
      .sort((a, b) => (a < b ? 1 : -1));
  const emailsSent = outboundAt('conversation_transcript_email');
  const whatsappSent = outboundAt('conversation_transcript');
  const lastEmailSentAt = emailsSent[0] ?? null;
  const lastWhatsappSentAt = whatsappSent[0] ?? null;

  // Reply rates: share of leads we wrote to (in range) who wrote back on that channel
  const rateFor = (key: 'conversation_transcript' | 'conversation_transcript_email') => {
    const contacted = leads.filter((l) => (l[key] ?? []).some((e) => e.direction === 'outbound' && isWithinDateRange(e.at, dateRange)));
    const replied = contacted.filter((l) => (l[key] ?? []).some((e) => e.direction === 'inbound'));
    return { contacted: contacted.length, replied: replied.length, pct: contacted.length ? Math.round((replied.length / contacted.length) * 100) : 0 };
  };
  const waRate = rateFor('conversation_transcript');
  const emRate = rateFor('conversation_transcript_email');

  // Typical time from our first message to the lead's first reply, any written channel
  const firstReplyHours = useMemo(() => {
    const hrs: number[] = [];
    for (const l of dateLeads) {
      const all = [...(l.conversation_transcript ?? []), ...(l.conversation_transcript_email ?? [])].sort((a, b) => (a.at < b.at ? -1 : 1));
      const firstOut = all.find((e) => e.direction === 'outbound');
      const firstIn = firstOut ? all.find((e) => e.direction === 'inbound' && e.at > firstOut.at) : undefined;
      if (firstOut && firstIn) hrs.push((new Date(firstIn.at).getTime() - new Date(firstOut.at).getTime()) / 3_600_000);
    }
    if (!hrs.length) return null;
    hrs.sort((a, b) => a - b);
    return { median: hrs[Math.floor(hrs.length / 2)], count: hrs.length };
  }, [dateLeads]);

  // Sample to order
  const sampleStats = useMemo(() => {
    const sampled = leads.filter((l) => (l.system_events ?? []).some((e) => e.kind === 'sample'));
    const ordered = sampled.filter((l) => l.current_stage === 'won');
    const deciding = sampled.filter((l) => !['won', 'lost'].includes(l.current_stage));
    return { sampled: sampled.length, ordered: ordered.length, deciding: deciding.length, lost: sampled.length - ordered.length - deciding.length };
  }, [leads]);

  // Positive share among leads that replied on any channel
  const repliedLeads = dateLeads.filter((l) => l.last_reply_at);
  const positiveShare = repliedLeads.length
    ? Math.round(
        (repliedLeads.filter((l) => [l.whatsapp_sentiment, l.email_sentiment, l.voice_sentiment].some((v) => parseSentiment(v).interest === 'positive')).length /
          repliedLeads.length) * 100
      )
    : 0;

  // Planned touches over the next 7 days
  const upcoming = useMemo(() => {
    const now = Date.now();
    const byId = new Map(leads.map((l) => [l.id, l]));
    return outreachSequences
      .filter((o) => o.status === 'scheduled')
      .map((o) => ({ o, t: new Date(o.scheduled_date).getTime(), lead: byId.get(o.lead_id) }))
      .filter((x) => x.lead && x.t >= now - 3_600_000 && x.t <= now + 7 * 86_400_000)
      .sort((a, b) => a.t - b.t);
  }, [outreachSequences, leads]);

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
          <span className="label">Email reply rate</span>
          <span className="value">{emRate.contacted ? `${emRate.pct}%` : '—'}</span>
          <span className="trend up" style={{ color: 'var(--blue)' }}><Reply size={12} /> {emRate.replied} of {emRate.contacted} leads · last {formatKolkata(lastEmailReplyAt)}</span>
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--green)' } as React.CSSProperties}>
          <span className="label">WhatsApp messages sent</span>
          <span className="value">{whatsappSent.length}</span>
          <span className="trend up" style={{ color: 'var(--green)' }}><Send size={12} /> Last: {formatKolkata(lastWhatsappSentAt)}</span>
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--purple)' } as React.CSSProperties}>
          <span className="label">WhatsApp reply rate</span>
          <span className="value">{waRate.contacted ? `${waRate.pct}%` : '—'}</span>
          <span className="trend up" style={{ color: 'var(--purple)' }}><Reply size={12} /> {waRate.replied} of {waRate.contacted} leads · last {formatKolkata(lastWhatsappReplyAt)}</span>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginTop: '16px' }}>
          <div style={{ background: 'var(--fill-quaternary)', padding: '14px', borderRadius: '12px' }}>
            <span style={{ fontSize: '11px', color: 'var(--label-secondary)', textTransform: 'uppercase', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' }}><Clock size={12} /> Typical first reply</span>
            <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--label-primary)', marginTop: '4px' }}>
              {firstReplyHours ? (firstReplyHours.median < 24 ? `${firstReplyHours.median.toFixed(1)} hrs` : `${(firstReplyHours.median / 24).toFixed(1)} days`) : '—'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--label-tertiary)', marginTop: '2px' }}>Median, across {firstReplyHours?.count ?? 0} leads who replied</div>
          </div>
          <div style={{ background: 'var(--fill-quaternary)', padding: '14px', borderRadius: '12px' }}>
            <span style={{ fontSize: '11px', color: 'var(--label-secondary)', textTransform: 'uppercase', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' }}><TrendingUp size={12} /> Positive interest</span>
            <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--green)', marginTop: '4px' }}>{repliedLeads.length ? `${positiveShare}%` : '—'}</div>
            <div style={{ fontSize: '11px', color: 'var(--label-tertiary)', marginTop: '2px' }}>Of {repliedLeads.length} leads who replied</div>
          </div>
          <div style={{ background: 'var(--fill-quaternary)', padding: '14px', borderRadius: '12px' }}>
            <span style={{ fontSize: '11px', color: 'var(--label-secondary)', textTransform: 'uppercase', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' }}><Package size={12} /> Sample to order</span>
            <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--brand)', marginTop: '4px' }}>
              {sampleStats.ordered + sampleStats.lost > 0 ? `${Math.round((sampleStats.ordered / (sampleStats.ordered + sampleStats.lost)) * 100)}%` : '—'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--label-tertiary)', marginTop: '2px' }}>
              {sampleStats.sampled} samples sent · {sampleStats.ordered} ordered · {sampleStats.deciding} still deciding
            </div>
          </div>
        </div>
      </div>

      <div className="liquid-card" style={{ padding: '24px', marginTop: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '14px', gap: '8px', flexWrap: 'wrap' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarClock size={16} /> Upcoming outreach
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--label-tertiary)' }}>Next 7 days · {upcoming.length} planned touches</span>
        </div>
        {upcoming.length === 0 ? (
          <div style={{ fontSize: '13px', color: 'var(--label-tertiary)' }}>Nothing planned for the next 7 days.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {upcoming.slice(0, 12).map(({ o, lead }) => (
              <div key={o.id} style={{ display: 'grid', gridTemplateColumns: '28px minmax(0, 1.2fr) minmax(0, 1.6fr) auto', gap: '10px', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--separator)', fontSize: '12.5px' }}>
                <span style={{ width: '26px', height: '26px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--fill-quaternary)', color: o.channel === 'whatsapp' ? '#1E9E57' : o.channel === 'email' ? 'var(--blue)' : 'var(--purple)' }}>
                  {o.channel === 'whatsapp' ? <MessageSquare size={13} /> : o.channel === 'email' ? <Mail size={13} /> : <Phone size={13} />}
                </span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead!.company_name}</span>
                  <span style={{ fontSize: '11px', color: 'var(--label-tertiary)' }}>{stageLabel(lead!.current_stage)} · {lead!.region}</span>
                </span>
                <span style={{ color: 'var(--label-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.label ?? 'Follow-up'}</span>
                <span style={{ fontSize: '11.5px', color: 'var(--label-tertiary)', whiteSpace: 'nowrap' }}>{formatKolkata(o.scheduled_date)}</span>
              </div>
            ))}
            {upcoming.length > 12 && (
              <Link href="/b2b-crm/leads" style={{ fontSize: '12px', color: 'var(--brand)', marginTop: '10px', fontWeight: 600 }}>
                +{upcoming.length - 12} more in the leads list
              </Link>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
