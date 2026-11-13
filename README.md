# Happilo Growth OS

Internal growth operating system for **Happilo** (happilo.com) — premium nuts, dry fruits, trail mixes, makhana and healthy snacks.

> "Premium nutrition, deliciously yours." · "Kholo, Khalo, Happilo!"

## Modules

| Module | Route | What it covers |
| --- | --- | --- |
| Master Dashboard | `/master` | All channels combined |
| Executive Board | `/dashboard` | Founder command centre |
| Inventory Intel | `/inventory` | Happilo SKUs across Bengaluru warehouse, happilo.com, Amazon, Blinkit, Zepto, Instamart, BigBasket, Flipkart |
| Customer Care | `/customer-care` | Support inbox, order lifecycle, consumer reviews |
| Content OS | `/marketing` | Campaign calendar, UGC scripts, maker-checker review |
| B2B CRM | `/b2b-crm/*` | Bulk, gifting & distributor leads — WhatsApp, email and voice outreach |
| Receivables Recovery | `/accounts-receivable/*` | Distributor / retail-partner dues, reminders and collections |

## Demo mode (no backend)

This build is **not connected to any database or webhook**. Every module reads from a deterministic
in-memory dummy dataset in [`src/lib/mock`](src/lib/mock):

- `b2bLeads.ts` — B2B leads, WhatsApp / email logs, outreach sequences, voice calls
- `receivables.ts` — party ledger + recovery outreach

Sign in with **admin@happilo.com / happilo@123** (accounts live in [`src/lib/demoUsers.ts`](src/lib/demoUsers.ts)).
Marking a lead Won/Lost works against the in-memory store and resets on server restart.

## Brand

Palette: deep green `#00523B` · dark green `#0C3E33` · mid green `#348A5C` · almond gold `#F2A71B` · yellow `#F9C200`.
Typeface: Montserrat (closest free match to Happilo's Gotham). Logo: `public/logo.png`.

## Develop

```bash
npm install
npm run dev
```
