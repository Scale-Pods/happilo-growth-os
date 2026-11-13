'use client';

import React, { useState, useMemo } from 'react';
import { useAppContext } from '../ClientWrapper';
import {
  Star,
  CheckCircle,
  AlertTriangle,
  Send,
  Smartphone,
  Clock,
  Package,
  Truck,
  MapPin,
  RefreshCw,
  ChevronRight,
  TrendingUp,
  Bell,
  RotateCcw,
  ArrowUpRight,
  Search,
  Headphones,
  MessageSquare,
  ShieldCheck,
  EyeOff,
  Eye,
} from 'lucide-react';
import { isWithinDateRange } from '@/lib/dateRangeFilter';
import {
  FIRST_RESPONSE_TARGET_MIN,
  SLA_TARGET_HOURS,
  slaLabel,
  slaState,
  type CasePriority,
  type SupportCase,
} from '@/lib/mock/customerCare';

// ─── Static reference data ────────────────────────────────────────────────────

const CHANNELS = ['all', 'website', 'whatsapp', 'instagram', 'amazon', 'flipkart', 'blinkit'];
const CHANNEL_LABEL: Record<string, string> = { all: 'All', website: 'Website', whatsapp: 'WhatsApp', instagram: 'Instagram', amazon: 'Amazon', flipkart: 'Flipkart', blinkit: 'Blinkit' };
const PLATFORMS = ['all', 'Google', 'Amazon', 'Flipkart', 'BigBasket', 'happilo.com'];

const CANNED_REPLIES: { label: string; text: string }[] = [
  { label: 'Ask for photos', text: 'Sorry about this. Could you share a clear photo of the pack (front, back and the batch number near the seal)? We will sort it out as soon as we have it.' },
  { label: 'Replacement approved', text: 'We have approved a replacement and it will be dispatched within 24 hours. You will get the tracking details on WhatsApp.' },
  { label: 'Refund initiated', text: 'Your refund has been initiated. UPI and cards usually take 2-3 working days, net banking up to 5.' },
  { label: 'Checking with courier', text: 'I have raised this with the courier and asked for a confirmed update. I will message you here as soon as they reply.' },
];

interface Scan { stage: string; where: string; time: string }
interface Order {
  id: string;
  customer: string;
  city: string;
  items: string;
  amount: number;
  carrier: string;
  awb: string;
  payment: string;
  scans: Scan[];
  pending: string[];
}

const ORDERS: Order[] = [
  {
    id: 'HP-48210', customer: 'Meera Sen', city: 'Kolkata', items: 'Premium Whole Cashew Nuts 200g x 2', amount: 672, carrier: 'Delhivery', awb: '39174620182271', payment: 'UPI',
    scans: [
      { stage: 'Order placed', where: 'happilo.com', time: '10 Nov, 09:48 pm' },
      { stage: 'Payment confirmed', where: 'UPI', time: '10 Nov, 09:49 pm' },
      { stage: 'Packed', where: 'Bengaluru warehouse', time: '11 Nov, 11:05 am' },
      { stage: 'Handed to carrier', where: 'Delhivery, Bengaluru hub', time: '11 Nov, 05:40 pm' },
      { stage: 'In transit', where: 'Kolkata Dankuni hub', time: '12 Nov, 06:12 am' },
      { stage: 'Out for delivery', where: 'Kolkata, Ballygunge', time: '12 Nov, 09:30 am' },
      { stage: 'Marked delivered', where: 'Kolkata, Ballygunge', time: '12 Nov, 11:20 am (no OTP)' },
    ],
    pending: [],
  },
  {
    id: 'HP-48093', customer: 'Vikram Chauhan', city: 'Delhi', items: 'Dry Fruits Combo 850g x 1', amount: 1114, carrier: 'Blue Dart', awb: '71829046113', payment: 'Credit card',
    scans: [
      { stage: 'Order placed', where: 'happilo.com', time: '11 Nov, 02:14 pm' },
      { stage: 'Payment confirmed', where: 'Credit card', time: '11 Nov, 02:15 pm' },
      { stage: 'Packed', where: 'Bengaluru warehouse', time: '12 Nov, 04:20 pm' },
      { stage: 'Handed to carrier', where: 'Blue Dart, Bengaluru', time: '13 Nov, 10:50 am' },
      { stage: 'In transit', where: 'Blue Dart, Delhi gateway', time: '13 Nov, 08:05 pm' },
    ],
    pending: ['Out for delivery', 'Delivered'],
  },
  {
    id: 'HP-48230', customer: 'Rekha Bose', city: 'Kolkata', items: 'Dried Californian Whole Cranberries 200g x 1', amount: 234, carrier: 'Xpressbees', awb: '14098263371095', payment: 'COD',
    scans: [
      { stage: 'Order placed', where: 'happilo.com', time: '11 Nov, 07:30 pm' },
      { stage: 'Packed', where: 'Bengaluru warehouse', time: '12 Nov, 12:10 pm' },
      { stage: 'Handed to carrier', where: 'Xpressbees, Bengaluru', time: '12 Nov, 06:25 pm' },
      { stage: 'In transit', where: 'Kolkata sort centre', time: '13 Nov, 05:50 am' },
      { stage: 'Out for delivery', where: 'Kolkata, Behala', time: '13 Nov, 10:15 am' },
    ],
    pending: ['Delivered'],
  },
  {
    id: 'HP-48196', customer: 'Rohan Sharma', city: 'Pune', items: 'Premium Nutritious Nutty Trail Mix 200g x 2', amount: 578, carrier: 'Shadowfax', awb: 'SFX9140337821', payment: 'UPI',
    scans: [
      { stage: 'Order placed', where: 'happilo.com', time: '7 Nov, 08:12 pm' },
      { stage: 'Payment confirmed', where: 'UPI', time: '7 Nov, 08:12 pm' },
      { stage: 'Packed', where: 'Bengaluru warehouse', time: '8 Nov, 10:40 am' },
      { stage: 'Handed to carrier', where: 'Shadowfax, Bengaluru', time: '8 Nov, 04:15 pm' },
      { stage: 'In transit', where: 'Pune Hinjewadi hub', time: '10 Nov, 07:00 am' },
      { stage: 'Out for delivery', where: 'Pune, Kothrud', time: '10 Nov, 11:35 am' },
      { stage: 'Delivered', where: 'Pune, Kothrud', time: '10 Nov, 02:05 pm' },
    ],
    pending: [],
  },
  {
    id: 'HP-48221', customer: 'Aarti Kapoor', city: 'Chandigarh', items: 'Premium Californian Almonds 200g x 1', amount: 299, carrier: 'Delhivery', awb: '39174620255318', payment: 'COD',
    scans: [
      { stage: 'Order placed', where: 'happilo.com', time: '9 Nov, 06:55 pm' },
      { stage: 'Packed', where: 'Bengaluru warehouse', time: '10 Nov, 11:20 am' },
      { stage: 'Handed to carrier', where: 'Delhivery, Bengaluru hub', time: '10 Nov, 05:10 pm' },
      { stage: 'In transit', where: 'Chandigarh Mohali hub', time: '12 Nov, 08:40 am' },
      { stage: 'Out for delivery', where: 'Chandigarh, Sector 34', time: '12 Nov, 12:05 pm' },
      { stage: 'Delivered', where: 'Chandigarh, Sector 34', time: '12 Nov, 03:30 pm' },
    ],
    pending: [],
  },
  {
    id: 'HP-48203', customer: 'Shalini Deshmukh', city: 'Mumbai', items: 'Jumbo Californian Almonds 400g x 1', amount: 476, carrier: 'Delhivery', awb: '39174620201845', payment: 'Credit card',
    scans: [
      { stage: 'Order placed', where: 'happilo.com', time: '8 Nov, 01:20 pm' },
      { stage: 'Payment confirmed', where: 'Credit card', time: '8 Nov, 01:21 pm' },
      { stage: 'Packed', where: 'Bengaluru warehouse', time: '9 Nov, 10:05 am' },
      { stage: 'Handed to carrier', where: 'Delhivery, Bengaluru hub', time: '9 Nov, 04:50 pm' },
      { stage: 'In transit', where: 'Mumbai Bhiwandi hub', time: '11 Nov, 06:30 am' },
      { stage: 'Out for delivery', where: 'Mumbai, Andheri West', time: '11 Nov, 10:45 am' },
      { stage: 'Delivered', where: 'Mumbai, Andheri West', time: '11 Nov, 01:15 pm' },
    ],
    pending: [],
  },
];

function stageMessage(o: Order, stage: string, last?: Scan): string {
  const first = o.customer.split(' ')[0];
  const track = `happilo.com/track/${o.awb}`;
  switch (stage) {
    case 'Order placed': return `Hi ${first}, thank you for shopping with Happilo. Your order ${o.id} (${o.items}, Rs ${o.amount}) is confirmed. We will message you once it is shipped.`;
    case 'Payment confirmed': return `Hi ${first}, we have received your ${o.payment} payment of Rs ${o.amount} for order ${o.id}. Your order is being packed.`;
    case 'Packed': return `Hi ${first}, your order ${o.id} has been packed at our Bengaluru warehouse and will go to ${o.carrier} shortly.`;
    case 'Handed to carrier': return `Hi ${first}, your order ${o.id} has been handed to ${o.carrier}. AWB: ${o.awb}. Track here: ${track}`;
    case 'In transit': return `Hi ${first}, your order ${o.id} has reached ${last?.where ?? o.city} and is on the way to you. Track: ${track}`;
    case 'Out for delivery': return `Hi ${first}, your Happilo order ${o.id} is out for delivery today. The ${o.carrier} executive will call you before arriving. Please keep your phone handy.${o.payment === 'COD' ? ` Please keep Rs ${o.amount} ready for COD.` : ''}`;
    case 'Delivered': return `Hi ${first}, your order ${o.id} has been delivered. We hope you enjoy it. If anything is off with the pack, just reply to this message and we will fix it.`;
    default: return `Hi ${first}, an update on order ${o.id}.`;
  }
}

interface Shipment { carrier: string; awb: string; order: string; city: string; status: 'In transit' | 'Out for delivery' | 'Delivered' | 'Exception' | 'Delayed'; location: string; updated: string; eta: string }
const SHIPMENTS: Shipment[] = [
  { carrier: 'Blue Dart', awb: '71829046113', order: 'HP-48093', city: 'Delhi', status: 'In transit', location: 'Delhi gateway', updated: '35 min ago', eta: '15 Nov' },
  { carrier: 'Xpressbees', awb: '14098263371095', order: 'HP-48230', city: 'Kolkata', status: 'Out for delivery', location: 'Behala, Kolkata', updated: '18 min ago', eta: 'Today by 7 pm (pincode being corrected)' },
  { carrier: 'Ecom Express', awb: '2287450193661', order: 'OD336205513908', city: 'Ahmedabad', status: 'Delayed', location: 'Ahmedabad Naroda hub', updated: '3 h ago', eta: 'Tomorrow (3 failed attempts logged)' },
  { carrier: 'Delhivery', awb: '39174620182271', order: 'HP-48210', city: 'Kolkata', status: 'Exception', location: 'Ballygunge, Kolkata', updated: '1 day ago', eta: 'Delivered without OTP - claim raised' },
  { carrier: 'Shadowfax', awb: 'SFX9140337821', order: 'HP-48196', city: 'Pune', status: 'Delivered', location: 'Kothrud, Pune', updated: '3 days ago', eta: 'Completed' },
  { carrier: 'Delhivery', awb: '39174620255318', order: 'HP-48221', city: 'Chandigarh', status: 'Delivered', location: 'Sector 34, Chandigarh', updated: '1 day ago', eta: 'Completed' },
  { carrier: 'Delhivery', awb: '39174620311406', order: 'HP-48236', city: 'Bengaluru', status: 'Out for delivery', location: 'Koramangala, Bengaluru', updated: '9 min ago', eta: 'Today by 6 pm' },
  { carrier: 'Blue Dart', awb: '71829046290', order: 'HP-48241', city: 'Hyderabad', status: 'In transit', location: 'Hyderabad Shamshabad', updated: '1 h ago', eta: '14 Nov' },
];

const CARRIER_PERF: [string, number][] = [['Blue Dart', 96.1], ['Delhivery', 93.4], ['Shadowfax', 91.2], ['Ecom Express', 89.7], ['Xpressbees', 86.3]];

const PRIORITY_COLOR: Record<string, string> = { Urgent: 'badge-red', High: 'badge-orange', Normal: 'badge-blue', Low: 'badge-grey' };
const SLA_COLOR: Record<string, string> = { Breached: 'badge-red', 'At risk': 'badge-orange', 'On track': 'badge-green', Met: 'badge-green' };

const labelStyle: React.CSSProperties = { fontSize: '10px', fontWeight: 600, color: 'var(--label-secondary)', display: 'block', marginBottom: '3px' };

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

// ─── Component ────────────────────────────────────────────────────────────────

type Tab = 'inbox' | 'orders' | 'carriers' | 'reviews' | 'sla';

export default function CustomerCarePage() {
  const { supportCases, setSupportCases, reviews, setReviews, showToast, dateRange } = useAppContext();

  const [activeTab, setActiveTab] = useState<Tab>('inbox');
  const [selectedChannel, setSelectedChannel] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [activeCaseId, setActiveCaseId] = useState('case-1');
  const [replyInput, setReplyInput] = useState('');

  const [activeOrderId, setActiveOrderId] = useState('HP-48210');
  const [orderSearch, setOrderSearch] = useState('');
  const [previewStage, setPreviewStage] = useState('Marked delivered');
  const [pulling, setPulling] = useState(false);

  const [platformFilter, setPlatformFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [reviewView, setReviewView] = useState<'needs-reply' | 'all'>('all');
  const [followDateFilter, setFollowDateFilter] = useState(false);
  const [replyOpenId, setReplyOpenId] = useState<string | null>(null);
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, string>>({});

  const [simRating, setSimRating] = useState(0);
  const [simName, setSimName] = useState('Nisha Gupta');
  const [simText, setSimText] = useState('');
  const [simCaseId, setSimCaseId] = useState<string | null>(null);

  // ── Derived ────────────────────────────────────────────────────────────────
  const orderedCases = useMemo(() => {
    const rank = (c: SupportCase) => (c.status === 'Open' ? 0 : c.status === 'Pending' ? 1 : 2);
    const sla = (c: SupportCase) => (slaState(c) === 'Breached' ? 0 : slaState(c) === 'At risk' ? 1 : 2);
    return [...supportCases].sort((a, b) => rank(a) - rank(b) || (rank(a) < 2 ? sla(a) - sla(b) : 0) || (a.ageMin ?? 0) - (b.ageMin ?? 0));
  }, [supportCases]);

  const filteredCases = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orderedCases.filter(c => {
      if (selectedChannel !== 'all' && c.channel !== selectedChannel) return false;
      if (statusFilter !== 'all' && c.status.toLowerCase() !== statusFilter) return false;
      if (!q) return true;
      return [c.customer, c.msg, c.orderId, c.product, c.city, ...(c.tags || [])].filter(Boolean).join(' ').toLowerCase().includes(q);
    });
  }, [orderedCases, selectedChannel, statusFilter, search]);

  const activeCase = supportCases.find(c => c.id === activeCaseId) || filteredCases[0] || supportCases[0];

  const stats = useMemo(() => {
    const active = supportCases.filter(c => c.status !== 'Resolved');
    const resolved = supportCases.filter(c => c.status === 'Resolved');
    const csats = resolved.map(c => c.csat).filter((x): x is number => typeof x === 'number');
    const frs = supportCases.map(c => c.firstResponseMin).filter((x): x is number => typeof x === 'number');
    const breachedOpen = active.filter(c => slaState(c) === 'Breached').length;
    const atRisk = active.filter(c => slaState(c) === 'At risk').length;
    const resolvedMet = resolved.filter(c => slaState(c) === 'Met').length;
    return {
      active: active.length,
      resolved: resolved.length,
      csat: avg(csats),
      csatCount: csats.length,
      csatResponses: csats,
      firstResponse: avg(frs),
      frWithin: frs.length ? Math.round((frs.filter(x => x <= FIRST_RESPONSE_TARGET_MIN).length / frs.length) * 100) : 0,
      breachedOpen,
      atRisk,
      resolveWithin: resolved.length ? Math.round((resolvedMet / resolved.length) * 100) : 0,
      avgResolveHrs: avg(resolved.map(c => (c.resolutionMin ?? 0) / 60)),
    };
  }, [supportCases]);

  const periodReviews = useMemo(() => (followDateFilter ? reviews.filter(r => isWithinDateRange(r.date, dateRange)) : reviews), [reviews, followDateFilter, dateRange]);
  const shownReviews = useMemo(() => periodReviews.filter(r => {
    if (platformFilter !== 'all' && r.platform !== platformFilter) return false;
    if (ratingFilter === 'low' && r.rating > 3) return false;
    if (ratingFilter === 'high' && r.rating < 4) return false;
    if (reviewView === 'needs-reply' && r.reply) return false;
    return true;
  }), [periodReviews, platformFilter, ratingFilter, reviewView]);

  const avgRating = avg(periodReviews.map(r => r.rating));
  const dist = [5, 4, 3, 2, 1].map(n => ({ n, count: periodReviews.filter(r => r.rating === n).length }));
  const lowReviews = periodReviews.filter(r => r.rating <= 3);
  const needReply = periodReviews.filter(r => !r.reply).length;
  const pendingApproval = reviews.filter(r => r.platform === 'happilo.com' && r.approved === false).length;
  const lowFollowedUp = lowReviews.filter(r => r.reply || r.intercepted).length;

  const tagCounts = useMemo(() => {
    const m: Record<string, number> = {};
    supportCases.forEach(c => (c.tags || []).forEach(t => { m[t] = (m[t] || 0) + 1; }));
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [supportCases]);

  const orderMatches = ORDERS.filter(o => !orderSearch.trim() || `${o.id} ${o.customer} ${o.awb}`.toLowerCase().includes(orderSearch.trim().toLowerCase()));
  const activeOrder = ORDERS.find(o => o.id === activeOrderId) || ORDERS[0];
  const orderStages = [...activeOrder.scans.map(s => ({ ...s, done: true })), ...activeOrder.pending.map(p => ({ stage: p, where: '', time: 'Pending', done: false }))];
  const previewText = stageMessage(activeOrder, previewStage, activeOrder.scans.find(s => s.stage === previewStage));

  // ── Actions ────────────────────────────────────────────────────────────────
  const patchCase = (id: string, fn: (c: SupportCase) => SupportCase) => setSupportCases(prev => prev.map(c => (c.id === id ? fn(c) : c)));

  const handleSendReply = () => {
    const text = replyInput.trim();
    if (!text || !activeCase) return;
    patchCase(activeCase.id, c => ({
      ...c,
      status: c.status === 'Resolved' ? 'Open' : 'Pending',
      time: 'Just now',
      thread: [...c.thread, { sender: 'agent', msg: text, time: 'Just now', by: 'You' }],
      firstResponseMin: c.firstResponseMin ?? Math.round(c.ageMin ?? 0),
    }));
    setReplyInput('');
    showToast(`Reply sent to ${activeCase.customer} on ${CHANNEL_LABEL[activeCase.channel] || activeCase.channel}.`, 'success');
  };

  const handleCaseAction = (kind: 'refund' | 'replace') => {
    if (!activeCase) return;
    const note = kind === 'refund' ? 'Refund initiated for this order. Customer told to expect it in 2-3 working days.' : 'Replacement approved and queued for dispatch from the Bengaluru warehouse.';
    patchCase(activeCase.id, c => ({
      ...c,
      escalation: kind === 'refund' ? 'Refund Requested' : 'Replacement Request',
      thread: [...c.thread, { sender: 'note', msg: note, time: 'Just now', by: 'You' }],
    }));
    showToast(kind === 'refund' ? 'Refund initiated.' : 'Replacement queued.', 'success');
  };

  const handleEscalate = () => {
    if (!activeCase) return;
    patchCase(activeCase.id, c => ({
      ...c,
      escalation: 'Escalated - CS Manager',
      priority: c.priority === 'Urgent' ? 'Urgent' : 'High',
      thread: [...c.thread, { sender: 'note', msg: 'Escalated to the care manager.', time: 'Just now', by: 'You' }],
    }));
    showToast('Case escalated to the care manager.', 'info');
  };

  const handleResolve = () => {
    if (!activeCase) return;
    const closing = activeCase.status !== 'Resolved';
    patchCase(activeCase.id, c => closing
      ? { ...c, status: 'Resolved', escalation: 'None', resolutionMin: c.ageMin ?? 0, time: 'Just now' }
      : { ...c, status: 'Open', resolutionMin: undefined });
    showToast(closing ? 'Case marked resolved.' : 'Case reopened.', 'success');
  };

  const handleSendUpdate = () => {
    showToast(`WhatsApp message sent to ${activeOrder.customer}: "${previewStage}".`, 'success');
  };

  const handlePullTracking = () => {
    setPulling(true);
    setTimeout(() => {
      setPulling(false);
      showToast('Carrier statuses refreshed. 2 shipments need attention.', 'success');
    }, 1200);
  };

  const suggestReply = (r: { customer: string; rating: number; product?: string }) => {
    const first = r.customer.split(' ')[0];
    const p = r.product || 'your order';
    if (r.rating >= 4) return `Thank you ${first}, really glad you liked ${p}. Your feedback means a lot to the team.`;
    return `Hi ${first}, we are sorry that ${p} did not meet your expectations. Our care team will get in touch with you today to make it right. You can also write to care@happilo.com or call +91 88844 84000.`;
  };

  const postReviewReply = (id: string) => {
    const text = (reviewDrafts[id] || '').trim();
    if (!text) return;
    setReviews(prev => prev.map(r => (r.id === id ? { ...r, reply: text } : r)));
    setReplyOpenId(null);
    setReviewDrafts(d => ({ ...d, [id]: '' }));
    showToast('Reply posted.', 'success');
  };

  const nextCaseNumber = () => supportCases.reduce((m, c) => Math.max(m, parseInt(c.id.replace('case-', ''), 10) || 0), 0) + 1;

  const openCaseFromReview = (id: string) => {
    const r = reviews.find(x => x.id === id);
    if (!r) return;
    const n = nextCaseNumber();
    const msg = `[${r.platform} review, ${r.rating} star] ${r.text}`;
    const newCase: SupportCase = {
      id: `case-${n}`, customer: r.customer, channel: r.platform === 'Amazon' ? 'amazon' : r.platform === 'Flipkart' ? 'flipkart' : 'website',
      msg, status: 'Open', escalation: 'None', time: 'Just now', priority: 'High', product: r.product, tags: ['Review follow-up'], assignee: 'Kavya', ageMin: 0,
      thread: [
        { sender: 'customer', msg: r.text, time: 'Just now' },
        { sender: 'note', msg: `Opened from a ${r.rating} star review on ${r.platform}. Reach out privately and offer a fix.`, time: 'Just now' },
      ],
    };
    setSupportCases(prev => [newCase, ...prev]);
    setReviews(prev => prev.map(x => (x.id === id ? { ...x, intercepted: true } : x)));
    setActiveCaseId(newCase.id);
    showToast(`Care case opened for ${r.customer}.`, 'success');
  };

  const setApproval = (id: string, approved: boolean) => {
    setReviews(prev => prev.map(r => (r.id === id ? { ...r, approved } : r)));
    showToast(approved ? 'Review approved and visible on the product page.' : 'Review hidden from the product page.', approved ? 'success' : 'info');
  };

  const handleSurveySubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (simRating === 0) return;
    if (simRating >= 4) {
      setReviews(prev => [{
        id: `rev-${prev.length + 1}-${Date.now() % 10000}`, customer: simName || 'Customer', rating: simRating, platform: 'happilo.com',
        text: simText || 'Good quality, will order again.', date: new Date().toISOString().split('T')[0], sentiment: 'positive', reply: null, verified: true, approved: false,
      }, ...prev]);
      showToast(`${simRating} star review received. It is waiting for approval.`, 'success');
      setSimRating(0); setSimText(''); setSimCaseId(null);
    } else {
      const n = nextCaseNumber();
      const text = simText || 'Not happy with the order.';
      const newCase: SupportCase = {
        id: `case-${n}`, customer: simName || 'Customer', channel: 'whatsapp', msg: text, status: 'Open', escalation: 'Low rating follow-up', time: 'Just now',
        priority: 'High', tags: ['Low rating'], assignee: 'Kavya', ageMin: 0,
        thread: [
          { sender: 'customer', msg: `Rated ${simRating}/5. ${text}`, time: 'Just now' },
          { sender: 'agent', msg: `Hi ${(simName || 'there').split(' ')[0]}, we are sorry about your experience. A member of our care team will call you within 2 hours to sort this out.`, time: 'Just now', by: 'Care team' },
        ],
      };
      setSupportCases(prev => [newCase, ...prev]);
      setSimCaseId(newCase.id);
      showToast(`${simRating} star rating held back. Care case ${newCase.id.replace('case-', '#')} opened.`, 'error');
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  const tabs: [Tab, string, React.ComponentType<{ size?: number }>][] = [
    ['inbox', 'Support Inbox', Headphones], ['orders', 'Order Timeline', Package], ['carriers', 'Carrier Tracking', Truck], ['reviews', 'Reviews', Star], ['sla', 'SLA & CSAT', TrendingUp],
  ];

  return (
    <div style={{ animation: 'fadeIn 300ms ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--label-primary)', margin: 0 }}>Customer Care and Reviews</h2>
          <p style={{ fontSize: '13px', color: 'var(--label-secondary)', marginTop: '4px', marginBottom: 0 }}>
            Customer queries from the website, WhatsApp, Instagram and marketplaces, order tracking, and product reviews in one place.
          </p>
        </div>
        <button className="btn-secondary" onClick={() => showToast('Inbox refreshed. No new messages.', 'info')}>
          <RefreshCw size={14} /> Refresh inbox
        </button>
      </div>

      <div className="metrics-grid mb-24">
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--green)' } as React.CSSProperties}>
          <span className="label">CSAT</span>
          <span className="value">{stats.csat.toFixed(1)} <span style={{ fontSize: '13px', color: 'var(--label-secondary)' }}>/ 5</span></span>
          <span className="trend up"><CheckCircle size={12} /> {stats.csatCount} survey replies</span>
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--blue)' } as React.CSSProperties}>
          <span className="label">Average Rating</span>
          <span className="value">{avgRating.toFixed(2)} <span style={{ fontSize: '13px', color: 'var(--label-secondary)' }}>from {periodReviews.length}</span></span>
          <span className="trend up"><Star size={12} /> Google, Amazon, Flipkart, BigBasket</span>
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--orange)' } as React.CSSProperties}>
          <span className="label">Open Cases</span>
          <span className="value">{stats.active} <span style={{ fontSize: '13px', color: 'var(--label-secondary)' }}>cases</span></span>
          <span className="trend down" style={{ color: stats.breachedOpen > 0 ? 'var(--red)' : 'var(--orange)' }}><Bell size={12} /> {stats.breachedOpen} past SLA, {stats.atRisk} at risk</span>
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--teal)' } as React.CSSProperties}>
          <span className="label">First Response</span>
          <span className="value">{stats.firstResponse.toFixed(0)} <span style={{ fontSize: '13px', color: 'var(--label-secondary)' }}>min avg</span></span>
          <span className="trend up"><Clock size={12} /> {stats.frWithin}% within {FIRST_RESPONSE_TARGET_MIN} min</span>
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--red)' } as React.CSSProperties}>
          <span className="label">Low Ratings (1-3 star)</span>
          <span className="value">{lowReviews.length} <span style={{ fontSize: '13px', color: 'var(--label-secondary)' }}>reviews</span></span>
          <span className="trend down" style={{ color: 'var(--red)' }}><AlertTriangle size={12} /> {lowReviews.length - lowFollowedUp} not followed up</span>
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--purple)' } as React.CSSProperties}>
          <span className="label">Resolved Within SLA</span>
          <span className="value">{stats.resolveWithin}<span style={{ fontSize: '13px', color: 'var(--label-secondary)' }}>%</span></span>
          <span className="trend up"><ShieldCheck size={12} /> {stats.resolved} cases closed</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', background: 'var(--fill-tertiary)', padding: '3px', borderRadius: '10px', width: 'fit-content', maxWidth: '100%', flexWrap: 'wrap' }}>
        {tabs.map(([key, label, Icon]) => (
          <button key={key} onClick={() => setActiveTab(key)} style={{ padding: '6px 14px', borderRadius: '7px', border: 'none', fontSize: '12px', fontWeight: 700, background: activeTab === key ? 'var(--bg-layer1)' : 'transparent', color: activeTab === key ? 'var(--blue)' : 'var(--label-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Icon size={13} />{label}
          </button>
        ))}
      </div>

      {/* ── SUPPORT INBOX ───────────────────────────────────────────────────── */}
      {activeTab === 'inbox' && (
        <div className="liquid-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ position: 'relative', minWidth: '220px', flex: '1 1 220px', maxWidth: '320px' }}>
              <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--label-tertiary)' }} />
              <input className="input" placeholder="Search name, order ID, product, tag" value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '7px 10px 7px 30px', fontSize: '12px' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', background: 'var(--fill-tertiary)', padding: '2px', borderRadius: '8px', flexWrap: 'wrap' }}>
                {CHANNELS.map(ch => (
                  <button key={ch} onClick={() => setSelectedChannel(ch)} style={{ padding: '4px 10px', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 700, background: selectedChannel === ch ? 'var(--bg-layer1)' : 'transparent', color: selectedChannel === ch ? 'var(--blue)' : 'var(--label-secondary)', cursor: 'pointer' }}>{CHANNEL_LABEL[ch]}</button>
                ))}
              </div>
              <select className="input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ fontSize: '11px', padding: '5px 8px' }}>
                <option value="all">All status</option>
                <option value="open">Open</option>
                <option value="pending">Waiting on customer</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>

          <div className="console-body" style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '16px' }}>
            <div style={{ borderRight: '1px solid var(--separator)', paddingRight: '12px', maxHeight: '600px', overflowY: 'auto' }}>
              {filteredCases.length === 0 && <p style={{ fontSize: '12px', color: 'var(--label-secondary)', padding: '12px 4px' }}>No cases match these filters.</p>}
              {filteredCases.map(c => {
                const st = slaState(c);
                return (
                  <div key={c.id} onClick={() => setActiveCaseId(c.id)} style={{ padding: '10px', borderRadius: '8px', background: activeCase?.id === c.id ? 'var(--fill-tertiary)' : 'transparent', marginBottom: '6px', cursor: 'pointer', borderLeft: st === 'Breached' && c.status !== 'Resolved' ? '3px solid var(--red)' : c.escalation !== 'None' ? '3px solid var(--orange)' : '3px solid transparent' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '2px', gap: '6px' }}>
                      <span style={{ fontWeight: 700 }}>{c.customer}</span>
                      <span className={`badge badge-${c.status === 'Resolved' ? 'green' : c.status === 'Pending' ? 'grey' : 'orange'}`} style={{ fontSize: '9px' }}>{c.status === 'Pending' ? 'Waiting' : c.status}</span>
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--label-secondary)', marginBottom: '3px' }}>{CHANNEL_LABEL[c.channel] || c.channel} · {c.time}{c.orderId ? ` · ${c.orderId}` : ''}</div>
                    <div style={{ fontSize: '11px', color: 'var(--label-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.msg}</div>
                    <div style={{ display: 'flex', gap: '4px', marginTop: '5px', flexWrap: 'wrap' }}>
                      {c.priority && <span className={`badge ${PRIORITY_COLOR[c.priority]}`} style={{ fontSize: '8px' }}>{c.priority}</span>}
                      {c.status !== 'Resolved' && (st === 'Breached' || st === 'At risk') && <span className={`badge ${SLA_COLOR[st]}`} style={{ fontSize: '8px' }}>{slaLabel(c)}</span>}
                      {c.escalation !== 'None' && <span className="badge badge-grey" style={{ fontSize: '8px' }}>{c.escalation}</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {activeCase && (
              <div style={{ display: 'flex', flexDirection: 'column', minHeight: '520px', minWidth: 0 }}>
                <div style={{ borderBottom: '1px solid var(--separator)', paddingBottom: '10px', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '15px' }}>{activeCase.customer}{activeCase.city ? <span style={{ fontWeight: 500, fontSize: '12px', color: 'var(--label-secondary)' }}> · {activeCase.city}</span> : null}</div>
                      <div style={{ fontSize: '11px', color: 'var(--label-secondary)', marginTop: '2px' }}>
                        {CHANNEL_LABEL[activeCase.channel] || activeCase.channel}
                        {activeCase.orderId ? ` · Order ${activeCase.orderId}` : ''}
                        {activeCase.product ? ` · ${activeCase.product}` : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => handleCaseAction('refund')}><RotateCcw size={11} /> Refund</button>
                      <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => handleCaseAction('replace')}><Package size={11} /> Replace</button>
                      {activeCase.status !== 'Resolved' && (
                        <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px', color: 'var(--orange)' }} onClick={handleEscalate}><ArrowUpRight size={11} /> Escalate</button>
                      )}
                      <button className="btn-primary" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={handleResolve}>{activeCase.status === 'Resolved' ? 'Reopen' : 'Resolve'}</button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {activeCase.priority && <span className={`badge ${PRIORITY_COLOR[activeCase.priority]}`} style={{ fontSize: '9px' }}>{activeCase.priority} priority</span>}
                    <span className={`badge ${SLA_COLOR[slaState(activeCase)]}`} style={{ fontSize: '9px' }}>SLA: {slaLabel(activeCase)}</span>
                    {activeCase.assignee && <span className="badge badge-grey" style={{ fontSize: '9px' }}>Assigned to {activeCase.assignee}</span>}
                    {activeCase.escalation !== 'None' && <span className="badge badge-orange" style={{ fontSize: '9px' }}>{activeCase.escalation}</span>}
                    {(activeCase.tags || []).map(t => <span key={t} className="badge badge-blue" style={{ fontSize: '9px' }}>{t}</span>)}
                  </div>
                </div>

                <div style={{ flexGrow: 1, overflowY: 'auto', maxHeight: '380px', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px', marginBottom: '10px' }}>
                  {activeCase.thread.map((m, idx) => {
                    const isCustomer = m.sender === 'customer';
                    const isNote = m.sender === 'note';
                    const mine = m.sender === 'agent' || m.sender === 'founder-user';
                    return (
                      <div key={idx} style={{ alignSelf: isNote ? 'center' : mine ? 'flex-end' : 'flex-start', background: isNote ? 'rgba(242,167,27,0.12)' : mine ? 'rgba(0,82,59,0.10)' : m.sender === 'ai' ? 'var(--fill-secondary)' : 'var(--fill-tertiary)', color: 'var(--label-primary)', padding: '9px 13px', borderRadius: '12px', maxWidth: isNote ? '92%' : '82%', fontSize: '12.5px', lineHeight: 1.45 }}>
                        <div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--label-secondary)', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          {isCustomer ? activeCase.customer.split(' ')[0] : isNote ? `Internal note${m.by ? ` · ${m.by}` : ''}` : m.sender === 'ai' ? 'Auto-reply' : (m.by || 'Care team')}
                        </div>
                        <p style={{ margin: 0, whiteSpace: 'pre-line' }}>{m.msg}</p>
                        <span style={{ fontSize: '9px', color: 'var(--label-secondary)', display: 'block', textAlign: 'right', marginTop: '4px' }}>{m.time}</span>
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  {CANNED_REPLIES.map(r => (
                    <button key={r.label} className="btn-secondary" style={{ fontSize: '10px', padding: '3px 8px' }} onClick={() => setReplyInput(r.text)}>{r.label}</button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="text" className="input" placeholder={`Reply to ${activeCase.customer.split(' ')[0]} on ${CHANNEL_LABEL[activeCase.channel] || activeCase.channel}`} value={replyInput} onChange={e => setReplyInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleSendReply(); }} style={{ flexGrow: 1, padding: '8px 12px', fontSize: '13px' }} />
                  <button className="btn-primary" onClick={handleSendReply} aria-label="Send reply"><Send size={14} /></button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ORDER TIMELINE ──────────────────────────────────────────────────── */}
      {activeTab === 'orders' && (
        <div className="split-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: '20px', alignItems: 'start' }}>
          <div className="liquid-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 4px' }}>Order timeline</h3>
            <p style={{ fontSize: '12px', color: 'var(--label-secondary)', margin: '0 0 14px' }}>Pick an order to see every scan. Click a step to preview the WhatsApp update sent to the customer.</p>
            <input className="input" placeholder="Search order ID, name or AWB" value={orderSearch} onChange={e => setOrderSearch(e.target.value)} style={{ width: '100%', fontSize: '12px', padding: '7px 10px', marginBottom: '10px' }} />
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
              {orderMatches.map(o => (
                <button key={o.id} onClick={() => { setActiveOrderId(o.id); setPreviewStage(o.scans[o.scans.length - 1].stage); }} className={activeOrder.id === o.id ? 'btn-primary' : 'btn-secondary'} style={{ fontSize: '11px', padding: '4px 10px' }}>{o.id}</button>
              ))}
              {orderMatches.length === 0 && <span style={{ fontSize: '12px', color: 'var(--label-secondary)' }}>No matching order.</span>}
            </div>

            <div style={{ background: 'var(--fill-quaternary)', borderRadius: '10px', padding: '12px 14px', marginBottom: '18px', fontSize: '12px', lineHeight: 1.6 }}>
              <div><strong>{activeOrder.customer}</strong>, {activeOrder.city}</div>
              <div style={{ color: 'var(--label-secondary)' }}>{activeOrder.items} · Rs {activeOrder.amount} · {activeOrder.payment}</div>
              <div style={{ color: 'var(--label-secondary)' }}>{activeOrder.carrier} · AWB {activeOrder.awb}</div>
            </div>

            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '14px', top: '16px', bottom: '16px', width: '2px', background: 'var(--separator)' }} />
              {orderStages.map((s, idx) => {
                const selected = previewStage === s.stage;
                return (
                  <div key={idx} onClick={() => setPreviewStage(s.stage)} style={{ display: 'flex', gap: '14px', marginBottom: '16px', cursor: 'pointer', position: 'relative' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: s.done ? 'var(--green)' : 'var(--bg-layer1)', color: s.done ? '#fff' : 'var(--label-secondary)', border: selected ? '2px solid var(--blue)' : s.done ? 'none' : '2px solid var(--separator)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1, fontSize: '11px', fontWeight: 700 }}>
                      {s.done ? <CheckCircle size={14} /> : idx + 1}
                    </div>
                    <div style={{ flexGrow: 1, paddingTop: '2px' }}>
                      <div style={{ fontSize: '13px', fontWeight: selected ? 700 : 600, color: s.done ? 'var(--label-primary)' : 'var(--label-secondary)' }}>{s.stage}</div>
                      <div style={{ fontSize: '11px', color: 'var(--label-secondary)' }}>{s.where ? `${s.where} · ` : ''}{s.time}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="liquid-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '8px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}><Smartphone size={14} style={{ color: 'var(--green)' }} /> WhatsApp update preview</h4>
                <span style={{ fontSize: '10px', color: 'var(--label-secondary)' }}>{previewStage}</span>
              </div>
              <div style={{ background: 'var(--bg-layer2)', borderRadius: '12px', padding: '14px', border: '1px solid var(--separator)' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand)', marginBottom: '8px' }}>Happilo (official business account)</div>
                <div style={{ background: 'var(--bg-layer1)', border: '1px solid var(--separator)', padding: '10px 12px', borderRadius: '0 10px 10px 10px', maxWidth: '92%' }}>
                  <p style={{ fontSize: '12px', margin: 0, lineHeight: 1.55, whiteSpace: 'pre-line' }}>{previewText}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button className="btn-primary" style={{ flexGrow: 1, fontSize: '12px' }} onClick={handleSendUpdate}><Send size={12} /> Send to customer</button>
                <button className="btn-secondary" style={{ fontSize: '12px' }} onClick={() => { try { navigator.clipboard?.writeText(previewText); } catch {} showToast('Message copied.', 'info'); }}>Copy</button>
              </div>
            </div>

            <div className="liquid-card" style={{ padding: '16px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '10px' }}>When customers get a message</h4>
              {[
                ['Order placed and payment confirmed', 'As soon as the order is created'],
                ['Packed and handed to carrier', 'When the warehouse scans the parcel out'],
                ['Out for delivery', 'On the first out-for-delivery scan'],
                ['Delivery failed twice', 'Care team calls the customer'],
                ['Review request', '3 days after delivery'],
              ].map(([stage, rule]) => (
                <div key={stage} style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', fontSize: '11px', paddingBottom: '6px', marginBottom: '6px', borderBottom: '1px solid var(--separator)' }}>
                  <span style={{ fontWeight: 600 }}>{stage}</span>
                  <span style={{ color: 'var(--label-secondary)', fontSize: '10px', textAlign: 'right' }}>{rule}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── CARRIER TRACKING ────────────────────────────────────────────────── */}
      {activeTab === 'carriers' && (
        <div className="carrier-grid" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px', alignItems: 'start' }}>
          <div className="liquid-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', gap: '10px', flexWrap: 'wrap' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 4px' }}>Shipments in motion</h3>
                <p style={{ fontSize: '12px', color: 'var(--label-secondary)', margin: 0 }}>Latest scan from each courier for orders that are in transit or have a problem.</p>
              </div>
              <button className="btn-primary" style={{ fontSize: '12px' }} onClick={handlePullTracking} disabled={pulling}>
                <RefreshCw size={13} className={pulling ? 'animate-spin' : undefined} /> Refresh statuses
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {SHIPMENTS.map(d => {
                const color = d.status === 'Delivered' ? 'var(--green)' : d.status === 'Exception' ? 'var(--red)' : d.status === 'Delayed' ? 'var(--orange)' : d.status === 'Out for delivery' ? 'var(--blue)' : 'var(--brand-mid)';
                const badge = d.status === 'Delivered' ? 'badge-green' : d.status === 'Exception' ? 'badge-red' : d.status === 'Delayed' ? 'badge-orange' : d.status === 'Out for delivery' ? 'badge-blue' : 'badge-grey';
                return (
                  <div key={d.awb} style={{ background: 'var(--fill-quaternary)', padding: '14px', borderRadius: '12px', borderLeft: `3px solid ${color}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', gap: '8px', flexWrap: 'wrap' }}>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: '13px' }}>{d.carrier}</span>
                        <span style={{ fontSize: '11px', color: 'var(--label-secondary)', marginLeft: '8px', fontFamily: 'var(--font-mono)' }}>{d.awb}</span>
                      </div>
                      <span className={`badge ${badge}`} style={{ fontSize: '9px' }}>{d.status}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: 'var(--label-secondary)', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <span><MapPin size={10} style={{ marginRight: '3px' }} />{d.location}</span>
                      <span><Clock size={10} style={{ marginRight: '3px' }} />{d.updated}</span>
                      <span>Order {d.order}</span>
                    </div>
                    <div style={{ fontSize: '11px' }}>
                      <span style={{ color: 'var(--label-secondary)' }}>ETA: </span>
                      <span style={{ fontWeight: 700, color: d.status === 'Exception' || d.status === 'Delayed' ? 'var(--red)' : 'var(--label-primary)' }}>{d.eta}</span>
                    </div>
                    {d.status !== 'Delivered' && (
                      <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                        <button className="btn-primary" style={{ fontSize: '10px', padding: '3px 8px' }} onClick={() => showToast(`Update sent to the customer for ${d.order}.`, 'success')}><Smartphone size={10} /> Message customer</button>
                        {(d.status === 'Exception' || d.status === 'Delayed') && (
                          <button className="btn-secondary" style={{ fontSize: '10px', padding: '3px 8px', color: 'var(--red)' }} onClick={() => showToast(`Escalated ${d.carrier} AWB ${d.awb} to the logistics team.`, 'info')}><AlertTriangle size={10} /> Escalate to courier</button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="liquid-card" style={{ padding: '20px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}><Truck size={14} style={{ color: 'var(--blue)' }} /> On-time delivery, last 30 days</h4>
              {CARRIER_PERF.map(([name, pct]) => {
                const color = pct >= 92 ? 'var(--green)' : 'var(--orange)';
                return (
                  <div key={name} style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                      <span style={{ fontWeight: 600 }}>{name}</span>
                      <span style={{ color, fontWeight: 700 }}>{pct}%</span>
                    </div>
                    <div style={{ height: '4px', background: 'var(--fill-primary)', borderRadius: '2px' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '2px' }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="liquid-card" style={{ padding: '20px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px' }}>How we handle courier problems</h4>
              {[
                ['Two failed delivery attempts', 'Care team calls the customer and re-schedules'],
                ['Delayed by more than 2 days', 'Apology message and Rs 50 credit'],
                ['Return to origin started', 'Call the customer, offer re-delivery'],
                ['Pack damaged in transit', 'Replacement sent after a photo'],
                ['Marked delivered, not received', 'Non-delivery claim, refund or re-ship in 24 hours'],
              ].map(([trigger, action]) => (
                <div key={trigger} style={{ display: 'flex', gap: '10px', marginBottom: '10px', fontSize: '11px' }}>
                  <AlertTriangle size={12} style={{ color: 'var(--orange)', flexShrink: 0, marginTop: '1px' }} />
                  <div>
                    <div style={{ fontWeight: 700 }}>{trigger}</div>
                    <div style={{ color: 'var(--label-secondary)' }}>{action}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── REVIEWS ─────────────────────────────────────────────────────────── */}
      {activeTab === 'reviews' && (
        <div className="split-layout" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', alignItems: 'start' }}>
          <div className="liquid-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', gap: '10px', flexWrap: 'wrap' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 4px' }}>Customer reviews</h3>
                <p style={{ fontSize: '12px', color: 'var(--label-secondary)', margin: 0 }}>{needReply} awaiting a reply{pendingApproval > 0 ? `, ${pendingApproval} waiting for approval on happilo.com` : ''}.</p>
              </div>
              <label style={{ fontSize: '11px', color: 'var(--label-secondary)', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input type="checkbox" checked={followDateFilter} onChange={e => setFollowDateFilter(e.target.checked)} /> Use dashboard date range
              </label>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
              <select className="input" value={platformFilter} onChange={e => setPlatformFilter(e.target.value)} style={{ fontSize: '11px', padding: '5px 8px' }}>
                {PLATFORMS.map(p => <option key={p} value={p}>{p === 'all' ? 'All platforms' : p}</option>)}
              </select>
              <select className="input" value={ratingFilter} onChange={e => setRatingFilter(e.target.value)} style={{ fontSize: '11px', padding: '5px 8px' }}>
                <option value="all">All ratings</option>
                <option value="high">4-5 star</option>
                <option value="low">1-3 star</option>
              </select>
              <select className="input" value={reviewView} onChange={e => setReviewView(e.target.value as 'all' | 'needs-reply')} style={{ fontSize: '11px', padding: '5px 8px' }}>
                <option value="all">All reviews</option>
                <option value="needs-reply">Needs a reply</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '12px' }}>
              {shownReviews.length === 0 && <p style={{ fontSize: '12px', color: 'var(--label-secondary)' }}>No reviews match these filters.</p>}
              {shownReviews.map(r => (
                <div key={r.id} style={{ background: 'var(--fill-quaternary)', padding: '14px', borderRadius: '12px', borderLeft: `3px solid ${r.rating >= 4 ? 'var(--green)' : r.rating === 3 ? 'var(--orange)' : 'var(--red)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px', gap: '6px' }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: '13px' }}>{r.customer}</span>
                      <div style={{ fontSize: '10px', color: 'var(--label-secondary)' }}>{r.platform} · {r.date}{r.verified ? ' · Verified buyer' : ''}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      {[1, 2, 3, 4, 5].map(n => <Star key={n} size={11} style={{ color: n <= r.rating ? 'var(--yellow)' : 'var(--fill-primary)', fill: n <= r.rating ? 'var(--yellow)' : 'transparent' }} />)}
                    </div>
                  </div>
                  {r.product && <div style={{ fontSize: '10px', color: 'var(--brand)', fontWeight: 600, marginBottom: '6px' }}>{r.product}</div>}
                  <p style={{ fontSize: '12px', color: 'var(--label-primary)', margin: '0 0 8px', lineHeight: 1.45 }}>{r.text}</p>
                  {r.reply && <div style={{ fontSize: '11px', background: 'var(--bg-layer1)', border: '1px solid var(--separator)', padding: '8px', borderRadius: '6px', marginBottom: '6px' }}><span style={{ color: 'var(--brand)', fontWeight: 700 }}>Happilo: </span>{r.reply}</div>}

                  {replyOpenId === r.id && (
                    <div style={{ marginBottom: '6px' }}>
                      <textarea className="input" rows={3} value={reviewDrafts[r.id] ?? ''} onChange={e => setReviewDrafts(d => ({ ...d, [r.id]: e.target.value }))} placeholder="Write a reply" style={{ width: '100%', fontSize: '12px', padding: '6px 8px', resize: 'vertical' }} />
                      <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                        <button className="btn-primary" style={{ fontSize: '10px', padding: '3px 10px' }} onClick={() => postReviewReply(r.id)}>Post reply</button>
                        <button className="btn-secondary" style={{ fontSize: '10px', padding: '3px 8px' }} onClick={() => setReviewDrafts(d => ({ ...d, [r.id]: suggestReply(r) }))}>Suggest wording</button>
                        <button className="btn-secondary" style={{ fontSize: '10px', padding: '3px 8px' }} onClick={() => setReplyOpenId(null)}>Cancel</button>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {!r.reply && replyOpenId !== r.id && (
                      <button className="btn-secondary" style={{ fontSize: '10px', padding: '3px 8px' }} onClick={() => { setReplyOpenId(r.id); setReviewDrafts(d => ({ ...d, [r.id]: d[r.id] || suggestReply(r) })); }}><MessageSquare size={10} /> Reply</button>
                    )}
                    {r.rating <= 3 && !r.intercepted && (
                      <button className="btn-secondary" style={{ fontSize: '10px', padding: '3px 8px', color: 'var(--red)' }} onClick={() => openCaseFromReview(r.id)}><AlertTriangle size={10} /> Open care case</button>
                    )}
                    {r.intercepted && <span className="badge badge-green" style={{ fontSize: '9px' }}>Care case opened</span>}
                    {r.platform === 'happilo.com' && r.approved === false && (
                      <button className="btn-primary" style={{ fontSize: '10px', padding: '3px 8px' }} onClick={() => setApproval(r.id, true)}><Eye size={10} /> Approve</button>
                    )}
                    {r.platform === 'happilo.com' && r.approved === true && (
                      <button className="btn-secondary" style={{ fontSize: '10px', padding: '3px 8px' }} onClick={() => setApproval(r.id, false)}><EyeOff size={10} /> Hide</button>
                    )}
                    {r.platform === 'happilo.com' && r.approved === false && <span className="badge badge-orange" style={{ fontSize: '9px' }}>Pending approval</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="liquid-card" style={{ padding: '20px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '4px' }}>Rating breakdown</h4>
              <p style={{ fontSize: '11px', color: 'var(--label-secondary)', margin: '0 0 12px' }}>{avgRating.toFixed(2)} average across {periodReviews.length} reviews</p>
              {dist.map(d => (
                <div key={d.n} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', marginBottom: '6px' }}>
                  <span style={{ width: '24px' }}>{d.n} star</span>
                  <div style={{ flexGrow: 1, height: '6px', background: 'var(--fill-primary)', borderRadius: '3px' }}>
                    <div style={{ width: `${periodReviews.length ? (d.count / periodReviews.length) * 100 : 0}%`, height: '100%', background: d.n >= 4 ? 'var(--green)' : d.n === 3 ? 'var(--orange)' : 'var(--red)', borderRadius: '3px' }} />
                  </div>
                  <span style={{ width: '18px', textAlign: 'right', fontWeight: 600 }}>{d.count}</span>
                </div>
              ))}
              <div style={{ marginTop: '14px', borderTop: '1px solid var(--separator)', paddingTop: '10px' }}>
                {PLATFORMS.slice(1).map(p => {
                  const rs = periodReviews.filter(r => r.platform === p);
                  return (
                    <div key={p} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '5px' }}>
                      <span>{p}</span>
                      <span style={{ color: 'var(--label-secondary)' }}>{rs.length} reviews · {rs.length ? avg(rs.map(r => r.rating)).toFixed(1) : '-'}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="liquid-card" style={{ padding: '20px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}><Smartphone size={14} style={{ color: 'var(--blue)' }} /> Try the post-delivery rating flow</h4>
              <p style={{ fontSize: '11px', color: 'var(--label-secondary)', marginBottom: '12px' }}>Three days after delivery customers are asked to rate their order. 4-5 stars go to the review page for approval. 1-3 stars open a care case so we can call before it turns into a public review.</p>
              <form onSubmit={handleSurveySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label style={labelStyle}>Customer name</label>
                  <input type="text" className="input" value={simName} onChange={e => setSimName(e.target.value)} style={{ width: '100%', padding: '6px 10px', fontSize: '12px' }} />
                </div>
                <div>
                  <label style={labelStyle}>Rating</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {[1, 2, 3, 4, 5].map(num => (
                      <button key={num} type="button" aria-label={`${num} star`} onClick={() => { setSimRating(num); setSimCaseId(null); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
                        <Star size={22} style={{ color: num <= simRating ? 'var(--yellow)' : 'var(--fill-primary)', fill: num <= simRating ? 'var(--yellow)' : 'transparent' }} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Comments</label>
                  <textarea className="input" rows={3} value={simText} onChange={e => setSimText(e.target.value)} placeholder={simRating >= 4 ? 'What did you like?' : 'What went wrong?'} style={{ width: '100%', padding: '6px 10px', fontSize: '12px', resize: 'none' }} />
                </div>
                <button type="submit" className="btn-primary" disabled={simRating === 0} style={{ fontSize: '12px' }}>Submit rating</button>
              </form>
              {simRating > 0 && simRating <= 3 && !simCaseId && (
                <div style={{ marginTop: '12px', background: 'rgba(229,72,61,0.08)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(229,72,61,0.2)', fontSize: '11px', color: 'var(--label-secondary)' }}>
                  A care case will be opened for this customer instead of a public review.
                </div>
              )}
              {simCaseId && (
                <div style={{ marginTop: '12px', background: 'rgba(30,158,95,0.10)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(30,158,95,0.25)', fontSize: '11px' }}>
                  <strong>Care case {simCaseId.replace('case-', '#')} opened.</strong>
                  <div style={{ marginTop: '6px' }}>
                    <button className="btn-secondary" style={{ fontSize: '10px', padding: '3px 8px' }} onClick={() => { setActiveCaseId(simCaseId); setActiveTab('inbox'); }}>View in inbox <ChevronRight size={10} /></button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── SLA & CSAT ──────────────────────────────────────────────────────── */}
      {activeTab === 'sla' && (
        <div className="sla-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
          <div className="liquid-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>Service targets</h3>
            <p style={{ fontSize: '12px', color: 'var(--label-secondary)', margin: '0 0 8px' }}>Calculated from the cases in the inbox.</p>
            {([
              ['First reply', `Within ${FIRST_RESPONSE_TARGET_MIN} min`, `${stats.firstResponse.toFixed(0)} min avg, ${stats.frWithin}% in time`, stats.frWithin >= 80],
              ['Resolution', 'Urgent 4h, High 8h, Normal 24h, Low 48h', `${stats.resolveWithin}% closed in time`, stats.resolveWithin >= 80],
              ['Average time to resolve', 'Under 24 hours', `${stats.avgResolveHrs.toFixed(1)} hours`, stats.avgResolveHrs <= 24],
              ['Open cases past SLA', 'None', `${stats.breachedOpen} of ${stats.active} open`, stats.breachedOpen === 0],
              ['Customer satisfaction', '4.2 or higher', `${stats.csat.toFixed(1)} from ${stats.csatCount} replies`, stats.csat >= 4.2],
              ['Low ratings followed up', 'All within 1 day', `${lowFollowedUp} of ${lowReviews.length}`, lowFollowedUp === lowReviews.length],
            ] as [string, string, string, boolean][]).map(([rule, target, actual, met]) => (
              <div key={rule} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--separator)', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>{rule}</div>
                  <div style={{ fontSize: '10px', color: 'var(--label-secondary)', marginTop: '2px' }}>Target: {target}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: met ? 'var(--green)' : 'var(--red)' }}>{actual}</div>
                  <span className={`badge ${met ? 'badge-green' : 'badge-red'}`} style={{ fontSize: '9px' }}>{met ? 'On target' : 'Off target'}</span>
                </div>
              </div>
            ))}

            <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '20px 0 8px' }}>By priority</h4>
            <table className="data-table" style={{ width: '100%', fontSize: '12px' }}>
              <thead><tr><th style={{ textAlign: 'left' }}>Priority</th><th>Target</th><th>Open</th><th>Past SLA</th></tr></thead>
              <tbody>
                {(['Urgent', 'High', 'Normal', 'Low'] as CasePriority[]).map(p => {
                  const open = supportCases.filter(c => (c.priority || 'Normal') === p && c.status !== 'Resolved');
                  return (
                    <tr key={p}>
                      <td><span className={`badge ${PRIORITY_COLOR[p]}`} style={{ fontSize: '10px' }}>{p}</span></td>
                      <td style={{ textAlign: 'center' }}>{SLA_TARGET_HOURS[p]}h</td>
                      <td style={{ textAlign: 'center' }}>{open.length}</td>
                      <td style={{ textAlign: 'center', color: open.some(c => slaState(c) === 'Breached') ? 'var(--red)' : undefined, fontWeight: 600 }}>{open.filter(c => slaState(c) === 'Breached').length}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="liquid-card" style={{ padding: '20px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px' }}>Cases by channel</h4>
              {CHANNELS.slice(1).map(ch => {
                const cs = supportCases.filter(c => c.channel === ch);
                const frs = cs.map(c => c.firstResponseMin).filter((x): x is number => typeof x === 'number');
                return (
                  <div key={ch} style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                      <span style={{ fontWeight: 600 }}>{CHANNEL_LABEL[ch]}</span>
                      <span style={{ color: 'var(--label-secondary)' }}>{cs.length} cases · first reply {frs.length ? `${avg(frs).toFixed(0)} min` : '-'}</span>
                    </div>
                    <div style={{ height: '4px', background: 'var(--fill-primary)', borderRadius: '2px' }}>
                      <div style={{ width: `${supportCases.length ? (cs.length / supportCases.length) * 100 * 2.5 : 0}%`, maxWidth: '100%', height: '100%', background: 'var(--brand-mid)', borderRadius: '2px' }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="liquid-card" style={{ padding: '20px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px' }}>What customers write in about</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {tagCounts.map(([t, n]) => <span key={t} className="badge badge-blue" style={{ fontSize: '11px' }}>{t} · {n}</span>)}
              </div>
              <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '18px 0 10px' }}>CSAT replies</h4>
              {[5, 4, 3, 2, 1].map(n => {
                const count = stats.csatResponses.filter(x => x === n).length;
                return (
                  <div key={n} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', marginBottom: '6px' }}>
                    <span style={{ width: '24px' }}>{n} star</span>
                    <div style={{ flexGrow: 1, height: '6px', background: 'var(--fill-primary)', borderRadius: '3px' }}>
                      <div style={{ width: `${stats.csatCount ? (count / stats.csatCount) * 100 : 0}%`, height: '100%', background: n >= 4 ? 'var(--green)' : n === 3 ? 'var(--orange)' : 'var(--red)', borderRadius: '3px' }} />
                    </div>
                    <span style={{ width: '18px', textAlign: 'right', fontWeight: 600 }}>{count}</span>
                  </div>
                );
              })}
            </div>
            <div className="liquid-card" style={{ padding: '20px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px' }}>Quick actions</h4>
              {([
                ['Nudge cases that are past SLA', 'info'],
                ['Refresh all courier statuses', 'info'],
                ['Export this week\'s cases', 'info'],
              ] as [string, string][]).map(([label, type]) => (
                <button key={label} className="btn-secondary" style={{ width: '100%', textAlign: 'left', fontSize: '12px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => showToast(label === 'Nudge cases that are past SLA' ? `Reminder sent to the owners of ${stats.breachedOpen} overdue cases.` : label === 'Refresh all courier statuses' ? 'Courier statuses refreshed.' : 'Case export is ready to download.', type)}>
                  <ChevronRight size={12} /> {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
