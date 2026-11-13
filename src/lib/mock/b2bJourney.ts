/**
 * Text generators for outreach that is not hand-written: standard cadence
 * messages, catalogue emails and Aarav's call scripts. Everything here is
 * deterministic for a given lead so the sample data stays stable.
 */
import type { Cat } from './b2bSeeds';
import type { CallGen } from './b2bStoryTypes';
import { RATE_CARD, GIFT_CAT, sig } from './b2bStoryTypes';

type Group = 'retail' | 'gifting' | 'distributor' | 'hospitality' | 'online';

export const groupOf = (cat: Cat): Group =>
  cat === 'retail_store' ? 'retail'
  : cat === 'corporate_gifting' ? 'gifting'
  : cat === 'distributor' ? 'distributor'
  : cat === 'hotel_cafe' || cat === 'institutional' ? 'hospitality'
  : 'online';

const pick = <T,>(arr: T[], n: number): T => arr[Math.abs(n) % arr.length];

export const REPS = [
  { first: 'Karthik', full: 'Karthik Iyer', sig: sig('Karthik Iyer', 'B2B Sales') },
  { first: 'Divya', full: 'Divya Nair', sig: sig('Divya Nair', 'B2B Sales') },
  { first: 'Rohan', full: 'Rohan Verma', sig: sig('Rohan Verma', 'B2B Sales') },
];

const SOUTH = ['Bengaluru', 'Chennai', 'Hyderabad', 'Kochi'];

/* ------------------------------ WhatsApp ------------------------------ */

export function waIntro(group: Group, first: string, rep: string, region: string, n: number): string {
  const south = SOUTH.includes(region);
  const hi = south ? `Hello ${first}` : `Namaste ${first} ji`;
  const lines: Record<Group, string[]> = {
    retail: [
      south
        ? `${hi}, ${rep} from Happilo B2B team, Bengaluru. Our sealed nuts, dates and makhana packs are now in many stores in ${region} with a good trade margin. May I share the retail rate card?`
        : `${hi}, ${rep} here from Happilo B2B team. Humare sealed nuts, dates aur makhana ke packs ${region} ke kaafi stores me hain, good trade margin ke saath. Rate card bhej du?`,
      `${hi}, this is ${rep} from Happilo. We supply branded 200g and 500g packs of cashew, almonds, dates and 55g makhana to stores. Shall I send pack sizes and trade prices?`,
    ],
    gifting: [
      `Hi ${first}, ${rep} from Happilo B2B. For year-end and wedding gifting we have ready boxes from Rs 799 to Rs 1,799 with printed sleeve options. May I share the catalogue?`,
      `${hi}, ${rep} from Happilo. We make corporate and festive gift boxes with almonds, cashews, pistachios and dates. Can I send the gifting catalogue and slabs?`,
    ],
    distributor: [
      south
        ? `${hi}, ${rep} from Happilo B2B team. We are appointing distributors in ${region} for our nuts, dates and makhana range. Could we speak this week?`
        : `${hi}, ${rep} from Happilo B2B team. Hum ${region} me distributor dhoondh rahe hain apne nuts, dates aur makhana range ke liye. Is hafte baat ho sakti hai?`,
      `${hi}, ${rep} here, Happilo B2B. We are open to a distributor or sub-distributor partner in ${region}, with a structured margin and near-expiry returns. Can I share the terms?`,
    ],
    hospitality: [
      `Hi ${first}, ${rep} from Happilo B2B. We supply roasted nuts, trail mixes, makhana and dates in 1 kg bulk packs and small sealed pouches for cafes, hotels and canteens. Can I send the price list?`,
      `${hi}, ${rep} from Happilo. We deliver weekly to hotels and cafes in ${region}. Would you like our bulk rate card?`,
    ],
    online: [
      `Hi ${first}, ${rep} from Happilo B2B. Thanks for your interest. We do work with a few resellers on carton pricing with MRP alignment. Can I send the reseller price list?`,
      `Hi ${first}, ${rep} here from Happilo B2B team. Makhana, seeds and trail mixes are doing well with resellers. Shall I share the carton prices and MOQ?`,
    ],
  };
  return pick(lines[group], n);
}

export function waFollowUp(first: string, rep: string, n: number): string {
  return pick([
    `Hi ${first}, ${rep} here, following up on my earlier message. Happy to send a small sample pack if that helps you check the quality.`,
    `${first}, just checking if you could see the above. I can also call at a time that suits you.`,
    `Hello ${first}, gentle reminder from Happilo. The rate card is attached again in case it got buried. Please tell me if you want me to call.`,
  ], n);
}

export function waCheckIn(first: string, n: number): string {
  return pick([
    `Hi ${first}, December is when gifting and winter demand picks up. I can send a trial pack and a fresh price list if you are open to it.`,
    `${first}, we have limited festive stock for December. Shall I send the price list again and book a quick call?`,
  ], n);
}

/* -------------------------------- Email -------------------------------- */

const LINES: Record<Group, string> = {
  retail: `  Item                                  Pack    Shelf price   Retailer margin\n  Premium Whole Cashew Nuts             200g    Rs 336        24%\n  Premium Californian Almonds           200g    Rs 299        22%\n  Peri Peri Makhana                     55g     Rs 102        28%\n  Premium Arabian Dates                 500g    Rs 178        26%`,
  gifting: `  Box          Contents                                      Price per box\n  Select       almonds, cashews, pistachios, dates           Rs   999\n  Premium      Select plus Medjoul dates and trail mix       Rs 1,299\n  Royal        Premium plus walnuts and Fard dates          Rs 1,799`,
  distributor: `  Distributor margin     12% standard, higher slabs with volume\n  First order            from Rs 1.5 lakh, advance for first two lots\n  Shelf life             9 months, near-expiry stock replaced\n  Freight                free above Rs 1 lakh a lot`,
  hospitality: `  Item                                   Pack            Trade price\n  Roasted & salted almonds               1 kg bulk       Rs 920 / kg\n  Roasted & salted cashews               1 kg bulk       Rs 1,150 / kg\n  Nutty trail mix                        200g            Rs 205\n  Roasted nut pouch                      30g             Rs 52`,
  online: `  Item                                Carton       Reseller price / pack\n  Peri Peri Makhana 55g               24 packs     Rs 71\n  6 in 1 Seeds and Nuts Mix 250g      40 packs     Rs 169\n  Premium Nutty Trail Mix 200g        40 packs     Rs 205`,
};

export function catalogueEmail(
  group: Group, co: string, first: string, rep: (typeof REPS)[number], engaged: boolean, n: number,
): { subject: string; body: string; atts: string[] } {
  const subj: Record<Group, string[]> = {
    retail: [`Happilo trade range for ${co}`, `Retail rate card and pack sizes for ${co}`],
    gifting: [`Year-end gifting options for ${co}`, `Happilo gift boxes: catalogue and slabs for ${co}`],
    distributor: ['Distribution opportunity: Happilo nuts, dates and makhana', `Happilo distributor terms for ${co}`],
    hospitality: [`Bulk nuts and snack supply for ${co}`, `Happilo bulk price list for ${co}`],
    online: [`Reseller terms: Happilo makhana and trail mix`, `Happilo reseller price list for ${co}`],
  };
  const opener = engaged
    ? `Thank you for your time on WhatsApp. As promised, I am attaching our catalogue and the current rate card.`
    : `I am writing from Happilo International, a Bengaluru-based premium nuts, dates and makhana brand. We would like to introduce our trade range to ${co}.`;
  const closer = engaged
    ? `Please let me know if you would like any change in the pack mix, and I will revise the numbers.`
    : `If this is of interest, please reply here or tell me a convenient time and I will call you. Our colleague Aarav may also reach out over the phone.`;
  const atts = group === 'gifting' ? [GIFT_CAT, RATE_CARD] : [RATE_CARD];
  const body = `Dear ${first},\n\n${opener}\n\nA quick snapshot of what we offer:\n\n${LINES[group]}\n\nAll packs are sealed and FSSAI certified (licence 11222999000365) with 9 months shelf life.\n\n${closer}\n\n${rep.sig}`;
  return { subject: pick(subj[group], n), body, atts };
}

export function nudgeEmail(first: string, rep: (typeof REPS)[number], baseSubject: string): { subject: string; body: string } {
  return {
    subject: baseSubject.startsWith('Re:') ? baseSubject : `Re: ${baseSubject}`,
    body: `Dear ${first},\n\nI wanted to close the loop on my earlier note and the catalogue I shared. If the timing is not right, no problem at all, I will check back after the new year. If you would like a sample or a quote before that, just reply to this email.\n\n${rep.sig}`,
  };
}

/* --------------------------------- Calls --------------------------------- */

const DISCOVERY: Record<Group, Array<[string, string]>> = {
  retail: [
    ['How many customers do you see in a normal day, roughly?', 'On weekdays around 150 bills, weekends nearly double.'],
    ['Which dry fruits and snacks move the most for you right now?', 'Cashew and almonds mostly, makhana has picked up in the last year. Dates in festival time.'],
    ['Are you stocking any branded packs or mostly loose?', 'Mostly loose only. A few branded packs but they sit on the shelf for long.'],
    ['Who supplies you at present, and how often do you order?', 'A local wholesaler, every week. Rates keep changing so margin is not fixed.'],
  ],
  gifting: [
    ['How many boxes are you planning and for which occasion?', 'Depends on the client, between 100 and 400 for year-end and some wedding orders.'],
    ['What budget per box do your clients usually work with?', 'Most between 700 and 1,300, some premium ones above 1,500.'],
    ['Do you need custom sleeves or the client logo on the pack?', 'Yes, branding is a must for corporate clients. Delivery date is more important than anything.'],
    ['Do your clients have restrictions, like no mithai or only dry fruits?', 'Mostly dry fruits and dates. Some want sugar-free options.'],
  ],
  distributor: [
    ['How many retailers do you serve in your territory?', 'Around 300 to 400 active outlets, mostly kirana and some supermarkets.'],
    ['Which categories do you handle right now?', 'Biscuits, namkeen, pulses, and one dry fruit brand that is not doing so well.'],
    ['Do you have your own salesmen and vehicles for the route?', 'Yes, 5 salesmen and 3 vans. Promoters we do not have.'],
    ['What margin and credit period are you used to from brands?', 'Usually 12 to 15 percent, and 21 to 30 days credit.'],
  ],
  hospitality: [
    ['How much do you use in a month, roughly, in kilos or packs?', 'About 15 to 20 kg of mixed nuts and some trail mix for the counter.'],
    ['Who is your supplier right now and what do you not like about them?', 'A local wholesaler. Quality is fine but packing is loose and invoices are messy.'],
    ['Do you prefer bulk packs or small sealed pouches?', 'Both. Bulk for the kitchen and small sealed packs for guests.'],
    ['How do you handle invoicing, is it monthly with GST?', 'Yes, monthly with GST. Our accounts team is strict about the format.'],
  ],
  online: [
    ['How many orders do you ship in a month right now?', 'Around 3 to 4 thousand on our own site and marketplaces.'],
    ['Which of our categories sell best on your platform?', 'Makhana and seeds. Trail mixes after that.'],
    ['How do you source today and at what price point do you list?', 'From distributors, a bit costly. We list close to MRP to keep marketplaces in check.'],
    ['Do you handle your own packing and shipping?', 'Yes, from our own small warehouse.'],
  ],
};

const PITCH2: Record<Group, string> = {
  retail: 'Retailer margin is 22 to 28 percent depending on the pack, minimum first order is around Rs 15,000 mixed, and delivery is free above Rs 25,000 in most cities.',
  gifting: 'Boxes run from Rs 799 to Rs 1,799, sleeve printing is Rs 40 a box for 300 plus, and we need about 12 working days from artwork sign-off.',
  distributor: 'Distributor margin is 12 percent standard with higher slabs on volume, first order from Rs 1.5 lakh, and near-expiry stock is replaced.',
  hospitality: 'We have 1 kg bulk packs and 30g sealed pouches, weekly delivery, and a monthly GST invoice with 15 days credit after the first order.',
  online: 'Reseller pricing is by carton with MOQ of 20 cartons mixed, and we ask that MRP stays aligned across channels.',
};

/** Turns a note written about the lead ("he wants") into words said to them ("you want"). */
function toYou(t: string): string {
  return t
    .replace(/\b(he|she) is\b/g, 'you are')
    .replace(/\b(he|she) was\b/g, 'you were')
    .replace(/\b(he|she) has\b/g, 'you have')
    .replace(/\b(he|she) does\b/g, 'you do')
    .replace(/\b(he|she) (\w+?)s\b/g, 'you $2')
    .replace(/\b(his|her)\b/g, 'your')
    .replace(/\bhim\b/g, 'you');
}

export function genCallLines(group: Group, first: string, g: CallGen, n: number): string[] {
  const warm = g.tone !== 'cool';
  const rep = g.rep ?? 'my colleague';
  const L: string[] = [];
  L.push(`A:Hello, am I speaking with ${first}? This is Aarav calling from Happilo.`);
  L.push(pick([`U:Yes speaking, boliye.`, `U:Haan ${first} bol raha hu. Kaun?`, `U:Yes, tell me.`], n));
  L.push(`A:Thank you. ${rep === 'my colleague' ? 'I am calling' : `You had spoken to ${rep} on WhatsApp`} about ${g.topic}. Is this a good time for two minutes?`);
  L.push(warm ? 'U:Yes, go ahead, I have a few minutes.' : pick(['U:I am a bit busy but tell me quickly.', 'U:Two minutes only, I am in the middle of something.'], n));
  const d = DISCOVERY[group];
  for (let i = 0; i < 4; i++) {
    const [q, a] = d[(i + n) % d.length];
    L.push(`A:${q}`);
    L.push(`U:${a}`);
  }
  L.push('A:Thanks, that helps. What we do differently is pack everything at our own plant, sealed with a batch number and nine months shelf life. FSSAI licence number is 11222999000365 if you need it for records.');
  L.push(warm ? 'U:Okay, that sounds good. Quality is the main thing for us.' : 'U:Hmm, every brand says the same thing.');
  L.push(`A:${PITCH2[group]}`);
  L.push(warm ? 'U:Okay. Numbers are not bad. But one thing is bothering me.' : 'U:Okay, but I need to compare. And there is one problem.');
  L.push(`A:Please tell me. From what ${rep === 'my colleague' ? 'I have' : rep} noted, the concern is that ${toYou(g.objection)}. Is that right?`);
  L.push(pick(['U:Yes, exactly that.', 'U:Haan, wahi.', 'U:Yes. That is the main thing.'], n));
  L.push(`A:I understand. ${g.answer.charAt(0).toUpperCase()}${g.answer.slice(1)}.`);
  L.push(warm ? 'U:Alright, that makes sense.' : 'U:Hmm, let me think about it. Send me things in writing.');
  L.push(`A:So the next step is this: ${g.nextStep}. Does that work for you?`);
  L.push(pick(['U:Yes, that works.', 'U:Okay, do it.', 'U:Theek hai, kar do.'], n + 1));
  L.push('A:I will also drop a short summary on WhatsApp right after this call so you have everything in one place.');
  L.push('U:Fine, send it.');
  L.push(`A:Thank you for your time, ${first}. Have a good day.`);
  L.push(pick(['U:Thanks, bye.', 'U:Okay, thank you.', 'U:Bye bye.'], n));
  return L;
}

/** Plain-language objections used when a connected call has no hand-written script. */
export const OBJECTIONS: Record<Group, Array<{ objection: string; answer: string }>> = {
  retail: [
    { objection: 'branded packs usually stay on the shelf for long in his shop', answer: 'makhana and 200g nut packs are the fastest movers and we can start with a small mixed carton to test' },
    { objection: 'his wholesaler gives a slightly lower rate on loose stock', answer: 'packs have printed MRP and fewer returns, and the retailer margin is fixed at 22 to 28 percent' },
  ],
  gifting: [
    { objection: 'the client wants to see the box in person before approving', answer: 'we will send a sample box and a digital mockup with their logo' },
    { objection: 'delivery date matters more than price and she was let down by another vendor last year', answer: 'we write the delivery date in the quote and one person handles the order from artwork to delivery' },
  ],
  distributor: [
    { objection: 'the margin of 12 percent looks low for dry fruits with shelf life risk', answer: 'slabs go higher on volume and near-expiry stock is replaced, so the risk stays with us' },
    { objection: 'he wants longer credit than a new distributor normally gets', answer: 'credit can be reviewed after the first two lots are paid on time' },
  ],
  hospitality: [
    { objection: 'the current supplier is already cheaper per kilo', answer: 'ours are sealed with batch numbers and GST invoices, and wastage is lower than loose stock' },
    { objection: 'he needs the invoice in a very specific format for accounts', answer: 'we can share a sample invoice first so accounts can approve the format' },
  ],
  online: [
    { objection: 'direct pricing needs to leave enough margin after marketplace fees', answer: 'carton pricing is about 30 percent below MRP and aligned prices protect everyone' },
    { objection: 'he wants to keep MRP flexible on his own site', answer: 'we need alignment across channels, but a festive discount window can be planned together' },
  ],
};

export const NEXT_STEPS: Record<string, string> = {
  interested: 'the rate card and a first order list are sent on WhatsApp today',
  sample_sent: 'a quote is sent on email based on the sample feedback',
  demo_booked: 'a meeting is confirmed with samples',
  negotiation: 'a revised quote with the discussed terms is shared',
  won: 'the next reorder is planned and the list sent for approval',
  lost: 'we stay in touch and check back after the new year',
  contacted: 'the catalogue is sent on WhatsApp and email',
};
