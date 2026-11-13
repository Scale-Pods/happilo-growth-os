/** Happilo marketing — calendar, creators and campaign analytics (dummy data). */
import { CATALOG } from './catalog';

/** Product thumbnail lookup by (part of) the catalogue name. Falls back to the Happilo mark. */
export function productImage(namePart: string): string {
  const q = namePart.toLowerCase();
  const hit = CATALOG.find((c) => c.name.toLowerCase().includes(q) || q.includes(c.name.toLowerCase()));
  return hit?.image ?? '/brand/happilo-mark.png';
}

// ─── Calendar ────────────────────────────────────────────────────────────────

export type CalPlatform = 'Instagram' | 'YouTube' | 'Meta Ads' | 'Pinterest' | 'LinkedIn' | 'WhatsApp';

export interface CalendarPost {
  id: string;
  date: string; // YYYY-MM-DD
  platform: CalPlatform;
  title: string;
  time: string;
  status: 'Published' | 'Scheduled' | 'Planned';
  img: string;
  description: string;
  draftId?: string;
}

const p = (
  id: string,
  date: string,
  platform: CalPlatform,
  title: string,
  time: string,
  status: CalendarPost['status'],
  product: string,
  description: string,
  draftId?: string,
): CalendarPost => ({ id, date, platform, title, time, status, img: productImage(product), description, draftId });

export const INITIAL_CALENDAR_POSTS: CalendarPost[] = [
  // November, already out
  p('cal-1', '2026-11-02', 'Instagram', 'Diwali gift picks under ₹499', '11:00 AM', 'Published', 'Dried Californian Whole Cranberries', 'Carousel of five gift picks under ₹499, ending with the gift bag add-on at checkout.'),
  p('cal-2', '2026-11-03', 'WhatsApp', 'Diwali last order dates', '10:00 AM', 'Published', 'Premium Whole Cashew Nuts', 'Broadcast to the opted-in list with the last dates for delivery before Diwali, by pin code zone.'),
  p('cal-3', '2026-11-04', 'Instagram', 'Diwali gift box unboxing', '11:00 AM', 'Published', 'Premium Nutritious Nutty Trail Mix', 'Creator reel, gift box opened next to diyas. Gift boxes from ₹499.', 'c-14'),
  p('cal-4', '2026-11-05', 'Pinterest', 'Dates for winter board', '04:00 PM', 'Published', 'International King Medjoul Dates', 'Six pins on Medjoul, Kimia and Ajwa dates: pairings, gifting and quick recipes.'),
  p('cal-5', '2026-11-06', 'Meta Ads', 'The ₹1 deal collection', '09:00 AM', 'Published', 'Premium Fox Nuts', 'Static ad pointing to the ₹1 deal collection on happilo.com.', 'c-15'),
  p('cal-6', '2026-11-07', 'YouTube', 'Whole cashews vs pieces', '06:00 PM', 'Published', 'Jumbo Premium Whole Cashew Nuts', 'Short on how to read a cashew grade. Premium Whole Cashews 200g at ₹336.', 'c-16'),
  p('cal-7', '2026-11-08', 'Instagram', 'Happy Diwali from Happilo', '08:00 AM', 'Published', 'Premium International Sports Mix', 'Festival greeting, plain card with the brand line "Premium nutrition, Deliciously yours."'),
  p('cal-8', '2026-11-10', 'Instagram', 'Bhai Dooj gift idea', '12:00 PM', 'Published', 'International Ajwa Dates', 'Story and reel for Bhai Dooj. Ajwa dates 500g and the ₹500-999 gift boxes.'),
  p('cal-9', '2026-11-12', 'LinkedIn', 'Packing notes from the Diwali rush', '10:00 AM', 'Published', 'Dry Fruits Combo 850g', 'Short note from the Bengaluru team on packing and dispatch during the festive weeks.'),
  // today and upcoming
  p('cal-10', '2026-11-13', 'Instagram', 'Peri Peri makhana reaction', '06:00 PM', 'Scheduled', 'Peri Peri Makhana', 'Creator reaction reel. Peri Peri Makhana 55g, ₹102.'),
  p('cal-11', '2026-11-16', 'WhatsApp', 'Dates for winter', '11:30 AM', 'Scheduled', 'Premium Fard Dates', 'Broadcast with three dates picks and the dates collection link.', 'c-12'),
  p('cal-12', '2026-11-18', 'Instagram', 'Walnut crack with free nut cracker', '12:00 PM', 'Planned', 'California Inshell Walnuts', 'ASMR crack reel. Inshell walnuts 200g at ₹200, cracker included.', 'c-1'),
  p('cal-13', '2026-11-19', 'YouTube', 'Ajwa, Medjoul or Kimia', '06:00 PM', 'Planned', 'International Ajwa Dates', 'Dates comparison short.', 'c-2'),
  p('cal-14', '2026-11-20', 'Meta Ads', 'Christmas gift boxes launch', '10:00 AM', 'Scheduled', 'Dry Fruits Combo 850g', 'Gift boxes ₹500-999, carousel and static set.', 'c-11'),
  p('cal-15', '2026-11-22', 'Pinterest', 'Date and walnut energy bites', '04:00 PM', 'Planned', 'Premium Fard Dates', 'Recipe pin, vertical image.', 'c-8'),
  p('cal-16', '2026-11-24', 'Instagram', 'Super Mom lunchbox routine', '03:00 PM', 'Planned', 'Super Mom', 'Creator reel with Meghna Iyer.', 'c-5'),
  p('cal-17', '2026-11-26', 'LinkedIn', 'Year-end corporate gifting', '10:00 AM', 'Planned', 'Dry Fruits Combo 850g', 'Bulk gifting post, quote form linked.', 'c-7'),
  p('cal-18', '2026-11-27', 'Meta Ads', 'Black Friday: nuts combo weekend', '09:00 AM', 'Planned', 'Popular Nuts Combo', 'Popular Nuts Combo 800g at ₹1,279, weekend only creative.', 'c-6'),
  p('cal-19', '2026-11-30', 'WhatsApp', 'Month-end winter snacking', '05:00 PM', 'Planned', 'Daily Super Health Mix', 'Broadcast: Daily Super Health Mix 160g, ₹238, and makhana packs.'),
  // December
  p('cal-20', '2026-12-01', 'Meta Ads', 'Christmas gifting, all budgets', '10:00 AM', 'Planned', 'Dry Fruits Combo 850g', 'Gift box ladder creative, four budget bands.'),
  p('cal-21', '2026-12-03', 'Instagram', 'Gym bag seeds', '12:00 PM', 'Planned', 'Raw Pumpkin Seeds', 'Protein Power reel with Rohit Menon.', 'c-13'),
  p('cal-22', '2026-12-05', 'YouTube', 'Makhana taste test', '06:00 PM', 'Planned', 'Cream & Onion Makhana', 'Three flavours ranked, under 40 seconds.', 'c-10'),
  p('cal-23', '2026-12-08', 'Pinterest', 'Christmas hamper ideas', '04:00 PM', 'Planned', 'Premium Californian Almonds', 'Board of hamper layouts using Happilo packs.'),
  p('cal-24', '2026-12-10', 'WhatsApp', 'Winter offer for repeat customers', '11:00 AM', 'Planned', 'Super Soft Kimia Dates', 'Repeat-buyer broadcast, dates and walnut kernels.'),
  p('cal-25', '2026-12-12', 'Instagram', 'Pick Your Mood', '01:00 PM', 'Planned', 'Premium Nutritious Nutty Trail Mix', 'Mood-led reel, salty, sweet, spicy, unsalted.', 'c-9'),
  p('cal-26', '2026-12-15', 'LinkedIn', 'Gifting for teams', '10:00 AM', 'Planned', 'Classic Panchmewa', 'Reminder post for bulk orders before the holiday week.'),
  p('cal-27', '2026-12-18', 'Instagram', 'Add a gift bag at checkout', '12:00 PM', 'Planned', 'Super Mom', 'Short demo of the gift bag option at checkout.'),
  p('cal-28', '2026-12-22', 'WhatsApp', 'Christmas last order dates', '10:00 AM', 'Planned', 'Premium Nutritious Nutty Trail Mix', 'Last order dates by zone.'),
  p('cal-29', '2026-12-25', 'Instagram', 'Merry Christmas', '09:00 AM', 'Planned', 'Premium International Sports Mix', 'Greeting card post.'),
  p('cal-30', '2026-12-29', 'Meta Ads', 'New Year, new snack habit', '10:00 AM', 'Planned', 'Daily Super Health Mix', 'Healthy snacking creative for the first week of January.'),
  p('cal-31', '2026-12-31', 'Instagram', 'Healthy Snacking, starts here', '06:00 PM', 'Planned', 'Premium Nutritious Nutty Trail Mix', 'Year-end note, plain text card.'),
];

// ─── Creators ────────────────────────────────────────────────────────────────

export type CreatorStatus = 'Active' | 'Brief sent' | 'Negotiating' | 'Shoot scheduled' | 'Content delivered' | 'On hold';

export interface Creator {
  id: string;
  name: string;
  handle: string;
  city: string;
  niche: string;
  followers: number;
  engagement: number; // percent
  ratePerReel: number; // INR
  status: CreatorStatus;
  lastCampaign: string;
  next: string;
}

export const INITIAL_CREATORS: Creator[] = [
  { id: 'cr-1', name: 'Meghna Iyer', handle: '@meghna.mom.diaries', city: 'Bengaluru', niche: 'Parenting, lunchbox ideas', followers: 86400, engagement: 5.8, ratePerReel: 18000, status: 'Shoot scheduled', lastCampaign: 'Back to School 2026', next: 'Super Mom lunchbox reel, shoot 17 Nov' },
  { id: 'cr-2', name: 'Rohit Menon', handle: '@rohit.lifts.daily', city: 'Kochi', niche: 'Fitness, protein snacks', followers: 142000, engagement: 4.2, ratePerReel: 30000, status: 'Brief sent', lastCampaign: 'Protein Power', next: 'Gym bag seeds reel, draft due 24 Nov' },
  { id: 'cr-3', name: 'Ananya Rao', handle: '@ananya.eats.blr', city: 'Bengaluru', niche: 'Food, home cooking', followers: 54700, engagement: 7.1, ratePerReel: 12000, status: 'Active', lastCampaign: 'Diwali Gifting 2026', next: 'Date and walnut bites, winter recipes' },
  { id: 'cr-4', name: 'Karthik Subramanian', handle: '@karthik.kitchen', city: 'Chennai', niche: 'South Indian home food', followers: 38200, engagement: 6.4, ratePerReel: 8500, status: 'Content delivered', lastCampaign: 'Dates for Winter', next: 'Awaiting approval of 2 reels' },
  { id: 'cr-5', name: 'Pooja Deshmukh', handle: '@pooja.plates', city: 'Pune', niche: 'Healthy tiffins, vegetarian', followers: 97300, engagement: 4.9, ratePerReel: 22000, status: 'Negotiating', lastCampaign: '-', next: 'Rate call on 15 Nov, asking for 26,000' },
  { id: 'cr-6', name: 'Aman Khurana', handle: '@aman.office.eats', city: 'Gurugram', niche: 'Office life, snack hauls', followers: 63800, engagement: 5.2, ratePerReel: 15000, status: 'Active', lastCampaign: 'Winter Snacking', next: 'Corporate gifting skit, December' },
  { id: 'cr-7', name: 'Nisha Patel', handle: '@nisha.gifts.co', city: 'Ahmedabad', niche: 'Gifting, festive hampers', followers: 71500, engagement: 6.0, ratePerReel: 16000, status: 'Content delivered', lastCampaign: 'Diwali Gifting 2026', next: 'Christmas hamper reel, brief pending' },
  { id: 'cr-8', name: 'Tanvi Joshi', handle: '@tanvi.snacks.daily', city: 'Mumbai', niche: 'Snacks, quick reviews', followers: 29400, engagement: 8.3, ratePerReel: 6000, status: 'Active', lastCampaign: 'Makhana Munch', next: 'Makhana flavour ranking' },
  { id: 'cr-9', name: 'Faizan Qureshi', handle: '@faizan.eats.hyd', city: 'Hyderabad', niche: 'Food, Ramadan content', followers: 118000, engagement: 3.8, ratePerReel: 26000, status: 'On hold', lastCampaign: 'Dates for Winter', next: 'Revisit in February for Ramadan dates' },
  { id: 'cr-10', name: 'Divya Nambiar', handle: '@divya.balanced.bites', city: 'Bengaluru', niche: 'Nutrition, desk snacks', followers: 45600, engagement: 6.9, ratePerReel: 10000, status: 'Brief sent', lastCampaign: '-', next: 'Trial order shipped 11 Nov' },
];

// ─── Analytics ───────────────────────────────────────────────────────────────

export const ANALYTICS_PERIOD = '14 Oct – 13 Nov 2026';

export interface ChannelStat {
  channel: string;
  reach: number; // reach / impressions
  engagement: number; // percent
  ctr: number; // percent
  spend: number; // INR
  orders: number;
  aov: number;
}

export const CHANNEL_STATS: ChannelStat[] = [
  { channel: 'Instagram', reach: 842300, engagement: 5.1, ctr: 1.3, spend: 185000, orders: 1126, aov: 748 },
  { channel: 'YouTube', reach: 316800, engagement: 3.8, ctr: 0.9, spend: 62000, orders: 288, aov: 702 },
  { channel: 'Meta Ads', reach: 1470500, engagement: 2.2, ctr: 1.74, spend: 540000, orders: 2964, aov: 689 },
  { channel: 'Google', reach: 912000, engagement: 0, ctr: 3.1, spend: 310000, orders: 1402, aov: 731 },
];

export interface CampaignStat {
  name: string;
  status: 'Live' | 'Ended' | 'Scheduled';
  window: string;
  channels: string;
  spend: number;
  reach: number;
  ctr: number;
  orders: number;
  aov: number;
}

export const CAMPAIGN_STATS: CampaignStat[] = [
  { name: 'Diwali Gifting 2026', status: 'Ended', window: '12 Oct – 9 Nov', channels: 'Meta, Instagram, Google', spend: 612000, reach: 1980000, ctr: 1.9, orders: 3422, aov: 842 },
  { name: 'Winter Snacking', status: 'Live', window: 'from 1 Nov', channels: 'Instagram, YouTube', spend: 148000, reach: 436000, ctr: 1.2, orders: 612, aov: 604 },
  { name: 'Protein Power', status: 'Live', window: 'from 26 Oct', channels: 'Meta, Instagram', spend: 96000, reach: 318000, ctr: 1.5, orders: 531, aov: 716 },
  { name: 'Makhana Munch', status: 'Live', window: 'from 20 Oct', channels: 'Instagram, YouTube', spend: 58000, reach: 294000, ctr: 2.1, orders: 774, aov: 312 },
  { name: 'Dates for Winter', status: 'Live', window: 'from 5 Nov', channels: 'Meta, WhatsApp', spend: 74000, reach: 241000, ctr: 1.6, orders: 398, aov: 668 },
  { name: 'Christmas Gifting', status: 'Scheduled', window: '20 Nov – 24 Dec', channels: 'Meta, Google, Instagram', spend: 0, reach: 0, ctr: 0, orders: 0, aov: 0 },
];

export interface TopPost {
  title: string;
  platform: CalPlatform;
  date: string;
  product: string;
  reach: number;
  engagement: number;
  clicks: number;
  orders: number;
}

export const TOP_POSTS: TopPost[] = [
  { title: 'Diwali gift box unboxing', platform: 'Instagram', date: '4 Nov', product: 'Premium Nutritious Nutty Trail Mix', reach: 214300, engagement: 6.8, clicks: 4120, orders: 318 },
  { title: 'Peri Peri vs Cream & Onion makhana', platform: 'Instagram', date: '27 Oct', product: 'Peri Peri Makhana', reach: 168900, engagement: 8.4, clicks: 3560, orders: 412 },
  { title: 'Whole cashews vs pieces', platform: 'YouTube', date: '7 Nov', product: 'Jumbo Premium Whole Cashew Nuts', reach: 96200, engagement: 4.6, clicks: 1180, orders: 74 },
  { title: 'The ₹1 deal collection', platform: 'Meta Ads', date: '6 Nov', product: 'Premium Fox Nuts', reach: 402000, engagement: 1.9, clicks: 7340, orders: 541 },
  { title: 'Walnut crack, free nut cracker', platform: 'Instagram', date: '19 Oct', product: 'California Inshell Walnuts', reach: 131500, engagement: 7.2, clicks: 2890, orders: 263 },
  { title: 'Dates for winter board', platform: 'Pinterest', date: '5 Nov', product: 'International King Medjoul Dates', reach: 38400, engagement: 2.7, clicks: 910, orders: 52 },
  { title: 'Gift boxes ₹500-999 carousel', platform: 'Meta Ads', date: '30 Oct', product: 'Dry Fruits Combo 850g', reach: 356800, engagement: 2.4, clicks: 6020, orders: 487 },
  { title: 'Bhai Dooj gift idea', platform: 'Instagram', date: '10 Nov', product: 'International Ajwa Dates', reach: 74100, engagement: 5.5, clicks: 1330, orders: 96 },
];

export const WEEKLY_REACH = [
  { week: '14 Oct', reach: 612000 },
  { week: '21 Oct', reach: 868000 },
  { week: '28 Oct', reach: 1094000 },
  { week: '4 Nov', reach: 1246000 },
  { week: '11 Nov', reach: 818000 },
];

export const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');
export const compact = (n: number) =>
  n >= 10000000 ? (n / 10000000).toFixed(2) + ' Cr' : n >= 100000 ? (n / 100000).toFixed(2) + ' L' : n >= 1000 ? (n / 1000).toFixed(1) + 'K' : String(n);
