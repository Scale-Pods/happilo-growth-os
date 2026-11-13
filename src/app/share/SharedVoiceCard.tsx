import { Phone, MapPin, Building2, Clock, Sparkles, PlayCircle } from 'lucide-react';
import type { Lead } from '@/lib/data/b2bCrm';
import { parseSentiment, categoryLabel, interestLabel, intentLabel, formatWhen } from '@/lib/data/b2bCrm';
import {
  parseVoiceTranscript,
  callOutcome,
  outcomeLabel,
  formatDuration,
  type VapiCallLog,
} from '@/lib/data/vapiCalls';
import { ShareShell } from './ShareShell';

const INTEREST_COLOR: Record<string, string> = {
  positive: '#1E7F4F',
  neutral: '#B7790A',
  negative: '#C23B31',
  not_interested: '#C23B31',
};

const MUTED = 'rgba(60,60,67,0.65)';
const FAINT = 'rgba(60,60,67,0.5)';

const LABEL_STYLE = {
  fontSize: '10.5px',
  color: MUTED,
  textTransform: 'uppercase' as const,
  fontWeight: 700,
  letterSpacing: '0.04em',
  marginBottom: '8px',
};

export default function SharedVoiceCard({
  log,
  lead,
  recordingUrl,
}: {
  log: VapiCallLog;
  lead: Lead | null;
  recordingUrl: string | null;
}) {
  const outcome = callOutcome(log);

  const turnsFromLog = parseVoiceTranscript(log.transcript);
  const turns = turnsFromLog.length > 0 ? turnsFromLog : parseVoiceTranscript(lead?.conversation_transcript_voice);
  const rawTranscript = log.transcript ?? lead?.conversation_transcript_voice ?? null;

  const sentiment = parseSentiment(lead?.voice_sentiment ?? null);
  const sentimentColor = (sentiment.interest && INTEREST_COLOR[sentiment.interest]) || MUTED;

  const startedAt = log.started_at ?? log.created_at ?? lead?.voice_call_at ?? null;
  const title = lead?.company_name ?? log.customer_name ?? 'Phone call';

  return (
    <ShareShell>
      {/* Summary */}
      <div style={{ padding: '18px 22px', borderBottom: '1px solid rgba(60,60,67,0.12)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <div style={{ background: 'rgba(242,167,27,0.16)', color: '#9A6700', padding: '10px', borderRadius: '12px', display: 'flex', flexShrink: 0 }}>
              <Phone size={20} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#00523B' }}>
                Phone call with Aarav
              </div>
              <div style={{ fontSize: '19px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {title}
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              background: outcome === 'connected' ? 'rgba(0,82,59,0.08)' : 'rgba(60,60,67,0.07)',
              border: `1px solid ${outcome === 'connected' ? 'rgba(0,82,59,0.25)' : 'rgba(60,60,67,0.18)'}`,
              color: outcome === 'connected' ? '#00523B' : MUTED,
              padding: '5px 10px',
              borderRadius: '10px',
              fontSize: '11px',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            <Phone size={11} /> {outcome === 'connected' ? 'Picked up' : outcomeLabel(outcome)}
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px', fontSize: '12.5px', color: MUTED }}>
          {lead && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Building2 size={12} /> {categoryLabel(lead.category)}
            </span>
          )}
          {lead && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <MapPin size={12} /> {[lead.city, lead.region].filter(Boolean).join(', ') || 'Location not noted'}
            </span>
          )}
          {(log.customer_phone || lead?.phone) && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Phone size={12} /> {log.customer_phone ?? lead?.phone}
            </span>
          )}
          {startedAt && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Clock size={12} /> {formatWhen(startedAt)}
            </span>
          )}
        </div>

        {sentiment.summary && (
          <p style={{ fontSize: '12.5px', color: MUTED, margin: '10px 0 0', lineHeight: 1.5, fontStyle: 'italic' }}>
            &ldquo;{sentiment.summary}&rdquo;
            {sentiment.intent && <span style={{ color: FAINT }}> · {intentLabel(sentiment.intent)}</span>}
          </p>
        )}

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(60,60,67,0.1)' }}>
          <span style={{ fontSize: '12px', color: MUTED, display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Clock size={12} /> {formatDuration(log.duration_seconds)} talk time
          </span>
          {sentiment.interest && (
            <span style={{ fontSize: '12px', color: sentimentColor, display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 700 }}>
              <Sparkles size={12} /> {interestLabel(sentiment.interest)}
            </span>
          )}
        </div>
      </div>

      {/* Body: the only scrollable area */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '18px 22px', background: '#FAFCFA' }}>
        {recordingUrl && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ ...LABEL_STYLE, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <PlayCircle size={12} /> Recording
            </div>
            <audio controls src={recordingUrl} style={{ width: '100%' }} />
          </div>
        )}

        {!recordingUrl && outcome === 'connected' && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ ...LABEL_STYLE, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <PlayCircle size={12} /> Recording
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#F3F6F2', border: '1px solid rgba(60,60,67,0.12)', borderRadius: '10px', padding: '8px 12px' }}>
              <PlayCircle size={22} style={{ color: '#00523B', flexShrink: 0, opacity: 0.85 }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flex: 1, height: '26px', overflow: 'hidden' }}>
                {Array.from({ length: 48 }, (_, i) => 6 + ((i * 37) % 17) + ((i * 11) % 7)).map((h, i) => (
                  <span key={i} style={{ width: '3px', height: `${h}px`, borderRadius: '2px', background: 'rgba(0,82,59,0.28)', flexShrink: 0 }} />
                ))}
              </div>
              <span style={{ fontSize: '11px', color: MUTED, flexShrink: 0 }}>0:00 / {formatDuration(log.recording_seconds ?? log.duration_seconds)}</span>
            </div>
          </div>
        )}

        {log.summary && (
          <div style={{ marginBottom: '20px' }}>
            <div style={LABEL_STYLE}>Summary</div>
            <p style={{ fontSize: '13.5px', lineHeight: 1.6, color: 'rgba(0,0,0,0.8)', margin: 0 }}>{log.summary}</p>
          </div>
        )}

        {log.next_step && (
          <div style={{ marginBottom: '20px' }}>
            <div style={LABEL_STYLE}>Next step</div>
            <p style={{ fontSize: '13.5px', lineHeight: 1.6, color: '#00523B', fontWeight: 600, margin: 0 }}>{log.next_step}</p>
          </div>
        )}

        <div>
          <div style={LABEL_STYLE}>Conversation{turns.length ? ` · ${turns.length} turns` : ''}</div>
          {turns.length === 0 ? (
            <p style={{ fontSize: '13px', color: FAINT, margin: 0, whiteSpace: 'pre-wrap' }}>
              {rawTranscript ?? 'Nothing was recorded for this call.'}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {turns.map((turn, idx) => {
                const customer = turn.role === 'customer';
                return (
                  <div
                    key={idx}
                    style={{
                      alignSelf: customer ? 'flex-start' : 'flex-end',
                      maxWidth: '82%',
                      background: customer ? '#fff' : '#DCF3E3',
                      border: '1px solid rgba(60,60,67,0.1)',
                      padding: '9px 13px',
                      borderRadius: customer ? '3px 14px 14px 14px' : '14px 3px 14px 14px',
                    }}
                  >
                    <span style={{ fontSize: '10px', color: MUTED, fontWeight: 700, display: 'block', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                      {customer ? (log.customer_name ?? 'Lead') : turn.role === 'system' ? 'Note' : 'Aarav'}
                    </span>
                    <p style={{ fontSize: '13.5px', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{turn.text}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </ShareShell>
  );
}
