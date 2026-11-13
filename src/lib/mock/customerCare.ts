/** Happilo customer care — support cases and consumer reviews (dummy data). */

export interface SupportThread {
  sender: string; // 'customer' | 'agent' | 'ai' | 'founder-user'
  msg: string;
  time: string;
  by?: string; // agent first name
}

export type CasePriority = 'Urgent' | 'High' | 'Normal' | 'Low';

export interface SupportCase {
  id: string;
  customer: string;
  channel: string;
  msg: string;
  status: string; // Open | Pending | Resolved
  escalation: string;
  time: string;
  thread: SupportThread[];
  // optional detail fields
  orderId?: string;
  product?: string;
  city?: string;
  priority?: CasePriority;
  tags?: string[];
  assignee?: string;
  ageMin?: number; // minutes since the case was opened
  firstResponseMin?: number;
  resolutionMin?: number; // only for resolved cases
  csat?: number | null; // 1-5, only for resolved cases that answered the survey
}

export interface Review {
  id: string;
  customer: string;
  rating: number;
  platform: string;
  text: string;
  date: string;
  sentiment: string;
  reply: string | null;
  product?: string;
  verified?: boolean;
  approved?: boolean; // storefront reviews are moderated before they show on the product page
  intercepted?: boolean; // a care case has been opened from this review
}

// ─── helpers ──────────────────────────────────────────────────────────────────

export const SLA_TARGET_HOURS: Record<CasePriority, number> = { Urgent: 4, High: 8, Normal: 24, Low: 48 };
export const FIRST_RESPONSE_TARGET_MIN = 15;

export function agoLabel(m: number): string {
  if (m < 1) return 'Just now';
  if (m < 60) return `${Math.round(m)}m ago`;
  if (m < 60 * 24) return `${Math.round(m / 60)}h ago`;
  const d = Math.round(m / 1440);
  return d === 1 ? 'Yesterday' : `${d}d ago`;
}

export type SlaState = 'Met' | 'Breached' | 'At risk' | 'On track';

/** Resolution SLA state derived from priority and the case's age. */
export function slaState(c: SupportCase): SlaState {
  const target = SLA_TARGET_HOURS[c.priority || 'Normal'] * 60;
  if (c.status === 'Resolved') return (c.resolutionMin ?? 0) <= target ? 'Met' : 'Breached';
  const age = c.ageMin ?? 0;
  if (age > target) return 'Breached';
  if (age > target * 0.75) return 'At risk';
  return 'On track';
}

export function slaLabel(c: SupportCase): string {
  const target = SLA_TARGET_HOURS[c.priority || 'Normal'] * 60;
  if (c.status === 'Resolved') return slaState(c) === 'Met' ? 'Closed within SLA' : 'Closed after SLA';
  const left = target - (c.ageMin ?? 0);
  const abs = Math.abs(left);
  const t = abs >= 1440 ? `${Math.floor(abs / 1440)}d ${Math.round((abs % 1440) / 60)}h` : abs >= 60 ? `${Math.floor(abs / 60)}h ${Math.round(abs % 60)}m` : `${Math.round(abs)}m`;
  return left < 0 ? `Overdue by ${t}` : `${t} left`;
}

type M = [string, string, number, string?]; // sender, text, minutes ago, agent name

function mk(
  n: number,
  customer: string,
  channel: string,
  status: string,
  escalation: string,
  priority: CasePriority,
  extra: Partial<SupportCase>,
  thread: M[],
): SupportCase {
  const ageMin = thread[0][2];
  return {
    id: `case-${n}`,
    customer,
    channel,
    msg: thread[0][1],
    status,
    escalation,
    time: agoLabel(thread[thread.length - 1][2]),
    thread: thread.map(([sender, msg, ago, by]) => ({ sender, msg, time: agoLabel(ago), ...(by ? { by } : {}) })),
    priority,
    ageMin: extra.ageMin ?? ageMin,
    ...extra,
  };
}

const daysAgo = (n: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
};

// ─── Support cases ────────────────────────────────────────────────────────────

export const INITIAL_SUPPORT_CASES: SupportCase[] = [
  mk(1, 'Meera Sen', 'website', 'Open', 'Refund Requested', 'High',
    { orderId: 'HP-48210', product: 'Premium Whole Cashew Nuts 200g', city: 'Kolkata', tags: ['Not received', 'Delhivery'], assignee: 'Kavya', firstResponseMin: 6 },
    [
      ['customer', 'Order HP-48210 shows delivered since yesterday but nothing reached me. Nobody came to the door, courier is not picking up calls.', 95],
      ['agent', 'Hi Meera, this is Kavya from Happilo care. I can see Delhivery marked it delivered at 11:20 am on 12 Nov but there is no signature or OTP on it. Raising a non-delivery claim with them right now.', 89, 'Kavya'],
      ['customer', 'ok. I do not want to wait a week, I need it for a gift this weekend', 74],
      ['agent', 'Understood. Claim is raised, Delhivery has 24 hrs to respond. If they cannot trace it by tomorrow evening we will send a fresh pack or refund you in full, your choice.', 61, 'Kavya'],
    ]),
  mk(2, 'Rohan Sharma', 'whatsapp', 'Open', 'Replacement Request', 'Normal',
    { orderId: 'HP-48196', product: 'Premium Nutritious Nutty Trail Mix 200g', city: 'Pune', tags: ['Damaged pack'], assignee: 'Arjun', firstResponseMin: 4 },
    [
      ['customer', 'Nutty trail mix pouch came with the seal torn on one side, half the mix has spilled in the box. Please send replacement', 190],
      ['agent', 'Sorry about that Rohan. Could you send a photo of the pouch and the batch no. printed near the bottom seal? We will ship a replacement as soon as we have it.', 184, 'Arjun'],
      ['customer', '[photo] batch is HP2407B, mfg 09/2026', 171],
    ]),
  mk(3, 'Ananya Rao', 'instagram', 'Pending', 'None', 'High',
    { product: 'Super Mom\'s Trail Mix 200g', city: 'Bengaluru', tags: ['Allergen query'], assignee: 'Kavya', firstResponseMin: 9 },
    [
      ['customer', 'Is the Super Mom\'s Trail Mix peanut free? my daughter is allergic. also is it made in a facility that handles peanuts?', 260],
      ['agent', 'Hi Ananya, thanks for checking before buying. Super Mom\'s Trail Mix has almonds, cashews, raisins, pumpkin and watermelon seeds - no peanuts in the recipe. But the pack carries a "may contain traces of peanuts and other tree nuts" line because our facility handles them.', 251, 'Kavya'],
      ['agent', 'Since it is a severe allergy I would not recommend it for your daughter. Our raw seed range (pumpkin, sunflower, chia) is packed on a separate line, happy to share batch details if you want to go with that.', 249, 'Kavya'],
    ]),
  mk(4, 'Nitin Gupta', 'website', 'Resolved', 'None', 'Low',
    { orderId: 'HP-48177', product: 'Raw Pumpkin Seeds 200g', city: 'Noida', tags: ['Cancellation'], assignee: 'Arjun', firstResponseMin: 3, resolutionMin: 22, csat: 5 },
    [
      ['customer', 'Can I cancel HP-48177? still showing processing', 420],
      ['agent', 'Done Nitin, order cancelled before dispatch. Refund of Rs 234 goes back to your UPI in 2-3 working days.', 416, 'Arjun'],
      ['customer', 'thanks, that was quick', 410],
    ]),
  mk(5, 'Kavita Menon', 'amazon', 'Open', 'None', 'Normal',
    { orderId: '408-3321907-5516284', product: 'Premium Arabian Dates 500g', city: 'Kochi', tags: ['Delayed', 'Amazon FBA'], assignee: 'Arjun', firstResponseMin: 22, ageMin: 1720 },
    [
      ['customer', 'Ordered Arabian dates on 9th, promised by 11th. Still shows shipped. Please check', 1720],
      ['agent', 'Hi Kavita, we are checking with the Amazon fulfilment centre. This one is Amazon-shipped so we are waiting on their update, will message you by tonight.', 1690, 'Arjun'],
      ['customer', 'It is now 13th. what is happening', 240],
    ]),
  mk(6, 'Sandeep Kulkarni', 'flipkart', 'Open', 'Replacement Request', 'Normal',
    { orderId: 'OD336218845012', product: 'Raw Pumpkin Seeds 200g', city: 'Nagpur', tags: ['Wrong item'], assignee: 'Kavya', firstResponseMin: 11 },
    [
      ['customer', 'Ordered Raw Pumpkin Seeds, got Raw Sunflower Seeds in the box. Packing slip says pumpkin.', 600],
      ['agent', 'That should not have happened, sorry Sandeep. Please upload a pic of the pack and slip in the Flipkart return window - we will get the correct one dispatched with priority.', 585, 'Kavya'],
      ['customer', 'Uploaded just now', 470],
    ]),
  mk(7, 'Pooja Nair', 'blinkit', 'Open', 'None', 'Normal',
    { orderId: 'BLK-7720914', product: 'Peri Peri Makhana 60g', city: 'Gurugram', tags: ['Missing item', 'Quick commerce'], assignee: 'Arjun', firstResponseMin: 7 },
    [
      ['customer', 'Got my Blinkit order but Peri Peri Makhana is missing from the bag. Charged for 2 packs, got 1.', 55],
      ['agent', 'Sorry Pooja, since the pack is packed at the dark store this goes through Blinkit first. I have shared your order details with their partner team asking for a refund of Rs 102. Will update you here.', 42, 'Arjun'],
    ]),
  mk(8, 'Harpreet Singh', 'whatsapp', 'Open', 'Key Accounts', 'Normal',
    { product: 'Monthly Dry Fruits Combo', city: 'Ludhiana', tags: ['Bulk', 'Diwali gifting'], assignee: 'Meghna', firstResponseMin: 12 },
    [
      ['customer', 'Namaste, we are a small textile firm, need around 150 gift boxes for next Diwali, 500 to 800 per box. can you do with our logo?', 340],
      ['agent', 'Namaste Harpreet ji, yes we do corporate gifting. For 150 boxes we usually quote on the box and the mix - could you tell me which dry fruits you would like and the delivery city / date? I will have our key accounts team send a quote.', 322, 'Meghna'],
      ['customer', 'Almonds, cashew, anjeer, Medjoul dates. Delivery in Ludhiana, around 2 weeks before Diwali.', 300],
    ]),
  mk(9, 'Divya Iyer', 'website', 'Resolved', 'None', 'Low',
    { orderId: 'HP-48102', product: 'Popular Nuts Combo (Almonds 400g & Cashews 400g)', city: 'Chennai', tags: ['Coupon'], assignee: 'Kavya', firstResponseMin: 8, resolutionMin: 95, csat: 4 },
    [
      ['customer', 'Coupon FESTIVE15 is not applying at checkout, says not valid for this cart', 1500],
      ['agent', 'Hi Divya, FESTIVE15 works on orders above Rs 999 excluding combos - your cart has the Popular Nuts Combo which is why it fails. I have added a one-time code HAPPY10 for you that does work on combos.', 1405, 'Kavya'],
      ['customer', 'worked, thanks', 1400],
    ]),
  mk(10, 'Arjun Mehta', 'whatsapp', 'Resolved', 'None', 'Low',
    { orderId: 'HP-47988', product: 'Californian Walnut Kernels 200g', city: 'Hyderabad', tags: ['Expiry query'], assignee: 'Arjun', firstResponseMin: 5, resolutionMin: 18, csat: 5 },
    [
      ['customer', 'what is the shelf life of walnut kernels? Pack says best before but I cant find mfg date', 2100],
      ['agent', 'Both are printed on the back panel near the batch no. Walnut kernels are good for 9 months from packing. Once opened please store in an airtight container, ideally in the fridge in summer.', 2086, 'Arjun'],
    ]),
  mk(11, 'Shalini Deshmukh', 'website', 'Open', 'Escalated - Quality Team', 'Urgent',
    { orderId: 'HP-48203', product: 'Jumbo Californian Almonds 400g', city: 'Mumbai', tags: ['Freshness', 'Batch check'], assignee: 'Meghna', firstResponseMin: 5 },
    [
      ['customer', 'The jumbo almonds smell a bit stale/oily and taste bitter. Opened the pack only today, 400g, never had this from Happilo before.', 140],
      ['agent', 'Thank you for telling us Shalini, and sorry about this. Please do not consume the rest. Can you share the batch number and a photo of the almonds? I am flagging it to our quality team right away.', 133, 'Meghna'],
      ['customer', 'batch HA4002, photo sent on email also', 118],
      ['agent', 'Got it. Quality team has pulled retained samples for HA4002. We will refund the order now and call you tomorrow morning with their finding.', 96, 'Meghna'],
    ]),
  mk(12, 'Imran Qureshi', 'amazon', 'Open', 'Refund Requested', 'High',
    { orderId: '171-9042266-2087532', product: 'Roasted & Salted Cashew Nuts 200g', city: 'Lucknow', tags: ['Refund status', 'Return'], assignee: 'Kavya', firstResponseMin: 18, ageMin: 4300 },
    [
      ['customer', 'Returned the cashew pack on 7th, pickup was done. Refund still not in my account. 6 days now', 4300],
      ['agent', 'Hi Imran, your return was received at the Amazon warehouse on 10 Nov. Refunds on Amazon orders are released by Amazon within 3-5 days after that - I have asked their seller support to push it.', 4180, 'Kavya'],
      ['customer', 'No update still', 380],
    ]),
  mk(13, 'Lakshmi Venkat', 'instagram', 'Resolved', 'None', 'Low',
    { product: 'Dry Fruits Combo 850g', city: 'Coimbatore', tags: ['Gifting', 'Festive box'], assignee: 'Meghna', firstResponseMin: 14, resolutionMin: 46, csat: 5 },
    [
      ['customer', 'Hi do you have gift boxes under 1500 for New Year? want to send to relatives in Delhi', 2900],
      ['agent', 'Hi Lakshmi! Yes, the Dry Fruits Combo 850g is Rs 1,114 and comes in a festive sleeve. You can add a gift message at checkout and we ship to the Delhi address directly.', 2870, 'Meghna'],
      ['customer', 'perfect, ordering 3', 2854],
    ]),
  mk(14, 'Gaurav Bansal', 'flipkart', 'Pending', 'None', 'Normal',
    { orderId: 'OD336190077431', product: 'Oven Roasted & Salted Pistachios 200g', city: 'Jaipur', tags: ['Damaged pack'], assignee: 'Arjun', firstResponseMin: 25 },
    [
      ['customer', 'Pistachio pack seal is open when delivered', 1250],
      ['agent', 'Sorry Gaurav. Could you share clear photos of the pack, front and back, along with the outer box? Needed for the replacement ticket.', 1230, 'Arjun'],
    ]),
  mk(15, 'Tanvi Joshi', 'blinkit', 'Open', 'Escalated - Quality Team', 'High',
    { orderId: 'BLK-7719502', product: 'International King Medjoul Dates 250g', city: 'Pune', tags: ['Short expiry', 'Quick commerce'], assignee: 'Meghna', firstResponseMin: 10 },
    [
      ['customer', 'Medjoul dates I got from Blinkit have best before 30 Nov. Thats just 2 weeks. Is this fine?', 210],
      ['agent', 'Hi Tanvi, thats on the shorter side for this product and not what we want customers to receive. Dates stay good beyond that when refrigerated but I understand your concern. I have flagged the dark store stock to our supply team and Blinkit has been asked to refund you.', 188, 'Meghna'],
    ]),
  mk(16, 'Rahul Dutta', 'website', 'Resolved', 'None', 'Low',
    { product: 'Monthly Dry Fruits Combo', city: 'Kolkata', tags: ['Subscription'], assignee: 'Kavya', firstResponseMin: 9, resolutionMin: 31, csat: 4 },
    [
      ['customer', 'I subscribed to the monthly combo. Can I skip next month, going out of town', 3600],
      ['agent', 'Sure Rahul, I have skipped the December cycle. It will resume on 5 Jan unless you tell us otherwise. You can also do this yourself from My Account > Subscriptions.', 3569, 'Kavya'],
    ]),
  mk(17, 'Sneha Pillai', 'whatsapp', 'Resolved', 'None', 'Low',
    { product: 'Premium Fox Nuts (Phool Makhana) 100g', city: 'Thiruvananthapuram', tags: ['Allergen query'], assignee: 'Arjun', firstResponseMin: 6, resolutionMin: 14, csat: null },
    [
      ['customer', 'is phool makhana plain one roasted in ghee? I am vegan', 5200],
      ['agent', 'Hi Sneha, the plain Fox Nuts are dry roasted with no ghee or dairy. The Cream & Onion flavour has milk solids though, so please avoid that one.', 5186, 'Arjun'],
    ]),
  mk(18, 'Vikram Chauhan', 'website', 'Open', 'Escalated - Logistics', 'High',
    { orderId: 'HP-48093', product: 'Dry Fruits Combo 850g', city: 'Delhi', tags: ['Delayed', 'Blue Dart'], assignee: 'Meghna', firstResponseMin: 7, ageMin: 2950 },
    [
      ['customer', 'HP-48093 ordered on 11th, still says "packed". 2 days, no AWB number either', 2950],
      ['agent', 'Apologies Vikram. The pack got held at our Bengaluru warehouse because of a label printing issue. It is being handed to Blue Dart today, I will send the AWB here once the pickup scan comes in.', 2900, 'Meghna'],
      ['agent', 'AWB 71829046113 (Blue Dart) is now live. Expected delivery 15 Nov. Rs 50 credit has been added to your account for the delay.', 1180, 'Meghna'],
      ['customer', 'Ok, will wait till 15th', 1150],
    ]),
  mk(19, 'Aarti Kapoor', 'instagram', 'Open', 'None', 'Normal',
    { orderId: 'HP-48221', product: 'Premium Californian Almonds 200g', city: 'Chandigarh', tags: ['Billing'], assignee: 'Kavya', firstResponseMin: 13 },
    [
      ['customer', 'I was charged Rs 40 as COD fee though the site showed free. Can you check my order HP-48221', 170],
      ['agent', 'Hi Aarti, checking this now. The free-COD offer is valid above Rs 499, your cart was Rs 479 after the coupon. I can see why the fee applied, but I will ask the team if we can reverse it as a one-off.', 155, 'Kavya'],
    ]),
  mk(20, 'Mohammed Faizan', 'whatsapp', 'Resolved', 'None', 'Low',
    { product: 'International Ajwa Dates 400g', city: 'Hyderabad', tags: ['Gifting'], assignee: 'Meghna', firstResponseMin: 8, resolutionMin: 55, csat: 5 },
    [
      ['customer', 'Salam, want to send Ajwa dates to my parents in Malegaon. Can you put a handwritten note?', 4800],
      ['agent', 'Walaikum salam Faizan bhai. We do a printed note, not handwritten - I have noted your message on the order and it will be tucked inside the box. Delivery is 4-5 days to Malegaon.', 4745, 'Meghna'],
    ]),
  mk(21, 'Deepa Narayanan', 'amazon', 'Resolved', 'None', 'Normal',
    { orderId: '405-6618203-1190347', product: 'Jumbo Roasted & Salted Californian Pistachios 200g', city: 'Mysuru', tags: ['Quality', 'Refund'], assignee: 'Arjun', firstResponseMin: 20, resolutionMin: 410, csat: 3 },
    [
      ['customer', 'Pistachios are way too salty, cannot eat. Want refund', 6100],
      ['agent', 'Sorry to hear that Deepa. Salt levels vary a little by batch and this one clearly missed the mark. I have approved a refund of Rs 353, you do not need to return the pack.', 5690, 'Arjun'],
      ['customer', 'ok received. please check batch next time', 5400],
    ]),
  mk(22, 'Karan Malhotra', 'website', 'Resolved', 'None', 'Low',
    { orderId: 'HP-48155', product: 'Kashmiri Walnut Kernels 200g', city: 'Gurugram', tags: ['GST invoice'], assignee: 'Kavya', firstResponseMin: 10, resolutionMin: 40, csat: 5 },
    [
      ['customer', 'need GST invoice for HP-48155, company name Malhotra Traders, GSTIN 06AAQFM4417K1ZB', 7300],
      ['agent', 'Hi Karan, sent the GST invoice to your registered email just now. Please check spam if it does not show up in a few minutes.', 7260, 'Kavya'],
    ]),
  mk(23, 'Bhavna Trivedi', 'flipkart', 'Open', 'None', 'High',
    { orderId: 'OD336205513908', product: 'Dried Californian Pitted Prunes 200g', city: 'Ahmedabad', tags: ['Delayed', 'Ecom Express'], assignee: 'Arjun', firstResponseMin: 16, ageMin: 520 },
    [
      ['customer', 'Order stuck at Ahmedabad hub for 3 days, Ecom Express says "out for delivery" daily but nobody comes', 520],
      ['agent', 'Hi Bhavna, I have written to Ecom Express asking for a confirmed delivery slot. Will update you as soon as they reply.', 490, 'Arjun'],
    ]),
  mk(24, 'Sunita Reddy', 'whatsapp', 'Resolved', 'None', 'Normal',
    { orderId: 'HP-47931', product: 'Premium Nutritious Nutty Trail Mix 200g', city: 'Vijayawada', tags: ['Quality', 'Refund'], assignee: 'Meghna', firstResponseMin: 6, resolutionMin: 180, csat: 2 },
    [
      ['customer', 'Trail mix raisins were hard and dry, not like before. Disappointed', 8700],
      ['agent', 'Sorry Sunita, that is not the standard we aim for. I have refunded Rs 289 to your original payment mode and passed the batch details to our quality team.', 8520, 'Meghna'],
      ['customer', 'Fine. Hope it improves', 8400],
    ]),
  mk(25, 'Aman Verma', 'blinkit', 'Resolved', 'None', 'Normal',
    { orderId: 'BLK-7701188', product: 'Cream & Onion Makhana 60g', city: 'Noida', tags: ['Refund status', 'Quick commerce'], assignee: 'Arjun', firstResponseMin: 9, resolutionMin: 260, csat: 4 },
    [
      ['customer', 'Blinkit cancelled my order but Rs 102 for makhana still deducted', 9800],
      ['agent', 'Hi Aman, order cancellations on Blinkit are refunded by them, usually within 24 hrs. I have confirmed with their team that yours is processed - should reflect by tomorrow morning.', 9540, 'Arjun'],
    ]),
  mk(26, 'Rekha Bose', 'website', 'Open', 'None', 'High',
    { orderId: 'HP-48230', product: 'Dried Californian Whole Cranberries 200g', city: 'Kolkata', tags: ['Address issue', 'Xpressbees'], assignee: 'Kavya', firstResponseMin: 5 },
    [
      ['customer', 'I just realised I typed the wrong pincode (700019 instead of 700091). Order HP-48230 is out for delivery, please help!', 38],
      ['agent', 'Checking with Xpressbees right now Rekha, will ask them to hold the shipment at the local hub so we can correct the pincode.', 31, 'Kavya'],
    ]),
];

// ─── Reviews ──────────────────────────────────────────────────────────────────

function rv(
  n: number,
  customer: string,
  rating: number,
  platform: string,
  product: string,
  text: string,
  ago: number,
  reply: string | null = null,
  extra: Partial<Review> = {},
): Review {
  return {
    id: `rev-${n}`,
    customer,
    rating,
    platform,
    text,
    product,
    date: daysAgo(ago),
    sentiment: rating >= 4 ? 'positive' : rating === 3 ? 'neutral' : 'negative',
    reply,
    verified: platform !== 'Google',
    ...extra,
  };
}

export const INITIAL_REVIEWS: Review[] = [
  rv(1, 'Priya Shah', 5, 'Google', 'California Inshell Walnuts with Free Nut Cracker', 'Walnuts are super fresh and the free nut cracker is a nice touch. Crunchy, no bitterness at all. Worth every rupee.', 1, 'Thank you Priya, glad the walnuts were a hit. Do try the Kashmiri kernels next time.'),
  rv(2, 'Amit K.', 2, 'Amazon', 'Premium Whole Cashew Nuts', 'Cashews taste great but the pouch came with a broken seal and the outer bag was crushed. Not acceptable for the price.', 2, 'Hi Amit, sorry about the damaged pack. Our team has written to you with a replacement - please check your Amazon messages.'),
  rv(3, 'Neha Sharma', 4, 'BigBasket', 'Seedless Afghani Black Raisins', 'Plump and sweet raisins, good for kheer. Delivery took a day longer than promised though.', 2),
  rv(4, 'Shreya Roy', 1, 'Flipkart', 'Exotic Brazil Nuts', 'Ordered Brazil nuts, received a completely different product in the box. Very disappointed, had ordered for my mother.', 3, 'We are sorry for the mix-up Shreya. Please check your Flipkart order page - a replacement has been raised.', { intercepted: true }),
  rv(5, 'Rajesh Kumar', 5, 'Amazon', 'Californian Almonds', 'Been buying the 400g almonds for 2 years now. Consistent size, no broken pieces. Soaked overnight and they peel easily.', 3),
  rv(6, 'Sneha Pillai', 5, 'happilo.com', 'Premium Fox Nuts (Phool Makhana)', 'Fresh and crisp, did not turn soggy even after 2 weeks in the jar. Using it for evening snacks.', 4, null, { approved: true }),
  rv(7, 'Vikas Jain', 4, 'Google', 'Super Mom\'s Trail Mix', 'Good mix, kids like the raisins and seeds. A bit pricey but quality is fine.', 4, 'Thanks Vikas! Glad the kids are enjoying it.'),
  rv(8, 'Anjali Desai', 5, 'Flipkart', 'International King Medjoul Dates', 'Large, soft and not too sweet. Bought for Diwali gifting, everyone asked where I got them from.', 5, 'Thank you Anjali, happy Diwali to you and family!'),
  rv(9, 'Manoj Pandey', 3, 'Amazon', 'Roasted & Lightly Salted Californian Almonds', 'Taste is okay but quite a few almonds were over-roasted and dark. Expected better.', 6, null),
  rv(10, 'Ritu Agarwal', 5, 'BigBasket', 'Premium Fox Nuts (Phool Makhana)', 'Large puffs, no broken bits. Delivered next morning in good condition.', 6),
  rv(11, 'Suresh Nambiar', 4, 'Amazon', 'Dry Fruits Combo 850g', 'Good value combo. Cashews and almonds were excellent, raisins average.', 7, null),
  rv(12, 'Pallavi Kulkarni', 5, 'happilo.com', 'Peri Peri Makhana', 'Finally a healthy snack that actually tastes good. Peri peri one has the right amount of spice.', 8, null, { approved: true }),
  rv(13, 'Rohit Bhatia', 1, 'Amazon', 'Jumbo Californian Almonds', 'Smelled rancid when I opened the pack. Bitter taste. Photo attached. Waiting for refund since 5 days.', 9, 'Hi Rohit, this is not the quality we stand for. Our care team has your order details and the refund is being expedited.', { intercepted: true }),
  rv(14, 'Divya Menon', 5, 'Google', 'Dried Afghani Anjeer', 'Soft, naturally sweet anjeer. Packaging was neat and sealed well.', 10, null),
  rv(15, 'Harish Gowda', 4, 'Flipkart', 'Raw Pumpkin Seeds', 'Fresh seeds, good size. Pack is a little small for the price though.', 11),
  rv(16, 'Nandini Rao', 5, 'BigBasket', 'Californian Walnut Kernels', 'Light coloured halves, not bitter. Very fresh.', 12, null),
  rv(17, 'Aakash Tiwari', 2, 'Flipkart', 'Premium Nutritious Nutty Trail Mix', 'Mix has more raisins than nuts. Almonds were hardly 5-6 pieces in the whole pack.', 13, 'Hi Aakash, thanks for the honest feedback. We have shared this with our product team.'),
  rv(18, 'Kiran Bedi', 5, 'Google', 'International Ajwa Dates', 'Real Ajwa, soft and fresh. Packed securely. Will order again for Ramadan.', 14, 'Thank you Kiran, we will make sure your next order is as fresh.'),
  rv(19, 'Madhuri Joshi', 4, 'happilo.com', 'Daily Super Health Mix', 'Tasty and filling, I carry it to office. Wish it came in a resealable bigger pack.', 15, null, { approved: false }),
  rv(20, 'Farhan Sheikh', 5, 'Amazon', 'Premium Arabian Dates', 'Great taste and value for money. Delivered well before the date.', 17),
  rv(21, 'Geeta Iyer', 4, 'BigBasket', 'Premium Whole Cashew Nuts', 'Whole pieces and fresh. Two pieces were slightly broken but nothing major.', 19, null),
  rv(22, 'Sachin Patil', 5, 'Google', 'Raw Black Chia Seeds', 'Clean seeds, no dust. Using in smoothies daily.', 21),
  rv(23, 'Bindu Thomas', 3, 'Flipkart', 'Oven Roasted & Salted Pistachios', 'Slightly too salty for us, otherwise fresh and crunchy. Good packing.', 24, null),
  rv(24, 'Naveen Reddy', 5, 'Amazon', 'Premium Whole Cashew Nuts', 'Whole white cashews, crisp. Better than what I get from the local shop.', 27, 'Thanks Naveen, glad you liked them.'),
  rv(25, 'Shweta Singh', 4, 'happilo.com', 'Classic Panchmewa Dry Fruit Mix', 'Used it for prasad. Good variety, fresh. Delivery in 3 days to Lucknow.', 30, null, { approved: true }),
  rv(26, 'Imran Ali', 5, 'Google', 'Super Soft Kimia Dates', 'Very soft, almost melts. Kids finished the pack in two days.', 34),
  rv(27, 'Lata Mishra', 1, 'BigBasket', 'Cream & Onion Makhana', 'Got a packet that expired within 3 weeks of delivery. Check expiry before delivering.', 38, 'Hi Lata, we are sorry about the short expiry. Our team has reached out to you for a full refund.'),
  rv(28, 'Tarun Saxena', 4, 'Amazon', 'Dried Californian Blueberries', 'Tangy and chewy, good in oats. Slightly clumped together.', 44),
  rv(29, 'Ishita Banerjee', 5, 'Flipkart', 'Himalayan Salt & Pepper Makhana', 'Light, crunchy and not oily. Better than other brands I tried.', 49, null),
  rv(30, 'Vinod Choudhary', 4, 'Google', 'Popular Nuts Combo (Almonds 400g & Cashews 400g)', 'Both almonds and cashews were fresh. Delivered in 2 days to Indore.', 54, 'Thank you Vinod!'),
];
