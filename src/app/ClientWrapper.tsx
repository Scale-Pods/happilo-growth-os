'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Bot,
  DollarSign,
  Users,
  Sparkles,
  Settings as SettingsIcon,
  Sun,
  Moon,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  Calendar,
  Bell,
  CheckCircle,
  X,
  AlertTriangle,
  CheckCircle2,
  Info,
  UserCheck,
  Activity,
  Building2,
  MapPin,
  MessageSquare,
  Mail,
  Phone,
  Check,
  UploadCloud,
  Send,
  Inbox,
  BarChart3,
  Eye,
  EyeOff
} from 'lucide-react';
import { DateRangePicker, type DateRange } from '@/components/shared/DateRangePicker';
import OutreachSequenceModal from './accounts-receivable/OutreachSequenceModal';

import { OUTREACH_ADMIN_EMAIL as OUTREACH_SETTINGS_ALLOWED_EMAIL } from '@/lib/demoUsers';
import { subMonths, startOfDay, endOfDay } from 'date-fns';
import type { Product } from '@/lib/mock/inventory';
import { INITIAL_INVENTORY } from '@/lib/mock/inventory';
import type { SupportCase, Review } from '@/lib/mock/customerCare';
import { INITIAL_SUPPORT_CASES, INITIAL_REVIEWS } from '@/lib/mock/customerCare';
import type { ContentDraft } from '@/lib/mock/marketing';
import { INITIAL_CONTENT_DRAFTS } from '@/lib/mock/marketing';
import type { Receivable } from '@/lib/mock/receivablesState';
import { INITIAL_RECEIVABLES } from '@/lib/mock/receivablesState';
import type { Lead } from '@/lib/mock/b2bState';
import { INITIAL_B2B_LEADS } from '@/lib/mock/b2bState';
import type { WhatsappAlert } from '@/lib/mock/alerts';
import { INITIAL_WHATSAPP_ALERTS } from '@/lib/mock/alerts';


// Interfaces for our state elements to ensure type safety









interface Toast {
  id: number;
  message: string;
  type: string;
}

interface AppContextProps {
  isLoggedIn: boolean;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  dateFilter: string;
  setDateFilter: React.Dispatch<React.SetStateAction<string>>;
  dateRange: DateRange | undefined;
  setDateRange: React.Dispatch<React.SetStateAction<DateRange | undefined>>;
  dateLabel: string | undefined;
  setDateLabel: React.Dispatch<React.SetStateAction<string | undefined>>;
  toasts: Toast[];
  showToast: (message: string, type?: string) => void;
  spotlightOpen: boolean;
  setSpotlightOpen: React.Dispatch<React.SetStateAction<boolean>>;
  inspectorOpen: boolean;
  setInspectorOpen: React.Dispatch<React.SetStateAction<boolean>>;
  inspectorType: string;
  setInspectorType: React.Dispatch<React.SetStateAction<string>>;
  inspectorData: any;
  setInspectorData: React.Dispatch<React.SetStateAction<any>>;
  inventory: Product[];
  setInventory: React.Dispatch<React.SetStateAction<Product[]>>;
  supportCases: SupportCase[];
  setSupportCases: React.Dispatch<React.SetStateAction<SupportCase[]>>;
  reviews: Review[];
  setReviews: React.Dispatch<React.SetStateAction<Review[]>>;
  receivables: Receivable[];
  setReceivables: React.Dispatch<React.SetStateAction<Receivable[]>>;
  b2bLeads: Lead[];
  setB2bLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  contentDrafts: ContentDraft[];
  setContentDrafts: React.Dispatch<React.SetStateAction<ContentDraft[]>>;
  whatsappAlerts: WhatsappAlert[];
  setWhatsappAlerts: React.Dispatch<React.SetStateAction<WhatsappAlert[]>>;
}

// Hard session lifetime. 30 minutes after sign-in the user is logged out and
// must authenticate again (security: an unattended tab can't stay open).
const SESSION_MAX_MS = 30 * 60 * 1000;

/** "Happilo Admin" -> "HA", "admin@happilo.com" -> "AD". */
function initialsFromName(value: string): string {
  const name = value.includes('@') ? value.split('@')[0] : value;
  const parts = name.trim().split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Create Global Context with default undefined state
const AppContext = createContext<AppContextProps | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};







// -------------------------------------------------------
// Sidebar navigation — every module and page is listed
// directly, grouped by area. Modules with many pages
// (B2B CRM, Receivables) are collapsible groups, and
// channels (WhatsApp / Email / Voice) show their own
// pages when you are inside them.
// -------------------------------------------------------
type NavIcon = React.ComponentType<{ size?: number }>;

interface NavLeaf {
  href: string;
  label: string;
}

interface NavLink {
  href: string;
  label: string;
  icon: NavIcon;
  /** Path prefix that marks this link (and its children) as active. */
  match?: string;
  children?: NavLeaf[];
}

interface NavModule {
  id: string;
  label: string;
  icon: NavIcon;
  prefix: string[];
  links: NavLink[];
}

interface NavArea {
  label: string;
  links?: NavLink[];
  modules?: NavModule[];
}

const channelPages = (base: string, pages: [string, string][]): NavLeaf[] =>
  pages.map(([slug, label]) => ({ href: `${base}/${slug}`, label }));

const NAV: NavArea[] = [
  {
    label: 'Overview',
    links: [
      { href: '/master', label: 'Master Dashboard', icon: LayoutDashboard },
      { href: '/dashboard', label: 'Executive Board', icon: BarChart3 },
    ],
  },
  {
    label: 'Operations',
    links: [
      { href: '/inventory', label: 'Inventory', icon: Package },
      { href: '/customer-care', label: 'Customer Care', icon: Bot },
    ],
  },
  {
    label: 'Marketing',
    links: [{ href: '/marketing', label: 'Content OS', icon: Sparkles }],
  },
  {
    label: 'Sales & Finance',
    modules: [
      {
        id: 'b2b',
        label: 'B2B CRM',
        icon: Users,
        prefix: ['/b2b-crm', '/b2b-sales'],
        links: [
          { href: '/b2b-crm/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { href: '/b2b-crm/leads', label: 'Leads', icon: UserCheck },
          { href: '/b2b-crm/scraper', label: 'Lead Finder', icon: MapPin },
          {
            href: '/b2b-crm/whatsapp/dashboard', label: 'WhatsApp', icon: MessageSquare, match: '/b2b-crm/whatsapp',
            children: channelPages('/b2b-crm/whatsapp', [['dashboard', 'Overview'], ['chats', 'Chats'], ['leads', 'Leads'], ['analytics', 'Analytics']]),
          },
          {
            href: '/b2b-crm/email/dashboard', label: 'Email', icon: Mail, match: '/b2b-crm/email',
            children: channelPages('/b2b-crm/email', [['dashboard', 'Overview'], ['inbox', 'Inbox'], ['analytics', 'Analytics']]),
          },
          {
            href: '/b2b-crm/voice/dashboard', label: 'Voice', icon: Phone, match: '/b2b-crm/voice',
            children: channelPages('/b2b-crm/voice', [['dashboard', 'Overview'], ['logs', 'Call Logs'], ['analytics', 'Analytics']]),
          },
        ],
      },
      {
        id: 'receivables',
        label: 'Receivables',
        icon: DollarSign,
        prefix: ['/accounts-receivable'],
        links: [
          { href: '/accounts-receivable/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { href: '/accounts-receivable/upload-invoice', label: 'Invoices & Ledger', icon: UploadCloud },
          { href: '/accounts-receivable/activity', label: 'Party Activity', icon: Activity },
          {
            href: '/accounts-receivable/whatsapp/dashboard', label: 'WhatsApp', icon: MessageSquare, match: '/accounts-receivable/whatsapp',
            children: channelPages('/accounts-receivable/whatsapp', [['dashboard', 'Overview'], ['chats', 'Chats'], ['leads', 'Accounts'], ['analytics', 'Analytics']]),
          },
          {
            href: '/accounts-receivable/email/dashboard', label: 'Email', icon: Mail, match: '/accounts-receivable/email',
            children: channelPages('/accounts-receivable/email', [['dashboard', 'Overview'], ['sent', 'Sent'], ['received', 'Received'], ['analytics', 'Analytics']]),
          },
          {
            href: '/accounts-receivable/voice/dashboard', label: 'Voice', icon: Phone, match: '/accounts-receivable/voice',
            children: channelPages('/accounts-receivable/voice', [['dashboard', 'Overview'], ['logs', 'Call Logs'], ['analytics', 'Analytics']]),
          },
        ],
      },
    ],
  },
];

const pathIn = (pathname: string | null, prefix: string) =>
  !!pathname && (pathname === prefix || pathname.startsWith(prefix + '/'));

/** Breadcrumb trail for the header: [area/module, page, sub-page]. */
function breadcrumbFor(pathname: string | null): string[] {
  if (!pathname || pathname === '/') return ['Happilo Growth OS'];
  for (const area of NAV) {
    for (const link of area.links ?? []) {
      if (pathIn(pathname, link.href)) return [area.label, link.label];
    }
    for (const mod of area.modules ?? []) {
      if (!mod.prefix.some((p) => pathIn(pathname, p))) continue;
      for (const link of mod.links) {
        const child = link.children?.find((c) => c.href === pathname);
        if (child) return [mod.label, link.label, child.label];
        if (pathIn(pathname, link.match ?? link.href)) return [mod.label, link.label];
      }
      return [mod.label];
    }
  }
  const last = pathname.split('/').filter(Boolean).pop() ?? '';
  return [last.replace(/-/g, ' ')];
}

export function ClientWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isPublicSharePage =
    (pathname?.startsWith('/share/') ?? false);

  const authHashRedirecting = false;

  // App Global States
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string } | null>(null);
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});
  const [outreachModalOpen, setOutreachModalOpen] = useState(false);
  const crumbs = breadcrumbFor(pathname);
  // Outreach Sequence Generator — hidden gear icon, only in Receivables Recovery,
  // only for the one allowed account. Client-side gate only; the real check
  // (session cookie + allowed email) lives in /api/outreach-generator.
  const canManageOutreachSettings =
    (pathname?.startsWith('/accounts-receivable') ?? false) &&
    currentUser?.email?.toLowerCase() === OUTREACH_SETTINGS_ALLOWED_EMAIL;

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    const saved = localStorage.getItem('isLoggedIn');
    const loginAt = Number(localStorage.getItem('loginAt') || '0');
    const sessionValid = saved === 'true' && loginAt > 0 && Date.now() - loginAt < SESSION_MAX_MS;
    if (sessionValid) {
      setIsLoggedIn(true);
      try {
        const stored = JSON.parse(localStorage.getItem('authUser') || 'null');
        if (stored?.email) setCurrentUser(stored);
      } catch {
        /* ignore */
      }
    } else if (saved === 'true') {
      // Session on record but expired — clear it so the login gate shows.
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('loginAt');
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      localStorage.setItem('sessionExpired', '1');
    }
    if (localStorage.getItem('sessionExpired') === '1') {
      setSessionExpiredNotice(true);
    }
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted) return;
    localStorage.setItem('isLoggedIn', String(isLoggedIn));
    if (!isLoggedIn) {
      localStorage.removeItem('loginAt');
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      setCurrentUser(null);
    }
  }, [isLoggedIn, hasMounted]);

  // Auto-logout 30 minutes after the session started. Checks on an interval
  // and when the tab regains focus, so a backgrounded tab still expires.
  useEffect(() => {
    if (!hasMounted || !isLoggedIn) return;

    const enforce = () => {
      const loginAt = Number(localStorage.getItem('loginAt') || '0');
      if (!loginAt || Date.now() - loginAt >= SESSION_MAX_MS) {
        setIsLoggedIn(false);
        setSessionExpiredNotice(true);
        localStorage.removeItem('loginAt');
        localStorage.removeItem('authToken');
        localStorage.setItem('isLoggedIn', 'false');
        localStorage.setItem('sessionExpired', '1');
        fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
        router.push('/');
      }
    };

    const id = window.setInterval(enforce, 30_000);
    window.addEventListener('focus', enforce);
    document.addEventListener('visibilitychange', enforce);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('focus', enforce);
      document.removeEventListener('visibilitychange', enforce);
    };
  }, [isLoggedIn, hasMounted, router]);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginBusy, setLoginBusy] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  // Signs in against /api/auth/login (static demo accounts — no database).
  const doLogin = async () => {
    setLoginError(null);
    setLoginBusy(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLoginError(data?.error || 'Sign in failed.');
        return;
      }
      localStorage.setItem('sessionExpired', '0');
      localStorage.removeItem('sessionExpired');
      localStorage.setItem('loginAt', String(Date.now()));
      if (data?.token) localStorage.setItem('authToken', data.token);
      const u = {
        name: (data?.user?.name as string) || (data?.user?.email as string) || loginEmail.trim(),
        email: (data?.user?.email as string) || loginEmail.trim(),
      };
      localStorage.setItem('authUser', JSON.stringify(u));
      setCurrentUser(u);
      setSessionExpiredNotice(false);
      setLoginPassword('');
      setIsLoggedIn(true);
      if (pathname === '/') router.push('/master');
      showToast('Signed in to Happilo Growth OS.', 'success');
    } catch {
      setLoginError('Network error — please try again.');
    } finally {
      setLoginBusy(false);
    }
  };

  const [dateFilter, setDateFilter] = useState('30d');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => ({
    from: startOfDay(subMonths(new Date(), 3)),
    to: endOfDay(new Date()),
  }));
  const [dateLabel, setDateLabel] = useState<string | undefined>('Last 3 Months');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  // Spotlight Finder States
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const [spotlightInput, setSpotlightInput] = useState('');
  const [spotlightSelectedIndex, setSpotlightSelectedIndex] = useState(0);

  // Inspector States
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [inspectorType, setInspectorType] = useState('order');
  const [inspectorData, setInspectorData] = useState<any>({});

  // Shared Global Databases
  const [inventory, setInventory] = useState<Product[]>(INITIAL_INVENTORY);
  const [supportCases, setSupportCases] = useState<SupportCase[]>(INITIAL_SUPPORT_CASES);
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);
  const [receivables, setReceivables] = useState<Receivable[]>(INITIAL_RECEIVABLES);
  const [b2bLeads, setB2bLeads] = useState<Lead[]>(INITIAL_B2B_LEADS);
  const [contentDrafts, setContentDrafts] = useState<ContentDraft[]>(INITIAL_CONTENT_DRAFTS);
  const [whatsappAlerts, setWhatsappAlerts] = useState<WhatsappAlert[]>(INITIAL_WHATSAPP_ALERTS);

  // Dynamic Navigation History (Simulated)
  const [historyStack, setHistoryStack] = useState<string[]>(['/']);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Push path to custom history stack when pathname changes
  useEffect(() => {
    if (pathname && historyStack[historyIndex] !== pathname) {
      const newStack = historyStack.slice(0, historyIndex + 1);
      newStack.push(pathname);
      setHistoryStack(newStack);
      setHistoryIndex(newStack.length - 1);
    }
  }, [pathname]);

  // The app shell (html/body/.app-container/.main-workspace) is overflow:hidden
  // and only .content-body should scroll. Reset just that pane on route change,
  // and undo any stray scroll on the shell that would push the header off-screen
  // and expose the sidebar footer.
  useEffect(() => {
    document.querySelector('.content-body')?.scrollTo({ top: 0 });
    document
      .querySelectorAll('.app-container, .main-workspace')
      .forEach((el) => { el.scrollTop = 0; el.scrollLeft = 0; });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname]);

  // Go Back in Custom History
  const goBack = () => {
    if (historyIndex > 0) {
      const target = historyStack[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      router.push(target, { scroll: false });
    }
  };

  // Go Forward in Custom History
  const goForward = () => {
    if (historyIndex < historyStack.length - 1) {
      const target = historyStack[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      router.push(target, { scroll: false });
    }
  };

  // Toast System
  const showToast = (message: string, type = 'info') => {
    const newToast = { id: Date.now(), message, type };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, 3200);
  };

  // Happilo runs a single light theme with green as the brand accent.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  }, []);

  // Listen for Global Cmd+K
  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSpotlightInput('');
        setSpotlightSelectedIndex(0);
        setSpotlightOpen(true);
      }
      if (e.key === 'Escape') {
        setSpotlightOpen(false);
        setInspectorOpen(false);
      }
    };
    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, []);

  const spotlightOptions = [
    { text: 'Go to Master Dashboard', type: 'navigation', target: '/master', shortcut: '⌘0' },
    { text: 'Go to Executive Dashboard', type: 'navigation', target: '/dashboard', shortcut: '⌘1' },
    { text: 'Go to Inventory Intelligence', type: 'navigation', target: '/inventory', shortcut: '⌘2' },
    { text: 'Go to Customer Care & Reviews', type: 'navigation', target: '/customer-care', shortcut: '⌘3' },
    { text: 'Go to Marketing Content OS', type: 'navigation', target: '/marketing', shortcut: '⌘4' },
    { text: 'Go to B2B CRM: Dashboard', type: 'navigation', target: '/b2b-crm/dashboard', shortcut: '⌘5' },
    { text: 'Go to B2B CRM: Leads', type: 'navigation', target: '/b2b-crm/leads', shortcut: '' },
    { text: 'Go to B2B CRM: B2B Lead Finder', type: 'navigation', target: '/b2b-crm/scraper', shortcut: '' },
    { text: 'Go to B2B CRM: WhatsApp Dashboard', type: 'navigation', target: '/b2b-crm/whatsapp/dashboard', shortcut: '' },
    { text: 'Go to B2B CRM: WhatsApp Chats', type: 'navigation', target: '/b2b-crm/whatsapp/chats', shortcut: '' },
    { text: 'Go to B2B CRM: WhatsApp Leads', type: 'navigation', target: '/b2b-crm/whatsapp/leads', shortcut: '' },
    { text: 'Go to B2B CRM: WhatsApp Analytics', type: 'navigation', target: '/b2b-crm/whatsapp/analytics', shortcut: '' },
    { text: 'Go to B2B CRM: Email Dashboard', type: 'navigation', target: '/b2b-crm/email/dashboard', shortcut: '' },
    { text: 'Go to B2B CRM: Email Inbox', type: 'navigation', target: '/b2b-crm/email/inbox', shortcut: '' },
    { text: 'Go to B2B CRM: Email Analytics', type: 'navigation', target: '/b2b-crm/email/analytics', shortcut: '' },
    { text: 'Go to B2B CRM: Voice Dashboard', type: 'navigation', target: '/b2b-crm/voice/dashboard', shortcut: '' },
    { text: 'Go to B2B CRM: Voice Call Logs', type: 'navigation', target: '/b2b-crm/voice/logs', shortcut: '' },
    { text: 'Go to B2B CRM: Voice Analytics', type: 'navigation', target: '/b2b-crm/voice/analytics', shortcut: '' },
    { text: 'Go to Receivables: Dashboard', type: 'navigation', target: '/accounts-receivable/dashboard', shortcut: '⌘6' },
    { text: 'Go to Receivables: Upload Invoice', type: 'navigation', target: '/accounts-receivable/upload-invoice', shortcut: '' },
    { text: 'Go to Receivables: Party Activity', type: 'navigation', target: '/accounts-receivable/activity', shortcut: '' },
    { text: 'Go to Receivables: WhatsApp Dashboard', type: 'navigation', target: '/accounts-receivable/whatsapp/dashboard', shortcut: '' },
    { text: 'Go to Receivables: WhatsApp Chats', type: 'navigation', target: '/accounts-receivable/whatsapp/chats', shortcut: '' },
    { text: 'Go to Receivables: WhatsApp Leads', type: 'navigation', target: '/accounts-receivable/whatsapp/leads', shortcut: '' },
    { text: 'Go to Receivables: WhatsApp Analytics', type: 'navigation', target: '/accounts-receivable/whatsapp/analytics', shortcut: '' },
    { text: 'Go to Receivables: Email Dashboard', type: 'navigation', target: '/accounts-receivable/email/dashboard', shortcut: '' },
    { text: 'Go to Receivables: Email Sent', type: 'navigation', target: '/accounts-receivable/email/sent', shortcut: '' },
    { text: 'Go to Receivables: Email Received', type: 'navigation', target: '/accounts-receivable/email/received', shortcut: '' },
    { text: 'Go to Receivables: Email Analytics', type: 'navigation', target: '/accounts-receivable/email/analytics', shortcut: '' },
    { text: 'Go to Receivables: Voice Dashboard', type: 'navigation', target: '/accounts-receivable/voice/dashboard', shortcut: '' },
    { text: 'Go to Receivables: Voice Call Logs', type: 'navigation', target: '/accounts-receivable/voice/logs', shortcut: '' },
    { text: 'Go to Receivables: Voice Analytics', type: 'navigation', target: '/accounts-receivable/voice/analytics', shortcut: '' },
  ];

  const filteredSpotlightOptions = spotlightOptions.filter((item) =>
    item.text.toLowerCase().includes(spotlightInput.toLowerCase())
  );

  const selectSpotlightItem = (item: typeof spotlightOptions[0]) => {
    setSpotlightOpen(false);
    router.push(item.target);
    showToast(`Navigated to ${item.text}`, 'success');
  };

  // Public, unauthenticated share pages render standalone — no login gate,
  // no app shell/sidebar, no mount-loading spinner.
  if (isPublicSharePage) {
    return <>{children}</>;
  }

  if (authHashRedirecting) {
    return <div style={{ minHeight: '100vh', background: '#F3F6F2' }} />;
  }

  if (!hasMounted) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#F3F6F2', color: '#0C3E33', fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="animate-spin" style={{ width: '32px', height: '32px', border: '3px solid var(--blue)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 16px' }}></div>
          <p style={{ fontSize: '14px', color: 'rgba(12,62,51,0.7)' }}>Loading Happilo Growth OS...</p>
        </div>
      </div>
    );
  }

  return (
    <AppContext.Provider
      value={{
        isLoggedIn,
        setIsLoggedIn,
        dateFilter,
        setDateFilter,
        dateRange,
        setDateRange,
        dateLabel,
        setDateLabel,
        toasts,
        showToast,
        spotlightOpen,
        setSpotlightOpen,
        inspectorOpen,
        setInspectorOpen,
        inspectorType,
        setInspectorType,
        inspectorData,
        setInspectorData,
        inventory,
        setInventory,
        supportCases,
        setSupportCases,
        reviews,
        setReviews,
        receivables,
        setReceivables,
        b2bLeads,
        setB2bLeads,
        contentDrafts,
        setContentDrafts,
        whatsappAlerts,
        setWhatsappAlerts
      }}
    >
      <div className="app-container">
        {/* Apple Glass Glows */}
        <div className="ambient-glow bg-glow-1"></div>
        <div className="ambient-glow bg-glow-2"></div>
        <div className="ambient-glow bg-glow-3"></div>

        {/* Global Toast Alerts */}
        <div
          id="toast-container"
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            zIndex: 99999,
          }}
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`toast-notif liquid-card-sm`}
              style={{
                boxShadow: 'var(--glass-shadow)',
                backdropFilter: 'blur(20px)',
                background: 'var(--glass-fill)',
                outline: '1.5px solid var(--glass-border)',
                color: 'var(--label-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 18px',
                borderRadius: '12px',
                animation: 'fadeIn 300ms ease',
              }}
            >
              {t.type === 'success' && <CheckCircle2 size={16} className="status-success-icon" style={{ color: 'var(--green)' }} />}
              {t.type === 'error' && <AlertTriangle size={16} style={{ color: 'var(--red)' }} />}
              {t.type === 'info' && <Info size={16} style={{ color: 'var(--blue)' }} />}
              <span style={{ fontSize: '13px', fontWeight: '500' }}>{t.message}</span>
            </div>
          ))}
        </div>

        {isLoggedIn ? (
          <>
            {mobileSidebarOpen && (
              <div className="mobile-sidebar-overlay" onClick={() => setMobileSidebarOpen(false)}></div>
            )}
            
            {/* Sidebar */}
            <aside className={`sidebar ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
              <div className="sidebar-brand">
                <Link href="/master" style={{ display: 'flex', alignItems: 'center' }}>
                  <img src="/brand/happilo-logo-green.png" alt="Happilo" style={{ height: '30px', width: 'auto', display: 'block' }} />
                </Link>
                <span className="sidebar-brand-tag">Growth OS</span>
              </div>

              <nav className="sidebar-nav">
                {NAV.map((area) => (
                  <div key={area.label} className="nav-area">
                    <div className="nav-section-label">{area.label}</div>

                    {(area.links ?? []).map((link) => {
                      const LinkIcon = link.icon;
                      return (
                        <Link key={link.href} href={link.href} className={`nav-item ${pathIn(pathname, link.href) ? 'active' : ''}`}>
                          <LinkIcon size={16} />
                          <span>{link.label}</span>
                        </Link>
                      );
                    })}

                    {(area.modules ?? []).map((mod) => {
                      const ModIcon = mod.icon;
                      const inModule = mod.prefix.some((p) => pathIn(pathname, p));
                      const expanded = openModules[mod.id] ?? inModule;
                      return (
                        <div key={mod.id} className={`nav-module ${inModule ? 'in-module' : ''}`}>
                          <button
                            type="button"
                            className="nav-item nav-module-toggle"
                            onClick={() => setOpenModules((m) => ({ ...m, [mod.id]: !expanded }))}
                            aria-expanded={expanded}
                          >
                            <ModIcon size={16} />
                            <span>{mod.label}</span>
                            <ChevronDown size={14} className="nav-chevron" style={{ transform: expanded ? 'rotate(180deg)' : 'none' }} />
                          </button>
                          {expanded && (
                            <div className="nav-module-links">
                              {mod.links.map((link) => {
                                const LinkIcon = link.icon;
                                const inLink = pathIn(pathname, link.match ?? link.href);
                                return (
                                  <React.Fragment key={link.href}>
                                    <Link href={link.href} className={`nav-item nav-sub ${inLink && !link.children ? 'active' : ''} ${inLink && link.children ? 'open' : ''}`}>
                                      <LinkIcon size={15} />
                                      <span>{link.label}</span>
                                    </Link>
                                    {inLink && link.children && (
                                      <div className="nav-leaves">
                                        {link.children.map((c) => (
                                          <Link key={c.href} href={c.href} className={`nav-leaf ${pathname === c.href ? 'active' : ''}`}>
                                            {c.label}
                                          </Link>
                                        ))}
                                      </div>
                                    )}
                                  </React.Fragment>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </nav>

              <div className="sidebar-footer">
                <div className="user-profile">
                  <div className="avatar">
                    <span>{initialsFromName(currentUser?.name || currentUser?.email || 'User')}</span>
                    <div className="status-indicator online"></div>
                  </div>
                  <div className="user-details">
                    <span className="user-name">{currentUser?.name || currentUser?.email || 'Signed in'}</span>
                    <span className="user-role">{currentUser?.email || 'Operator'}</span>
                  </div>
                  <button
                    className="btn-icon"
                    onClick={() => {
                      setIsLoggedIn(false);
                      setSessionExpiredNotice(false);
                      localStorage.removeItem('loginAt');
                      localStorage.removeItem('authToken');
                      localStorage.removeItem('sessionExpired');
                      fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
                      router.push('/');
                      showToast('Logged out of Happilo Growth OS.', 'info');
                    }}
                    title="Log out"
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--label-secondary)' }}
                  >
                    <LogOut size={14} />
                  </button>
                </div>
                <div className="sidebar-meta">Happilo International Pvt Ltd · FSSAI 11222999000365</div>
              </div>
            </aside>

            {/* Main Workspace */}
            <div className="main-workspace">
              <header className="app-header">
                <div className="header-left">
                  <button
                    className="menu-toggle-btn"
                    onClick={() => setMobileSidebarOpen((prev) => !prev)}
                    title="Toggle Navigation"
                    style={{ background: 'transparent', border: 'none', color: 'var(--label-primary)', cursor: 'pointer' }}
                  >
                    <Menu size={18} />
                  </button>
                  <div className="navigation-controls" style={{ display: 'flex', gap: '6px' }}>
                    <button className="nav-ctrl-btn" onClick={goBack} title="Back" style={{ border: 'none', background: 'transparent', color: 'var(--label-secondary)' }}><ChevronLeft size={16} /></button>
                    <button className="nav-ctrl-btn" onClick={goForward} title="Forward" style={{ border: 'none', background: 'transparent', color: 'var(--label-secondary)' }}><ChevronRight size={16} /></button>
                  </div>
                  <div className="breadcrumb" style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    {crumbs.map((c, idx) => (
                      <React.Fragment key={idx}>
                        {idx > 0 && <span className="breadcrumb-separator">/</span>}
                        <span className={idx === crumbs.length - 1 ? 'breadcrumb-active' : 'breadcrumb-parent'} style={idx === crumbs.length - 1 ? { fontWeight: 600, textTransform: 'capitalize' } : undefined}>{c}</span>
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                <div className="header-center">
                  <div
                    className="search-spotlight-trigger"
                    onClick={() => setSpotlightOpen(true)}
                    style={{ cursor: 'pointer' }}
                  >
                    <Search size={14} />
                    <span>Search modules... (⌘K)</span>
                  </div>
                </div>

                <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {canManageOutreachSettings && (
                    <button
                      className="btn-icon"
                      onClick={() => setOutreachModalOpen(true)}
                      title="Outreach Sequence Generator"
                      style={{ background: 'transparent', border: 'none', color: 'var(--label-tertiary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      <SettingsIcon size={16} />
                    </button>
                  )}
                  <DateRangePicker
                    value={dateRange}
                    label={dateLabel}
                    onUpdate={({ range, label }) => {
                      setDateRange(range);
                      setDateLabel(label);
                    }}
                  />
                </div>
              </header>

              <main className="content-body" style={{ position: 'relative', overflowY: 'auto' }}>
                {children}
              </main>
            </div>
            {canManageOutreachSettings && (
              <OutreachSequenceModal isOpen={outreachModalOpen} onClose={() => setOutreachModalOpen(false)} />
            )}
          </>
        ) : (
          /* Happilo light landing + sign-in */
          <div className="landing-container" style={{ width: '100vw', minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F7FAF6', overflowY: 'auto', position: 'relative', color: '#1B2B24' }}>
            <header style={{ background: '#fff', borderBottom: '1px solid #E3EBE4', position: 'sticky', top: 0, left: 0, width: '100%', maxWidth: 'none', transform: 'none', margin: 0, padding: 0, zIndex: 10 }}>
              <div style={{ maxWidth: '1180px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <img src="/brand/happilo-logo-green.png" alt="Happilo" style={{ height: '40px', width: 'auto', display: 'block' }} />
                  <span style={{ width: '1px', height: '26px', background: '#D5E0D8' }} />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#00523B', letterSpacing: '0.02em' }}>Growth OS</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '22px' }}>
                  <span className="landing-nav-links-desktop" style={{ fontSize: '12.5px', color: '#5B6B63' }}>Premium nutrition, Deliciously yours.</span>
                  <a href="#login" style={{ background: '#00523B', color: '#fff', padding: '9px 22px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>Sign In</a>
                </div>
              </div>
            </header>

            <main style={{ maxWidth: '1180px', margin: '0 auto', width: '100%', padding: '56px 24px 40px', flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '56px' }}>
              <div className="landing-hero-grid" style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: '56px', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                  <span style={{ display: 'inline-block', width: 'fit-content', background: '#FFF3C4', color: '#7A5A00', padding: '6px 14px', borderRadius: '999px', fontSize: '11.5px', fontWeight: 700, letterSpacing: '0.04em' }}>Kholo, Khalo, Happilo!</span>
                  <h1 style={{ fontSize: '40px', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.02em', color: '#0C3E33', margin: 0 }}>
                    One place to run stock, sales and service for <span style={{ color: '#00523B', borderBottom: '4px solid #F9C200' }}>Happilo</span>
                  </h1>
                  <p style={{ fontSize: '15.5px', lineHeight: 1.65, color: '#4A5A52', margin: 0, maxWidth: '560px' }}>
                    Track stock across the Bengaluru warehouse, happilo.com, Amazon, Flipkart and quick-commerce, answer customers faster, chase distributor dues and grow bulk and gifting orders — all from one board.
                  </p>
                  <div style={{ display: 'flex', gap: '28px', marginTop: '6px', flexWrap: 'wrap' }}>
                    {[['10M+', 'happy munchers'], ['15+', 'countries'], ['2010', 'founded in Bengaluru']].map(([a, b]) => (
                      <div key={b}>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: '#00523B' }}>{a}</div>
                        <div style={{ fontSize: '11.5px', color: '#6A7A72', marginTop: '2px' }}>{b}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                    {['happilo.com', 'Amazon', 'Flipkart', 'Blinkit', 'Zepto', 'Instamart', 'BigBasket'].map((c) => (
                      <span key={c} style={{ fontSize: '11.5px', padding: '5px 12px', borderRadius: '999px', background: '#fff', border: '1px solid #D5E0D8', color: '#0C3E33', fontWeight: 600 }}>{c}</span>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <div id="login" style={{ width: '100%', maxWidth: '410px', background: '#fff', border: '1px solid #DDE8DF', borderRadius: '18px', padding: '32px', boxShadow: '0 18px 44px rgba(0,82,59,0.10)', scrollMarginTop: '90px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '22px' }}>
                      <img src="/brand/happilo-logo-green.png" alt="Happilo" style={{ height: '52px', width: 'auto', margin: '0 auto 14px', display: 'block' }} />
                      <h2 style={{ fontSize: '19px', fontWeight: 800, color: '#0C3E33', margin: 0 }}>Sign in to Growth OS</h2>
                      <p style={{ fontSize: '12.5px', color: '#6A7A72', marginTop: '6px' }}>Use your Happilo team account.</p>
                    </div>

                    {sessionExpiredNotice && (
                      <div style={{ background: '#FFF6DC', border: '1px solid #F2D58A', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', fontSize: '12px', color: '#7A5A00', textAlign: 'center' }}>
                        Your session expired after 30 minutes. Please sign in again.
                      </div>
                    )}

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!loginBusy) doLogin();
                      }}
                      style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
                    >
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#4A5A52', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</label>
                        <input
                          type="email"
                          autoComplete="username"
                          placeholder="you@happilo.com"
                          value={loginEmail}
                          onChange={(e) => { setLoginEmail(e.target.value); setLoginError(null); }}
                          style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #CFDCD3', outline: 'none', fontSize: '13.5px', background: '#fff', color: '#1B2B24' }}
                          required
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#4A5A52', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type={showLoginPassword ? 'text' : 'password'}
                            autoComplete="current-password"
                            placeholder="••••••••"
                            value={loginPassword}
                            onChange={(e) => { setLoginPassword(e.target.value); setLoginError(null); }}
                            style={{ width: '100%', padding: '12px 42px 12px 14px', borderRadius: '10px', border: '1px solid #CFDCD3', outline: 'none', fontSize: '13.5px', background: '#fff', color: '#1B2B24' }}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowLoginPassword((v) => !v)}
                            aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                            title={showLoginPassword ? 'Hide password' : 'Show password'}
                            style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: '#6A7A72', display: 'flex', alignItems: 'center', padding: '4px' }}
                          >
                            {showLoginPassword ? <EyeOff size={18} strokeWidth={2.2} /> : <Eye size={18} strokeWidth={2.2} />}
                          </button>
                        </div>
                      </div>

                      {loginError && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#FDECEA', border: '1px solid #F5C2BD', padding: '10px 12px', borderRadius: '10px' }}>
                          <AlertTriangle size={14} style={{ color: 'var(--red)', flexShrink: 0 }} />
                          <span style={{ fontSize: '11.5px', color: '#B3261E', lineHeight: 1.3 }}>{loginError}</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={loginBusy}
                        style={{ padding: '13px', borderRadius: '10px', border: 'none', background: '#00523B', color: '#fff', fontWeight: 700, cursor: loginBusy ? 'wait' : 'pointer', fontSize: '14px', opacity: loginBusy ? 0.7 : 1 }}
                      >
                        {loginBusy ? 'Signing in…' : 'Sign In'}
                      </button>
                    </form>

                    <div style={{ marginTop: '18px', padding: '12px 14px', borderRadius: '10px', background: '#F1F7F2', border: '1px dashed #B9D3C0', fontSize: '12px', color: '#3C4F46' }}>
                      <div style={{ fontWeight: 700, color: '#0C3E33', marginBottom: '4px' }}>Demo access</div>
                      <div>admin@happilo.com &nbsp;·&nbsp; happilo@123</div>
                      <button
                        type="button"
                        onClick={() => { setLoginEmail('admin@happilo.com'); setLoginPassword('happilo@123'); setLoginError(null); }}
                        style={{ marginTop: '8px', background: 'none', border: 'none', padding: 0, color: '#00523B', fontWeight: 700, fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        Fill these in
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#348A5C', textTransform: 'uppercase', letterSpacing: '0.15em' }}>What&apos;s inside</span>
                  <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0C3E33', marginTop: '6px' }}>Everything the Happilo team works with, in one place</h2>
                </div>
                <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px' }}>
                  {[
                    [Package, 'Inventory Management', 'SKU-level stock across the warehouse, happilo.com, marketplaces and dark stores, with days-of-cover, reorder points, batch expiry and purchase orders.'],
                    [Bot, 'Customer Care & Reviews', 'One inbox for website, WhatsApp and Instagram queries, order tracking updates and a review desk for Google, Amazon and BigBasket.'],
                    [DollarSign, 'Receivables Recovery', 'Distributor and retail-partner ledgers, ageing, and reminders over WhatsApp, email and voice.'],
                    [Users, 'B2B Bulk & Gifting CRM', 'Retailers, corporate gifting houses, hotels and distributors from first outreach to first purchase order.'],
                    [Sparkles, 'Content & Campaigns', 'Calendar, UGC scripts and approvals for Diwali gifting, snacking and everyday nutrition campaigns.'],
                    [Activity, 'Master Dashboard', 'Sales, stock health, support load and pipeline in a single daily view for the leadership team.'],
                  ].map(([Icon, title, body]: any) => (
                    <div key={title} style={{ background: '#fff', border: '1px solid #E1EAE3', borderRadius: '14px', padding: '22px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ background: '#E3F1E8', color: '#00523B', width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={18} /></div>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0C3E33', margin: 0 }}>{title}</h3>
                      <p style={{ fontSize: '12.5px', color: '#5B6B63', lineHeight: 1.55, margin: 0 }}>{body}</p>
                    </div>
                  ))}
                </div>
              </div>
            </main>

            <footer style={{ background: '#00523B', padding: '28px 24px', marginTop: 'auto' }}>
              <div style={{ maxWidth: '1180px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <img src="/brand/happilo-logo-white.png" alt="Happilo" style={{ height: '34px', width: 'auto' }} />
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)' }}>&copy; 2026 Happilo International Pvt Ltd &nbsp;·&nbsp; FSSAI Lic. No. 11222999000365 &nbsp;·&nbsp; care@happilo.com &nbsp;·&nbsp; +91 88844 84000</span>
              </div>
            </footer>
          </div>
        )}

        {/* Global Search Spotlight Modal */}
        {spotlightOpen && (
          <div className="spotlight-overlay" style={{ display: 'flex' }} onClick={() => setSpotlightOpen(false)}>
            <div className="spotlight-panel" onClick={(e) => e.stopPropagation()}>
              <div className="spotlight-header">
                <Search size={18} />
                <input
                  type="text"
                  className="spotlight-input"
                  value={spotlightInput}
                  onChange={(e) => setSpotlightInput(e.target.value)}
                  placeholder="Type navigations (e.g. inventory, care, leads)..."
                  autoFocus
                />
              </div>
              <div className="spotlight-results">
                {filteredSpotlightOptions.length === 0 ? (
                  <div style={{ padding: '16px', fontSize: '13px', color: 'var(--label-tertiary)' }}>No matching modules found.</div>
                ) : (
                  filteredSpotlightOptions.map((item, index) => (
                    <div
                      key={index}
                      className={`spotlight-item ${index === spotlightSelectedIndex ? 'selected' : ''}`}
                      onClick={() => selectSpotlightItem(item)}
                    >
                      <div className="spotlight-item-left">
                        <LayoutDashboard size={14} />
                        <span>{item.text}</span>
                      </div>
                      <span className="spotlight-shortcut">{item.shortcut}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="spotlight-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Use <kbd>ESC</kbd> to close, <kbd>Click</kbd> to select option</span>
                <span style={{ fontSize: '9.5px', color: 'var(--label-tertiary)' }}>Happilo Growth OS</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppContext.Provider>
  );
}
