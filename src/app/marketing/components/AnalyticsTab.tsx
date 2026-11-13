'use client';

import React, { useState } from 'react';
import {
  ANALYTICS_PERIOD, CHANNEL_STATS, CAMPAIGN_STATS, TOP_POSTS, WEEKLY_REACH, inr, compact, productImage,
} from '@/lib/mock/marketingCalendar';
import { PlatformIcon } from './shared';

const roas = (rev: number, spend: number) => (spend > 0 ? (rev / spend).toFixed(2) + 'x' : '–');
const th: React.CSSProperties = { cursor: 'default' };

export default function AnalyticsTab({ stageCounts }: { stageCounts: Record<string, number> }) {
  const [postSort, setPostSort] = useState<'orders' | 'reach' | 'engagement'>('orders');

  const totals = CHANNEL_STATS.reduce(
    (a, c) => ({ reach: a.reach + c.reach, spend: a.spend + c.spend, orders: a.orders + c.orders, revenue: a.revenue + c.orders * c.aov }),
    { reach: 0, spend: 0, orders: 0, revenue: 0 },
  );
  const maxWeek = Math.max(...WEEKLY_REACH.map((w) => w.reach));
  const posts = [...TOP_POSTS].sort((a, b) => b[postSort] - a[postSort]);
  const totalDrafts = Object.values(stageCounts).reduce((a, b) => a + b, 0) || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ fontSize: '12px', color: 'var(--label-secondary)' }}>Last 30 days, {ANALYTICS_PERIOD}. Orders are attributed on a 7-day click window.</div>

      <div className="metrics-grid">
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--blue)' } as React.CSSProperties}>
          <span className="label">Total reach</span>
          <span className="value">{compact(totals.reach)}</span>
          <span className="trend up">+11.8% vs previous 30 days</span>
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--teal)' } as React.CSSProperties}>
          <span className="label">Orders attributed</span>
          <span className="value">{totals.orders.toLocaleString('en-IN')}</span>
          <span className="trend up">+16.2% vs previous 30 days</span>
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--green)' } as React.CSSProperties}>
          <span className="label">Revenue attributed</span>
          <span className="value">{inr(totals.revenue)}</span>
          <span className="trend up">AOV {inr(totals.revenue / totals.orders)}</span>
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--orange)' } as React.CSSProperties}>
          <span className="label">Blended ROAS</span>
          <span className="value">{roas(totals.revenue, totals.spend)}</span>
          <span className="trend down" style={{ color: 'var(--orange)' }}>on {inr(totals.spend)} spend</span>
        </div>
      </div>

      <div className="liquid-card" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 12px' }}>By channel</h3>
        <div className="table-scroll-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={th}>Channel</th><th style={th}>Reach</th><th style={th}>Engagement</th><th style={th}>CTR</th><th style={th}>Spend</th><th style={th}>Orders</th><th style={th}>Revenue</th><th style={th}>ROAS</th>
              </tr>
            </thead>
            <tbody>
              {CHANNEL_STATS.map((c) => {
                const rev = c.orders * c.aov;
                return (
                  <tr key={c.channel}>
                    <td style={{ fontWeight: 700 }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>{c.channel !== 'Google' && <PlatformIcon platform={c.channel} size={12} />}{c.channel}</span></td>
                    <td>{compact(c.reach)}{c.channel === 'Google' ? ' impr.' : ''}</td>
                    <td>{c.engagement ? c.engagement + '%' : '–'}</td>
                    <td>{c.ctr}%</td>
                    <td>{inr(c.spend)}</td>
                    <td>{c.orders.toLocaleString('en-IN')}</td>
                    <td>{inr(rev)}</td>
                    <td style={{ fontWeight: 700, color: rev / c.spend >= 3.5 ? 'var(--green)' : 'var(--orange)' }}>{roas(rev, c.spend)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: '11px', color: 'var(--label-secondary)', marginTop: '8px' }}>Instagram spend covers creator fees and boosted posts. Google is search and shopping.</div>
      </div>

      <div className="analytics-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="liquid-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 14px' }}>Weekly reach</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '14px', height: '150px' }}>
            {WEEKLY_REACH.map((w) => (
              <div key={w.week} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--label-secondary)' }}>{compact(w.reach)}</span>
                <div style={{ width: '100%', height: `${(w.reach / maxWeek) * 100}px`, background: 'var(--brand-mid)', borderRadius: '5px 5px 0 0' }} />
                <span style={{ fontSize: '10px', color: 'var(--label-secondary)' }}>{w.week}</span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--label-secondary)', marginTop: '10px' }}>Peak was the week of 4 Nov, Diwali week. Last week is partial (to 13 Nov).</div>
        </div>
        <div className="liquid-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 14px' }}>Content pipeline now</h3>
          {[['Drafts', 'draft', 'var(--label-tertiary)'], ['In review', 'review', 'var(--orange)'], ['Needs revision', 'revision', 'var(--red)'], ['Approved', 'approved', 'var(--green)'], ['Published', 'live', 'var(--blue)']].map(([label, key, color]) => (
            <div key={key} style={{ marginBottom: '11px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span>{label}</span><span style={{ fontWeight: 700 }}>{stageCounts[key] || 0}</span>
              </div>
              <div style={{ height: '5px', background: 'var(--fill-primary)', borderRadius: '3px' }}>
                <div style={{ width: `${((stageCounts[key] || 0) / totalDrafts) * 100}%`, height: '100%', background: color, borderRadius: '3px' }} />
              </div>
            </div>
          ))}
          <div style={{ fontSize: '11px', color: 'var(--label-secondary)', marginTop: '8px' }}>First-pass approval this month: 64%. Average revision rounds: 1.4.</div>
        </div>
      </div>

      <div className="liquid-card" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 12px' }}>Campaigns</h3>
        <div className="table-scroll-container">
          <table className="data-table">
            <thead>
              <tr><th>Campaign</th><th>Status</th><th>Dates</th><th>Channels</th><th>Spend</th><th>Reach</th><th>CTR</th><th>Orders</th><th>Revenue</th><th>ROAS</th></tr>
            </thead>
            <tbody>
              {CAMPAIGN_STATS.map((c) => {
                const rev = c.orders * c.aov;
                return (
                  <tr key={c.name}>
                    <td style={{ fontWeight: 700 }}>{c.name}</td>
                    <td><span className={`badge ${c.status === 'Live' ? 'badge-green' : c.status === 'Ended' ? 'badge-grey' : 'badge-orange'}`}>{c.status}</span></td>
                    <td>{c.window}</td>
                    <td>{c.channels}</td>
                    <td>{c.spend ? inr(c.spend) : '–'}</td>
                    <td>{c.reach ? compact(c.reach) : '–'}</td>
                    <td>{c.ctr ? c.ctr + '%' : '–'}</td>
                    <td>{c.orders ? c.orders.toLocaleString('en-IN') : '–'}</td>
                    <td>{rev ? inr(rev) : '–'}</td>
                    <td style={{ fontWeight: 700 }}>{roas(rev, c.spend)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="liquid-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>Top posts</h3>
          <div style={{ display: 'flex', gap: '4px', background: 'var(--fill-tertiary)', padding: '2px', borderRadius: '8px' }}>
            {(['orders', 'reach', 'engagement'] as const).map((k) => (
              <button key={k} onClick={() => setPostSort(k)} style={{ padding: '4px 10px', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 700, textTransform: 'capitalize', background: postSort === k ? 'var(--bg-layer1)' : 'transparent', color: postSort === k ? 'var(--blue)' : 'var(--label-secondary)', cursor: 'pointer' }}>Sort by {k}</button>
            ))}
          </div>
        </div>
        <div className="table-scroll-container">
          <table className="data-table">
            <thead>
              <tr><th>Post</th><th>Platform</th><th>Date</th><th>Reach</th><th>Engagement</th><th>Clicks</th><th>Orders</th></tr>
            </thead>
            <tbody>
              {posts.map((t) => (
                <tr key={t.title}>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                      <img src={productImage(t.product)} alt="" style={{ width: '34px', height: '34px', borderRadius: '6px', objectFit: 'cover', background: 'var(--bg-layer2)' }} />
                      <span style={{ fontWeight: 600 }}>{t.title}</span>
                    </span>
                  </td>
                  <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}><PlatformIcon platform={t.platform} size={11} />{t.platform}</span></td>
                  <td>{t.date}</td>
                  <td>{compact(t.reach)}</td>
                  <td>{t.engagement}%</td>
                  <td>{t.clicks.toLocaleString('en-IN')}</td>
                  <td style={{ fontWeight: 700 }}>{t.orders}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
