'use client';

import React, { useState } from 'react';
import { X, Loader2, Check, Send } from 'lucide-react';
import { demoWebhook } from '@/lib/data/receivables';

type Channel = '' | 'whatsapp' | 'email' | 'voice_call';

const CHANNEL_OPTIONS: Array<{ value: Channel; label: string }> = [
  { value: '', label: 'No follow-up' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'Email' },
  { value: 'voice_call', label: 'Phone Call' },
];

const SEQUENCE_LENGTH = 30;

/** Default follow-up rhythm: courtesy WhatsApp, statement email, then calls once overdue. */
const DEFAULT_CADENCE: Record<number, Channel> = { 1: 'whatsapp', 4: 'email', 8: 'voice_call', 11: 'whatsapp', 15: 'email', 19: 'whatsapp', 22: 'voice_call', 26: 'email', 30: 'voice_call' };
const initialChannels = (): Channel[] => Array.from({ length: SEQUENCE_LENGTH }, (_, i) => DEFAULT_CADENCE[i + 1] ?? '');

/**
 * Follow-up cadence builder for the accounts team. Picks a channel (or none)
 * for each of 30 days after the due date. Saving is simulated locally in this
 * demo; the caller decides who gets to see it.
 */
export default function OutreachSequenceModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [sequenceType, setSequenceType] = useState('30_day');
  const [channels, setChannels] = useState<Channel[]>(initialChannels);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<'success' | 'error' | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const setDay = (dayIndex: number, value: Channel) => {
    const next = [...channels];
    next[dayIndex] = value;
    setChannels(next);
  };

  const allBlank = channels.every((c) => c === '');

  const handleClose = () => {
    if (submitting) return;
    onClose();
    setTimeout(() => {
      setResult(null);
      setErrorMessage('');
    }, 200);
  };

  const handleSend = async () => {
    setSubmitting(true);
    setResult(null);
    setErrorMessage('');
    try {
      const res = await demoWebhook({ sequenceType, channels });
      if (!res.ok) throw new Error('Could not save the cadence. Please try again.');
      setResult('success');
    } catch (err) {
      setResult('error');
      setErrorMessage(err instanceof Error ? err.message : 'Could not save the cadence. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="spotlight-overlay" style={{ display: 'flex' }} onClick={handleClose}>
      <div className="spotlight-panel" style={{ maxWidth: '520px', width: '100%', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
        <div className="spotlight-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px' }}>
          <span style={{ fontWeight: '700', fontSize: '16px' }}>Follow-up Cadence</span>
          <button className="btn-icon" onClick={handleClose} disabled={submitting} title="Close">
            <X size={14} />
          </button>
        </div>

        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--label-secondary)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Cadence
            </label>
            <select
              className="input"
              value={sequenceType}
              onChange={(e) => setSequenceType(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', fontSize: '13px' }}
            >
              <option value="30_day">30-day follow-up after due date</option>
            </select>
          </div>

          {sequenceType === '30_day' && (
            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--label-secondary)', display: 'block', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Channel for each day
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {channels.map((channel, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: '600', width: '56px', flexShrink: 0, color: 'var(--label-secondary)' }}>
                      Day {i + 1}
                    </span>
                    <select
                      className="input"
                      value={channel}
                      onChange={(e) => setDay(i, e.target.value as Channel)}
                      style={{ flex: 1, padding: '7px 10px', fontSize: '12.5px' }}
                    >
                      {CHANNEL_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--separator)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ fontSize: '12.5px', flex: 1, minWidth: '140px' }}>
            {result === 'success' && (
              <span style={{ color: 'var(--green)', display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: '600' }}>
                <Check size={13} /> Cadence saved for all open accounts
              </span>
            )}
            {result === 'error' && <span style={{ color: 'var(--red)', fontWeight: '600' }}>{errorMessage}</span>}
          </div>
          <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
            <button className="btn-secondary" onClick={handleClose} disabled={submitting}>
              Close
            </button>
            <button
              className="btn-primary"
              onClick={handleSend}
              disabled={submitting || allBlank}
              title={allBlank ? 'Pick a channel for at least one day' : undefined}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', opacity: submitting || allBlank ? 0.7 : 1 }}
            >
              {submitting ? (
                <>
                  <Loader2 size={13} className="animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <Send size={13} /> Save Cadence
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
