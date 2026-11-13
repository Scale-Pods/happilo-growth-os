import { MessageSquare, Mail, MapPin, Building2, ArrowDownLeft, ArrowUpRight, Sparkles, Paperclip, FileText, Check, CheckCheck } from 'lucide-react';
import type { Lead, TranscriptEntry } from '@/lib/data/b2bCrm';
import { parseSentiment, categoryLabel, interestLabel, intentLabel, formatWhen } from '@/lib/data/b2bCrm';
import { ShareShell } from './ShareShell';

const INTEREST_COLOR: Record<string, string> = {
  positive: '#1E7F4F',
  neutral: '#B7790A',
  negative: '#C23B31',
  not_interested: '#C23B31',
};

const MUTED = 'rgba(60,60,67,0.65)';
const FAINT = 'rgba(60,60,67,0.5)';

export default function SharedChatCard({
  channel,
  lead,
  entries,
}: {
  channel: 'whatsapp' | 'email';
  lead: Lead;
  entries: TranscriptEntry[];
}) {
  const Icon = channel === 'whatsapp' ? MessageSquare : Mail;
  const accentColor = '#00523B';
  const inboundCount = entries.filter((e) => e.direction === 'inbound').length;
  const outboundCount = entries.filter((e) => e.direction === 'outbound').length;

  const sentimentRaw = channel === 'whatsapp' ? lead.whatsapp_sentiment : lead.email_sentiment;
  const sentiment = parseSentiment(sentimentRaw);
  const sentimentColor = (sentiment.interest && INTEREST_COLOR[sentiment.interest]) || MUTED;

  return (
    <ShareShell>
      {/* Summary */}
      <div style={{ padding: '18px 22px', borderBottom: '1px solid rgba(60,60,67,0.12)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <div style={{ background: 'rgba(0,82,59,0.09)', color: accentColor, padding: '10px', borderRadius: '12px', display: 'flex', flexShrink: 0 }}>
              <Icon size={20} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: accentColor }}>
                {channel === 'whatsapp' ? 'WhatsApp conversation' : 'Email conversation'}
              </div>
              <div style={{ fontSize: '19px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {lead.company_name}
              </div>
            </div>
          </div>

          {sentiment.interest && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                background: `${sentimentColor}14`,
                border: `1px solid ${sentimentColor}40`,
                color: sentimentColor,
                padding: '5px 10px',
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
              title={sentiment.summary ?? undefined}
            >
              <Sparkles size={11} /> {interestLabel(sentiment.interest)}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px', fontSize: '12.5px', color: MUTED }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Building2 size={12} /> {categoryLabel(lead.category)}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <MapPin size={12} /> {[lead.city, lead.region].filter(Boolean).join(', ') || 'Location not noted'}
          </span>
          {lead.whatsapp_number && channel === 'whatsapp' && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <MessageSquare size={12} /> {lead.whatsapp_number}
            </span>
          )}
          {lead.email && channel === 'email' && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Mail size={12} /> {lead.email}
            </span>
          )}
        </div>

        {sentiment.summary && (
          <p style={{ fontSize: '12.5px', color: MUTED, margin: '10px 0 0', lineHeight: 1.5, fontStyle: 'italic' }}>
            &ldquo;{sentiment.summary}&rdquo;
            {sentiment.intent && <span style={{ color: FAINT }}> · {intentLabel(sentiment.intent)}</span>}
          </p>
        )}

        <div style={{ display: 'flex', gap: '16px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(60,60,67,0.1)', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', color: MUTED, display: 'flex', alignItems: 'center', gap: '5px' }}>
            <ArrowDownLeft size={12} /> {inboundCount} received
          </span>
          <span style={{ fontSize: '12px', color: MUTED, display: 'flex', alignItems: 'center', gap: '5px' }}>
            <ArrowUpRight size={12} /> {outboundCount} sent
          </span>
          <span style={{ fontSize: '12px', color: MUTED }}>{entries.length} messages in all</span>
        </div>
      </div>

      {/* Thread: the only scrollable area */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: '18px 22px',
          background: channel === 'whatsapp' ? '#EEF3EE' : '#FAFCFA',
        }}
      >
        {entries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: FAINT, fontSize: '13px' }}>
            No messages in this conversation yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: channel === 'whatsapp' ? '10px' : '14px' }}>
            {entries.map((entry, idx) => {
              const inbound = entry.direction === 'inbound';
              return channel === 'whatsapp' ? (
                <div
                  key={idx}
                  style={{
                    alignSelf: inbound ? 'flex-start' : 'flex-end',
                    maxWidth: '80%',
                    background: inbound ? '#fff' : '#DCF3E3',
                    border: '1px solid rgba(60,60,67,0.1)',
                    padding: '9px 13px',
                    borderRadius: inbound ? '3px 14px 14px 14px' : '14px 3px 14px 14px',
                  }}
                >
                  {entry.attachment && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'rgba(0,82,59,0.06)', border: '1px solid rgba(60,60,67,0.12)', borderRadius: '8px', padding: '6px 9px', marginBottom: '6px' }}>
                      <FileText size={15} style={{ color: '#00523B', flexShrink: 0 }} />
                      <span style={{ fontSize: '12px', fontWeight: 600 }}>{entry.attachment.replace(/^\[[^\]]+\]\s*/, '') || entry.attachment}</span>
                    </div>
                  )}
                  <p style={{ fontSize: '13.5px', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{entry.message}</p>
                  <span style={{ fontSize: '10px', color: FAINT, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', marginTop: '5px' }}>
                    {formatWhen(entry.at)}
                    {!inbound && entry.status === 'read' && <CheckCheck size={12} style={{ color: '#34B7F1' }} />}
                    {!inbound && entry.status === 'delivered' && <CheckCheck size={12} />}
                    {!inbound && entry.status === 'sent' && <Check size={12} />}
                  </span>
                </div>
              ) : (
                <div
                  key={idx}
                  style={{
                    background: '#fff',
                    border: '1px solid rgba(60,60,67,0.1)',
                    padding: '14px 16px',
                    borderRadius: '12px',
                    borderLeft: `3px solid ${inbound ? '#F2A71B' : '#00523B'}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: 700 }}>
                      {entry.from ?? (inbound ? lead.company_name : 'Happilo B2B Team')}
                    </span>
                    <span style={{ fontSize: '10.5px', color: FAINT, flexShrink: 0 }}>{formatWhen(entry.at)}</span>
                  </div>
                  {entry.subject && <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>{entry.subject}</div>}
                  <div style={{ fontSize: '11px', color: MUTED, lineHeight: 1.6, borderBottom: '1px solid rgba(60,60,67,0.1)', paddingBottom: '8px', marginBottom: '10px' }}>
                    {entry.to && <div>To: {entry.to}</div>}
                    {entry.cc && <div>Cc: {entry.cc}</div>}
                  </div>
                  <p style={{ fontSize: '13.5px', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.6, color: 'rgba(0,0,0,0.82)' }}>
                    {entry.message.split('\n').map((line, i) => (
                      <span key={i} style={/^\s{2}\S/.test(line) && /\s{3,}/.test(line.trim()) ? { fontFamily: 'ui-monospace, Menlo, Consolas, monospace', fontSize: '12px' } : undefined}>
                        {line}
                        {'\n'}
                      </span>
                    ))}
                  </p>
                  {entry.attachments && entry.attachments.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                      {entry.attachments.map((a) => (
                        <span key={a} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', border: '1px solid rgba(60,60,67,0.15)', borderRadius: '8px', padding: '4px 8px', background: '#F6F8F6' }}>
                          <Paperclip size={11} style={{ color: '#00523B' }} /> {a}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ShareShell>
  );
}
