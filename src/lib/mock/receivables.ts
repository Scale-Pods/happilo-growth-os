/**
 * Happilo receivables — local dummy dataset.
 *
 * Parties are Happilo's state distributors, super-stockists, modern-trade
 * regional offices, kirana wholesalers, gifting partners, hotel / caterer
 * accounts and e-commerce resellers that buy on credit. Amounts are in INR.
 * Everything is generated in memory from the table below; nothing is fetched.
 *
 * Reply strings start with a marker: "+" positive, "~" neutral, "-" negative.
 * An empty string means the party did not respond to that touch.
 */
import type { PartyLedgerRow, RecoveryOutreachRow, ConversationEntry } from '../data/receivables';
import {
  MGR,
  SPECIAL,
  VOICES,
  type CallStage,
  type Line,
  type MailMsg,
  type MailStage,
  type Sg,
  type Voice,
  type WaStage,
} from '../../app/accounts-receivable/_data/outreachStories';

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
/** "Today" for every receivables screen: 13 Nov 2026, late morning IST. */
export const REF_NOW = new Date('2026-11-13T11:40:00+05:30').getTime();
const NOW = REF_NOW;
const FY_START = new Date('2026-04-01T00:00:00+05:30').getTime();

const iso = (ms: number) => new Date(ms).toISOString();
const p2 = (n: number) => String(n).padStart(2, '0');
const ddmmyyyyHm = (ms: number) => {
  const d = new Date(ms);
  return `${p2(d.getDate())}/${p2(d.getMonth() + 1)}/${d.getFullYear()} ${p2(d.getHours())}:${p2(d.getMinutes())}`;
};
const ddmmyyyy = (ms: number) => ddmmyyyyHm(ms).slice(0, 10);
const dmyDash = (ms: number) => ddmmyyyy(ms).replace(/\//g, '-');
const isoDay = (ms: number) => iso(ms).slice(0, 10);
const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
const fixed = (n: number) => n.toFixed(2);

type Kind = 'State Distributor' | 'Super-stockist' | 'Modern Trade' | 'Kirana Wholesaler' | 'Corporate Gifting' | 'HoReCa' | 'E-commerce Reseller';

/** [days ago, cash received, TDS withheld] */
type Receipt = [number, number, number?];

interface Inv {
  age: number;
  amt: number;
  items: string;
  pay?: Receipt[];
  /** [days ago, amount, reason] */
  cn?: [number, number, string];
}

interface Party {
  name: string;
  owner: string;
  city: string;
  gstin: string;
  email: string;
  phone: string;
  kind: Kind;
  terms: 15 | 30 | 45;
  invs: Inv[];
  wa?: string[];
  em?: string[];
  call?: string[];
  dispute?: string;
  founder?: boolean;
  stage?: string;
  promise?: number;
  next?: string;
  sum?: string;
  closedSum?: string;
}

const PARTIES: Party[] = [
  {
    name: 'Venkateshwara FMCG Distributors', owner: 'Venkatesh Babu', city: 'Hyderabad', gstin: '36AAHFV8830M1Z2',
    email: 'finance@venkateshfmcg.com', phone: '+91 99890 12873', kind: 'State Distributor', terms: 30,
    invs: [
      { age: 71, amt: 942615, items: 'Premium Whole Cashew Nuts 200g x 600, Jumbo Californian Almonds 400g x 360, Oven Roasted & Salted Pistachios 200g x 240', pay: [[48, 300000]], cn: [40, 38400, 'Short supply, 24 cartons cashew not received'] },
      { age: 38, amt: 318940, items: 'Dried Afghani Anjeer 200g x 300, Seedless Afghani Black Raisins 250g x 360' },
    ],
    wa: ['', '~Will check with godown and revert.', '-Pay only after the short supply is credited properly. CN is for 24 cartons, we received 40 less.', '-Already told your sales head. Payment on hold till reconciliation.'],
    em: ['~Please send the signed POD copies, our store has not matched the count.', '-Raised with Rohit from your sales team twice. Need revised credit note before release.'],
    call: ['', '~Owner says discuss with Rohit, accounts will not release against disputed lot.', '-Call me only after Rohit gives the revised CN.'],
    dispute: 'Short supply of 40 cartons Premium Whole Cashew Nuts on first invoice, credit note only covers 24', founder: true, promise: 9,
    next: 'Founder to speak with Venkatesh Babu once warehouse POD check is done', sum: 'Venkatesh disputes the cashew count on the September dispatch and is holding both invoices. POD copies requested from the Hyderabad warehouse; revised credit note under review.',
  },
  {
    name: 'Sharma Traders', owner: 'Vinod Sharma', city: 'Delhi', gstin: '07AAFCS4521L1ZP',
    email: 'accounts@sharmatraders.in', phone: '+91 98110 44211', kind: 'Super-stockist', terms: 30,
    invs: [
      { age: 52, amt: 486430, items: 'Premium Nutritious Nutty Trail Mix 200g x 480, Raw Pumpkin Seeds 200g x 240, Peri Peri Makhana 55g x 600' },
      { age: 31, amt: 212575, items: 'Super Mom\'s Trail Mix 325g x 180, Premium Fox Nuts 100g x 300' },
    ],
    wa: ['', '~Statement bhej do, accountant mismatch dekh raha hai.', '~Statement mil gaya, Monday ko process karte hain.', '+Done, NEFT scheduled for Tuesday morning. Will send UTR.'],
    em: ['~Please resend both invoice copies with e-way bill numbers.', '+Noted. Payment run is on Tuesday.'],
    call: ['~Vinod ji on a shipment, asked to call after 4pm.', '+Confirmed payment Tuesday, both invoices together.'],
    promise: 4, next: 'Confirm UTR on Tuesday, release dispatch only after receipt', stage: 'Promise to Pay',
    sum: 'Vinod Sharma confirmed a combined NEFT for both invoices on Tuesday. Statement of account shared and acknowledged.',
  },
  {
    name: 'Om Sai Agencies', owner: 'Prakash Kulkarni', city: 'Pune', gstin: '27AABFO1190C1ZK',
    email: 'omsai.agencies@gmail.com', phone: '+91 98220 77310', kind: 'Kirana Wholesaler', terms: 15,
    invs: [
      { age: 70, amt: 126850, items: 'Premium Arabian Dates 500g x 200, Classic Panchmewa Dry Fruit Mix 450g x 60', pay: [[52, 126850]] },
      { age: 18, amt: 148230, items: 'Daily Super Health Mix 160g x 400, Raw Sunflower Seeds 250g x 180, Cream & Onion Makhana 55g x 480' },
    ],
    wa: ['+Thanks, will pay in a day or two.', '+Payment done today, UTR 641289773105.'],
    promise: 1, next: 'Match UTR 641289773105 against bank credit', stage: 'Promise to Pay',
    sum: 'Prakash Kulkarni says payment went out today. UTR shared, waiting for bank confirmation.',
  },
  {
    name: 'Balaji Wholesale Mart', owner: 'Ramesh Agarwal', city: 'Jaipur', gstin: '08AAGFB6612D1ZV',
    email: 'balajiwholesale@yahoo.in', phone: '+91 94140 55892', kind: 'Kirana Wholesaler', terms: 30,
    invs: [{ age: 41, amt: 372115, items: 'Premium Fard Dates 500g x 360, California Inshell Walnuts 200g x 240, Roasted Flax Seeds 250g x 150' }],
    wa: ['', '~Wedding season stock lag gaya hai, 10 din aur do.', '~Will pay half next week, rest after Dhanteras sales.'],
    em: ['~Send fresh statement please.'],
    promise: 7, next: 'Follow up on half payment promised for next week',
    sum: 'Ramesh Agarwal asked for ten more days and offered half payment next week, balance after Dhanteras.',
  },
  {
    name: 'Jain Brothers Distribution', owner: 'Naresh Jain', city: 'Ahmedabad', gstin: '24AAACJ7745B1ZE',
    email: 'accounts@jainbrothers.co.in', phone: '+91 98250 31144', kind: 'State Distributor', terms: 30,
    invs: [
      { age: 58, amt: 312480, items: 'Premium Whole Cashew Nuts 200g x 360, Kashmiri Walnut Kernels 200g x 150', pay: [[31, 312480]] },
      { age: 26, amt: 268540, items: 'Monthly Dry Fruits Combo x 120, Dry Fruits Combo 850g x 90' },
      { age: 9, amt: 96420, items: 'Premium Nutritious Nutty Trail Mix 200g x 240, Roasted & Salted Cashew Nuts 200g x 120' },
    ],
    wa: ['+Thanks for the reminder, we pay on due date as usual.'],
    promise: 4, next: 'No action needed before due date', sum: 'Regular payer. Acknowledged the courtesy reminder and will pay on due date.',
  },
  {
    name: 'Kaveri Trading Co.', owner: 'Madhavan S.', city: 'Chennai', gstin: '33AAECK2299N1ZR',
    email: 'kaveritrading@outlook.com', phone: '+91 98400 66217', kind: 'State Distributor', terms: 45,
    invs: [
      { age: 118, amt: 541280, items: 'Oven Roasted & Salted Pistachios 200g x 480, Premium Whole Cashew Nuts 200g x 360, International Ajwa Dates 500g x 120', pay: [[80, 200000]] },
      { age: 73, amt: 229760, items: 'Jumbo Roasted & Salted Californian Pistachios 200g x 300, Dried Turkish Apricots 200g x 180' },
    ],
    wa: ['', '~Which invoice are you talking about? Send details.', '-Pistachio lot had short expiry, retailers returned stock. We will not pay for that.', '-Stop messaging, I have told our accountant.', ''],
    em: ['~Need batch numbers and MFG dates of the pistachio lot.', '-Dispute is with your Chennai sales manager, not accounts.'],
    call: ['', '-Madhavan says 60 percent of the lot had under 90 days left, wants credit note.', '-Declined to discuss further on call.'],
    dispute: 'Near-expiry claim on Oven Roasted & Salted Pistachios lot, customer wants credit note for returned stock', founder: true,
    next: 'Founder call with Madhavan; QA to share batch MFG and expiry dates', sum: 'Madhavan claims the pistachio lot reached him with under 90 days left and is withholding the second invoice and the balance of the first. QA verifying batch dates.',
  },
  {
    name: 'Patel Super Bazaar', owner: 'Jignesh Patel', city: 'Ahmedabad', gstin: '24AAMFP3318H1ZB',
    email: 'patelbazaar@gmail.com', phone: '+91 98790 20481', kind: 'Modern Trade', terms: 15,
    invs: [{ age: 14, amt: 118540, items: 'Raw Black Chia Seeds 250g x 150, Daily Super Health Mix 160g x 240, Himalayan Salt & Pepper Makhana 55g x 360' },
      { age: 2, amt: 76320, items: 'Premium Fox Nuts 100g x 120, Peri Peri Makhana 55g x 240' }],
    wa: ['+Will pay on Monday, noted.'], promise: 3, next: 'Check payment on Monday', sum: 'Jignesh confirmed payment on Monday for the full invoice.',
  },
  {
    name: 'Fresh & Fine Supermart', owner: 'Arvind Nair', city: 'Bengaluru', gstin: '29AAEFF5561Q1ZN',
    email: 'accounts@freshandfine.in', phone: '+91 99001 83320', kind: 'Modern Trade', terms: 30,
    invs: [{ age: 37, amt: 334070, items: 'Premium Californian Almonds 200g x 480, Premium Nutritious Nutty Trail Mix 200g x 300, Seedless Green Raisins 500g x 120', pay: [[12, 100000]] }],
    wa: ['', '+Part payment of 1 lakh went on 1st. Balance after month-end bills.', '~Balance will be cleared by the 20th.'],
    em: ['+Part payment made, balance next week.'],
    call: ['~Arvind said finance is clearing vendors on the 20th.'],
    promise: 7, next: 'Balance of ₹2,34,070 expected around 20 Nov', stage: 'Promise to Pay',
    sum: 'Part payment of ₹1,00,000 received. Arvind committed the balance by the 20th.',
  },
  {
    name: 'Kothari Corporate Gifts', owner: 'Rajesh Kothari', city: 'Mumbai', gstin: '27AAFCK7702P1ZA',
    email: 'rajesh@kotharigifts.com', phone: '+91 98200 90153', kind: 'Corporate Gifting', terms: 30,
    invs: [
      { age: 61, amt: 412880, items: 'Diwali hamper fill, Monthly Dry Fruits Combo x 200', pay: [[24, 412467, 413]] },
      { age: 22, amt: 752340, items: 'Popular Nuts Combo x 300, Dry Fruits Combo 850g x 180, International King Medjoul Dates 200g x 240' },
    ],
    wa: ['+Got it. Client has approved PO, our payment is in the November run.'],
    promise: 8, next: 'Check back after 21 Nov', sum: 'Rajesh confirmed it is in the November payment run. Previous invoice was paid net of 0.1 percent TDS.',
  },
  {
    name: 'Hotel Grand Orchid', owner: 'Imran Qureshi', city: 'Bengaluru', gstin: '29AABCH9981F1Z8',
    email: 'purchase@grandorchid.in', phone: '+91 98450 27719', kind: 'HoReCa', terms: 30,
    invs: [
      { age: 62, amt: 71300, items: 'Premium Whole Cashew Nuts 200g x 90, Seedless Afghani Black Raisins 250g x 60', pay: [[27, 71300]] },
      { age: 33, amt: 89240, items: 'Raw Mamra Almonds 250g x 30, Dried Afghani Anjeer 200g x 60, Premium Fard Dates 500g x 40' },
      { age: 6, amt: 38760, items: 'Raw Mamra Almonds 250g x 24, Premium Whole Cashew Nuts 200g x 40' },
    ],
    wa: ['', '~Cheque is signed, waiting for GM to release it.'], em: ['~Cheque to be couriered.'],
    promise: 2, next: 'Confirm cheque dispatch with purchase desk', sum: 'Imran says cheque is signed and waiting on the GM. Expected in two days.',
  },
  {
    name: 'Nutri Basket Mart', owner: 'Farhan Sheikh', city: 'Mumbai', gstin: '27AAHFN4410K1ZX',
    email: 'nutribasket.mart@gmail.com', phone: '+91 98339 40872', kind: 'Modern Trade', terms: 30,
    invs: [{ age: 58, amt: 176420, items: 'Premium Nutritious Nutty Trail Mix 200g x 360, Nuts and Berries Mix 200g x 240' }],
    wa: ['', '~Sales slow this month, will pay in installments.', '-Last cheque bounced from our supplier side, give us till month end.', '-We said month end, please stop daily messages.'],
    em: ['~Please send ledger confirmation.'], call: ['', '-Farhan asked not to call the shop number again, will call back himself.'],
    promise: -2, stage: 'Reminder 3', next: 'Broken promise on 11 Nov. Offer 2 instalments or hold next order',
    sum: 'Farhan gave a month-end promise twice and missed the 11 Nov date. Offered instalments; no commitment yet.',
  },
  {
    name: 'Gupta Dry Fruit Emporium', owner: 'Manoj Gupta', city: 'Delhi', gstin: '07AAJFG6623J1ZH',
    email: 'guptadryfruits@gmail.com', phone: '+91 98100 22934', kind: 'Kirana Wholesaler', terms: 15,
    invs: [
      { age: 45, amt: 64180, items: 'International Omani Dates 250g x 180, Dried Californian Whole Cranberries 200g x 60', pay: [[22, 64180]] },
      { age: 12, amt: 38950, items: 'Peri Peri Makhana 55g x 240, Raw Sunflower Seeds 250g x 60' },
    ],
    wa: ['+Last bill cleared, this one will go on due date.'], promise: 2, next: 'None before due date', sum: 'Paid the earlier bill after one reminder. New invoice not yet due.',
  },
  {
    name: 'Daily Needs Hypermart', owner: 'Suresh Reddy', city: 'Hyderabad', gstin: '36AACCD3380G1ZM',
    email: 'finance@dailyneeds.in', phone: '+91 99120 58846', kind: 'Modern Trade', terms: 30,
    invs: [
      { age: 63, amt: 314200, items: 'Jumbo Californian Almonds 400g x 120, Premium Whole Cashew Nuts 200g x 240', pay: [[33, 314200]] },
      { age: 11, amt: 208350, items: 'Super Mom\'s Trail Mix 325g x 150, Premium International Sports Mix 350g x 120' },
      { age: 5, amt: 164280, items: 'Jumbo Californian Almonds 400g x 90, Raw Pumpkin Seeds 200g x 120' },
    ],
    wa: ['+Reminder noted, vendor payment day is 28th.'], promise: 15, next: 'None until 28 Nov vendor payment day', sum: 'Suresh confirmed the 28th as their vendor payment day.',
  },
  {
    name: 'NutriKart Online', owner: 'Abhishek Jha', city: 'Bengaluru', gstin: '29AAECN1187R1ZD',
    email: 'payables@nutrikart.in', phone: '+91 97410 66230', kind: 'E-commerce Reseller', terms: 15,
    invs: [
      { age: 29, amt: 432615, items: 'Premium Fox Nuts 100g x 480, Peri Peri Makhana 55g x 720, Raw Pumpkin Seeds 200g x 240', pay: [[5, 432615]] },
      { age: 8, amt: 286430, items: 'Cream & Onion Makhana 55g x 960, Daily Super Health Mix 160g x 360' },
    ],
    wa: ['', '+Paid, UTR shared by mail.'], em: ['+Payment released this morning.'], promise: 7, next: 'None, newer invoice not yet due',
    sum: 'Paid the 29-day-old invoice in full after the second reminder. New invoice is within terms.',
  },
  {
    name: 'Southern Fresh Retail - Regional Office', owner: 'Gayathri Subramanian', city: 'Coimbatore', gstin: '33AABCS6045D1ZF',
    email: 'vendorpayables@southernfresh.in', phone: '+91 94430 31877', kind: 'Modern Trade', terms: 45,
    invs: [
      { age: 100, amt: 518370, items: 'Premium Californian Almonds 200g x 600, Daily Super Health Mix 160g x 480', pay: [[41, 517852, 518]] },
      { age: 64, amt: 624810, items: 'Raw Mamra Almonds 250g x 120, Premium Whole Cashew Nuts 200g x 360, Seedless Afghani Green Raisins 200g x 300' },
      { age: 33, amt: 405260, items: 'Premium Nutritious Nutty Trail Mix 200g x 420, Roasted Flax Seeds 250g x 180' },
    ],
    wa: ['', '~Invoice is in the vendor portal, payment on approval.', '~Vendor code mismatch on 2nd invoice, resubmit through portal.'],
    em: ['~Please upload invoices on the vendor portal with GRN reference.', '~GRN pending for DC Hosur, store team following up.'],
    call: ['~Gayathri says portal approval is stuck at category manager.'],
    promise: 12, next: 'Resubmit invoice through the vendor portal with corrected vendor code',
    sum: 'Accounts says payment is blocked by a vendor code mismatch and GRN at the Hosur DC. Resubmission in progress.',
  },
  {
    name: 'Greenleaf Hypermarkets - Karnataka RO', owner: 'Deepak Hegde', city: 'Bengaluru', gstin: '29AAKCG2218E1ZT',
    email: 'ap.karnataka@greenleafhyper.in', phone: '+91 98450 61122', kind: 'Modern Trade', terms: 45,
    invs: [{ age: 52, amt: 563720, items: 'Dried Californian Pitted Prunes 200g x 240, Oven Roasted & Lightly Salted Party Mix 200g x 360, Premium Fard Dates 500g x 180', pay: [[14, 250000]], cn: [20, 12480, 'Near-expiry return, 96 packs Party Mix from two stores'] }],
    wa: ['+Part paid, balance in next payment cycle after CN adjustment.'], em: ['+Debit note has been raised for the return, balance will be released in the next cycle.'],
    promise: 8, next: 'Balance of ₹3,01,240 due in next payment cycle', stage: 'Promise to Pay',
    sum: 'Deepak confirmed part payment of ₹2,50,000 and credit note of ₹12,480 for returned Party Mix. Balance expected next cycle.',
  },
  {
    name: 'Metro Mart Retail - Western Region', owner: 'Sanjay Deshmukh', city: 'Mumbai', gstin: '27AACCM4471B1ZJ',
    email: 'accountspayable@metromartwest.com', phone: '+91 98200 55310', kind: 'Modern Trade', terms: 45,
    invs: [{ age: 94, amt: 876430, items: 'Jumbo Californian Almonds 400g x 300, Premium Whole Cashew Nuts 200g x 480, Premium International Sports Mix 350g x 240, Dried Californian Blueberries 150g x 120' }],
    wa: ['', '~Invoice rejected in system, GRN quantity differs from your invoice.', '-Raised debit note for the difference. Pay the revised value only.', '~Will check with AP head.'],
    em: ['-Invoice does not match PO. Please issue credit note for 36 cartons.', '~Pending with category head.'],
    call: ['~Sanjay is in a review meeting, will revert.', '-AP says they will pay only GRN quantity, rest on credit note.'],
    dispute: 'GRN quantity differs from invoice, retailer asking for credit note on 36 cartons', stage: 'Escalation',
    next: 'Regional Sales Head to meet Metro Mart category head; reconcile GRN and issue credit note',
    sum: 'Retailer rejected the invoice on a GRN mismatch of 36 cartons. Reconciliation under way with the Western region sales team.',
  },
  {
    name: 'Shree Ganesh Kirana Wholesale', owner: 'Dilip Bhosale', city: 'Nagpur', gstin: '27AAHFS3380Q1ZY',
    email: 'shreeganesh.nagpur@gmail.com', phone: '+91 98230 14470', kind: 'Kirana Wholesaler', terms: 15,
    invs: [{ age: 36, amt: 112740, items: 'Raw Sunflower Seeds 250g x 120, Premium Arabian Dates 500g x 150, Daily Super Health Mix 160g x 150' }],
    wa: ['', '~Beta bimar hai, hospital mein hoon. Next week bhejta hu.', '', '~Next week pakka.'], call: ['', '~Said he is travelling, will pay by Saturday.'],
    promise: 1, next: 'Check Saturday payment, else hold next order', sum: 'Dilip has had family health issues and promised payment by Saturday.',
  },
  {
    name: 'Rathod & Sons Wholesale', owner: 'Hitesh Rathod', city: 'Surat', gstin: '24AAJFR5518M1ZS',
    email: 'rathodsons.surat@gmail.com', phone: '+91 98251 77012', kind: 'Kirana Wholesaler', terms: 15,
    invs: [{ age: 21, amt: 84260, items: 'Premium Nutritious Nutty Trail Mix 200g x 150, Cream & Onion Makhana 55g x 240' }],
    wa: ['+Will do tomorrow.', '+Done, screenshot attached.'], promise: 0, next: 'Confirm credit in bank statement', sum: 'Paid yesterday evening, screenshot shared. Needs bank confirmation.',
  },
  {
    name: 'Lakshmi Provision Stores Wholesale', owner: 'Muthu Krishnan', city: 'Chennai', gstin: '33AAKFL9120H1ZW',
    email: 'lakshmiprovision@gmail.com', phone: '+91 98410 55238', kind: 'Kirana Wholesaler', terms: 15,
    invs: [
      { age: 95, amt: 54100, items: 'Dried Afghani Anjeer 200g x 90, Seedless Green Raisins 500g x 60', pay: [[70, 54100]] },
      { age: 27, amt: 69830, items: 'International Omani Dates 250g x 240, Roasted Flax Seeds 250g x 60' },
    ],
    wa: ['', '+Sorry sir, Diwali rush. Paying by Monday.', ''], promise: 3, next: 'Check Monday payment', sum: 'Muthu apologised for delay and promised Monday after the Diwali rush.',
  },
  {
    name: 'Annapurna Dry Fruits Traders', owner: 'Subir Ghosh', city: 'Kolkata', gstin: '19AAEFA7731C1ZU',
    email: 'annapurnadryfruits@gmail.com', phone: '+91 98300 41297', kind: 'Super-stockist', terms: 30,
    invs: [{ age: 84, amt: 264370, items: 'Premium Fard Dates 500g x 300, Classic Panchmewa Dry Fruit Mix 450g x 120, Dried Turkish Apricots 200g x 120' }],
    wa: ['', '~Statement dekhna hai, last bill ka credit note adjust hua ki nahi?', '~Cheque ready, Sunday ko bhej denge.', '', '~Courier ke through bhej diya, track number next week.'],
    em: ['~Please send updated statement.', '+Cheque couriered on 9th, please check.'],
    call: ['~Subir babu asked for statement again.'], promise: 3, next: 'Track cheque courier, confirm receipt at Bengaluru office', stage: 'Promise to Pay',
    sum: 'Subir says a cheque was couriered on 9 Nov. Waiting for it to arrive at the Bengaluru office.',
  },
  {
    name: 'Bharat Gift Hampers', owner: 'Kunal Mathur', city: 'Jaipur', gstin: '08AAFFB4209L1ZQ',
    email: 'orders@bharatgifthampers.in', phone: '+91 98290 63318', kind: 'Corporate Gifting', terms: 30,
    invs: [{ age: 47, amt: 386520, items: 'Monthly Dry Fruits Combo x 180, Popular Nuts Combo x 90, International King Medjoul Dates 200g x 300', pay: [[9, 200000]] }],
    wa: ['', '+1st instalment sent. Corporate client pays us on 25th, will clear rest then.'], em: ['+Balance on 26th latest.'],
    promise: 13, stage: 'Promise to Pay', next: 'Balance of ₹1,86,520 expected by 26 Nov',
    sum: 'Kunal paid ₹2,00,000 and committed the balance once his corporate client pays on the 25th.',
  },
  {
    name: 'Lakeview Residency Hotels', owner: 'Anand Rao', city: 'Bengaluru', gstin: '29AACCL8841K1Z5',
    email: 'accounts@lakeviewresidency.in', phone: '+91 80 2653 1180', kind: 'HoReCa', terms: 30,
    invs: [{ age: 39, amt: 142860, items: 'Premium Whole Cashew Nuts 200g x 180, Raw Mamra Almonds 250g x 24, Dried Californian Blueberries 150g x 48' }],
    wa: ['', '~Bill is with GM for approval. Month-end payout.'], em: ['~Please confirm bank details on letterhead, our system needs vendor update.'],
    promise: 10, next: 'Send bank details on letterhead to Lakeview accounts', sum: 'Hotel accounts asked for bank details on letterhead; payment follows vendor master update.',
  },
  {
    name: 'Spice Route Caterers', owner: 'Rohan Fernandes', city: 'Bengaluru', gstin: '29AAHFS7716P1ZE',
    email: 'rohan@spiceroutecaterers.com', phone: '+91 98860 29004', kind: 'HoReCa', terms: 15,
    invs: [{ age: 44, amt: 57320, items: 'Premium Whole Cashew Nuts 200g x 60, Seedless Afghani Black Raisins 250g x 60' }],
    wa: ['', '~Wedding client has not paid us yet, I will pay when I get it.', '-Told you, 2 weeks more.', ''], call: ['', '~Said event payments are pending, asked for 2 weeks.'],
    promise: -1, stage: 'Reminder 3', next: 'Offer to take part payment now; hold further caterer orders',
    sum: 'Rohan is waiting on his own client payments and asked for two weeks; earlier promise date has passed.',
  },
  {
    name: 'Anand Sweets & Namkeen', owner: 'Anand Kumar Rao', city: 'Hyderabad', gstin: '36AAEFA2204R1ZG',
    email: 'accounts@anandsweets.in', phone: '+91 98480 18265', kind: 'HoReCa', terms: 30,
    invs: [{ age: 18, amt: 126480, items: 'Premium Whole Cashew Nuts 200g x 120, Oven Roasted & Salted Pistachios 200g x 90, Premium Fox Nuts 100g x 150' }],
    wa: ['+Sure sir, will pay on due date.'], promise: 12, next: 'None before due date', sum: 'Acknowledged invoice; plans payment on due date.',
  },
  {
    name: 'DealDukaan Retail', owner: 'Aman Chawla', city: 'Delhi', gstin: '07AAECD5540N1Z9',
    email: 'settlements@dealdukaan.in', phone: '+91 99710 83412', kind: 'E-commerce Reseller', terms: 30,
    invs: [{ age: 56, amt: 371640, items: 'Peri Peri Makhana 55g x 960, Himalayan Salt & Pepper Makhana 55g x 720, Raw Black Chia Seeds 250g x 240' }],
    wa: ['', '~Marketplace deducted returns from our settlement, we need credit note for 88 units.', '~Share CN and we will adjust.', '-Not releasing till CN comes.'],
    em: ['~Please send credit note against returned units. Marketplace RTO deduction is ₹21,360.'], call: ['', '~Aman says send CN for returns, rest will go this week.'],
    dispute: 'Customer deducting ₹21,360 for marketplace RTO returns, asking for credit note', promise: 6, stage: 'Reminder 3',
    next: 'Issue credit note for 88 returned units after sales ops confirms return GRN', sum: 'Aman will pay the balance once a credit note of about ₹21,360 for returned units is issued.',
  },
  {
    name: 'Infinite Corporate Solutions', owner: 'Preeti Menon', city: 'Bengaluru', gstin: '29AAFCI3306G1Z7',
    email: 'procurement@infinitecorp.co.in', phone: '+91 98450 99317', kind: 'Corporate Gifting', terms: 30,
    invs: [
      { age: 106, amt: 604280, items: 'Diwali gift boxes fill: Dry Fruits Combo 850g x 300, Classic Panchmewa Dry Fruit Mix 450g x 240', pay: [[35, 603676, 604]] },
      { age: 66, amt: 912350, items: 'Popular Nuts Combo x 400, Monthly Dry Fruits Combo x 220, International Ajwa Dates 500g x 160' },
    ],
    wa: ['', '~PO closure pending at our end, finance needs TDS certificate for last quarter.', '~TDS cert received, now needs CFO sign-off.', ''],
    em: ['~Kindly share Form 16A for Q1 and Q2.', '+Form 16A received, payment in next batch.'], call: ['~Preeti asked to follow up after finance run on Friday.', '+Confirmed in Friday payment batch.'],
    promise: 0, stage: 'Promise to Pay', next: 'Confirm receipt of Friday batch payment',
    sum: 'Preeti confirmed the invoice is in Friday\'s batch after we shared the TDS certificates.',
  },
  {
    name: 'Siddhi Vinayak Distributors', owner: 'Mahesh Gaikwad', city: 'Pune', gstin: '27AAGFS6602C1ZV',
    email: 'siddhivinayak.pune@gmail.com', phone: '+91 98220 47551', kind: 'State Distributor', terms: 30,
    invs: [{ age: 103, amt: 648900, items: 'Premium Whole Cashew Nuts 200g x 480, Jumbo Premium Whole Cashew Nuts 200g x 240, Premium Californian Almonds 200g x 300, Oven Roasted & Salted Pistachios 200g x 180', pay: [[35, 200000]] }],
    wa: ['', '~Will pay 2 lakh this week.', '~Paid 2 lakh already, rest on 10th.', '-Sir stock is dead in my godown, Diwali sales were bad.', '-Please talk to your sales head.'],
    em: ['~Statement received, will reply.', '-Our partners are not agreeing to release.'],
    call: ['~Mahesh promised 1 lakh by Tuesday.', '-Phone not answered after promise, later said cash flow issue.'],
    founder: true, promise: -3, next: 'Founder to call Mahesh Gaikwad; hold supplies until at least ₹1,50,000 is received',
    sum: 'Mahesh has broken two payment promises on a balance of ₹4,48,900. Account is on supply hold and under founder review.',
  },
  {
    name: 'Madurai Nuts & Spices Co.', owner: 'Karthikeyan R.', city: 'Madurai', gstin: '33AAHFM2815B1ZX',
    email: 'madurainuts@gmail.com', phone: '+91 98421 66204', kind: 'Kirana Wholesaler', terms: 30,
    invs: [{ age: 23, amt: 194350, items: 'Premium Fard Dates 500g x 240, Super Soft Kimia Dates 500g x 120, Raw Pumpkin Seeds 200g x 90' },
      { age: 4, amt: 112540, items: 'International Omani Dates 250g x 150, Dried Californian Whole Cranberries 200g x 60' }],
    wa: ['+Received, due date is 3rd, will pay then.'], promise: 20, next: 'None before due date', sum: 'Karthikeyan acknowledged and intends to pay by due date.',
  },
  {
    name: 'Sri Manjunatha Traders', owner: 'Manjunath Gowda', city: 'Mysuru', gstin: '29AAJFS5127N1ZR',
    email: 'srimanjunathatraders@gmail.com', phone: '+91 98450 83071', kind: 'Kirana Wholesaler', terms: 15,
    invs: [{ age: 33, amt: 98640, items: 'Premium Arabian Dates 500g x 120, Seedless Green Raisins 500g x 60, Nuts and Berries Mix 200g x 90' }],
    wa: ['', '+Sorry sir, bill mixed up with another vendor. Paying today.', '+Paid ₹98,640, UTR 631477920148.'], promise: 0, next: 'Match UTR 631477920148', sum: 'Manjunath paid the full invoice today and shared the UTR.',
  },
  {
    name: 'Mehta Agro Foods', owner: 'Chirag Mehta', city: 'Rajkot', gstin: '24AABFM8836E1ZD',
    email: 'chirag@mehtaagrofoods.com', phone: '+91 98240 31892', kind: 'Super-stockist', terms: 30,
    invs: [{ age: 49, amt: 232410, items: 'Raw Black Chia Seeds 250g x 120, Roasted Flax Seeds 250g x 120, 6 in 1 Super Seeds & Nuts Mix 250g x 180', pay: [[10, 100000]] }],
    wa: ['', '+1 lakh sent last week, balance next Thursday.'], em: ['+Part payment attached.'], promise: 6, stage: 'Promise to Pay', next: 'Balance of ₹1,32,410 due Thursday',
    sum: 'Chirag paid ₹1,00,000 and promised the balance next Thursday.',
  },
  {
    name: 'Agarwal Sweets & Dry Fruits', owner: 'Pankaj Agarwal', city: 'Lucknow', gstin: '09AAGFA4451K1ZH',
    email: 'agarwalsweets.lko@gmail.com', phone: '+91 98390 17265', kind: 'Kirana Wholesaler', terms: 30,
    invs: [{ age: 57, amt: 308260, items: 'Premium Whole Cashew Nuts 200g x 300, International Ajwa Dates 500g x 90, Dried Californian Pitted Prunes 200g x 90' }],
    wa: ['', '~Diwali stock hi bika hai abhi, payment next week dunga.', '', '~Kal bhejta hu.', ''], call: ['', '~Said will visit bank tomorrow.'],
    promise: 1, next: 'Check Saturday bank credit; else call again Monday', sum: 'Pankaj promises payment tomorrow after bank visit; this is his second promise.',
  },
  {
    name: 'Hyderabad Gift Studio', owner: 'Sneha Reddy', city: 'Hyderabad', gstin: '36AAHCH6209J1ZT',
    email: 'accounts@hydgiftstudio.com', phone: '+91 99890 44018', kind: 'Corporate Gifting', terms: 30,
    invs: [{ age: 29, amt: 547120, items: 'Dry Fruits Combo 850g x 320, Monthly Dry Fruits Combo x 160, Premium International Sports Mix 350g x 150' }],
    wa: ['+Thanks for the heads up, payment scheduled for 15th.'], promise: 2, next: 'Confirm UTR after 15 Nov', sum: 'Sneha confirmed payment scheduled for the 15th.',
  },
  {
    name: 'Mahalaxmi Super Stores', owner: 'Nilesh Kale', city: 'Pune', gstin: '27AAGFM1945D1ZN',
    email: 'mahalaxmi.stores@gmail.com', phone: '+91 98230 64718', kind: 'Modern Trade', terms: 30,
    invs: [
      { age: 78, amt: 186540, items: 'Premium Nutritious Nutty Trail Mix 200g x 240, Raw Sunflower Seeds 250g x 150', pay: [[12, 186540]] },
    ],
    wa: ['', '~Payment is under process.', '', '', '+Done, UTR 628740192233.'], em: ['', '', '', '+Payment released, UTR on WhatsApp.'], call: ['', '', '~Will clear this week.'],
    closedSum: 'Nilesh cleared the full ₹1,86,540 on 1 Nov after two reminders and a call. Account closed.',
  },
  {
    name: 'Hotel Sai Palace', owner: 'Raghav Shetty', city: 'Mangaluru', gstin: '29AAECH5538L1ZB',
    email: 'accounts@hotelsaipalace.in', phone: '+91 98450 20316', kind: 'HoReCa', terms: 30,
    invs: [
      { age: 55, amt: 92480, items: 'Premium Whole Cashew Nuts 200g x 90, Seedless Afghani Black Raisins 250g x 90', pay: [[6, 92480]] },
    ],
    wa: ['', '', '', '+Sorry for delay, accountant was on leave. Paid today.'], em: ['', '+Payment advice attached.'],
    closedSum: 'Raghav paid ₹92,480 on 7 Nov after the second reminder. Account closed.',
  },
  {
    name: 'Kashi Dry Fruits Mart', owner: 'Anil Tiwari', city: 'Varanasi', gstin: '09AAIFK3374M1ZC',
    email: 'kashidryfruits@gmail.com', phone: '+91 94150 27730', kind: 'Kirana Wholesaler', terms: 15,
    invs: [
      { age: 49, amt: 138220, items: 'International Queen Kalmi Dates 200g x 240, Raw Pumpkin Seeds 200g x 90', pay: [[18, 70000], [8, 68220]] },
    ],
    wa: ['', '', '', '+70,000 done, rest after weekend collections.', '+Rest also transferred.'], call: ['', '+Will clear remaining by 5th.'],
    closedSum: 'Anil paid in two parts (₹70,000 on 26 Oct and ₹68,220 on 5 Nov). Account closed.',
  },
];

const WA_OFFSETS = [0, 1, 6, 14, 25, 38, 55, 72];
const EM_OFFSETS = [1, 9, 20, 33, 48];
const CALL_OFFSETS = [7, 16, 28, 45, 65];

interface LedgerInv {
  inv: Inv;
  invNo: string;
  voucher: string;
  dateMs: number;
  dueMs: number;
  paid: number;
  tds: number;
  cn: number;
  balance: number;
}

function hashStr(s: string): number {
  let h = 7;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function numbering(): Map<Inv, { invNo: string; voucher: string }> {
  const all: Inv[] = PARTIES.flatMap((p) => p.invs);
  all.sort((a, b) => b.age - a.age);
  const map = new Map<Inv, { invNo: string; voucher: string }>();
  let prev = 0;
  all.forEach((inv, i) => {
    const dayOfFy = Math.floor((NOW - inv.age * DAY - FY_START) / DAY);
    const seq = Math.max(prev + 1, 38 + Math.floor(dayOfFy * 3.6) + (i % 3));
    prev = seq;
    const s = String(seq).padStart(4, '0');
    map.set(inv, { invNo: `HP/26-27/INV/${s}`, voucher: `HP/26-27/SV/${String(seq + 214).padStart(4, '0')}` });
  });
  return map;
}

const NUMS = numbering();

function ledgerInvoices(p: Party): LedgerInv[] {
  return p.invs.map((inv) => {
    const n = NUMS.get(inv)!;
    const paid = (inv.pay ?? []).reduce((s, r) => s + r[1], 0);
    const tds = (inv.pay ?? []).reduce((s, r) => s + (r[2] ?? 0), 0);
    const cn = inv.cn ? inv.cn[1] : 0;
    const dateMs = NOW - inv.age * DAY;
    return { inv, invNo: n.invNo, voucher: n.voucher, dateMs, dueMs: dateMs + p.terms * DAY, paid, tds, cn, balance: Math.max(0, inv.amt - paid - tds - cn) };
  });
}

function buildLedger(): PartyLedgerRow[] {
  const rows: PartyLedgerRow[] = [];
  let id = 1;
  let cnSeq = 27;
  PARTIES.forEach((p) => {
    let running = 0;
    ledgerInvoices(p)
      .sort((a, b) => a.dateMs - b.dateMs)
      .forEach((li) => {
        const closed = li.balance === 0;
        const parts: string[] = [`Terms ${p.terms} days, due ${dmyDash(li.dueMs)}`];
        (li.inv.pay ?? []).forEach((r) => {
          parts.push(`received ${inr(r[1])} on ${dmyDash(NOW - r[0] * DAY)}${r[2] ? ` (net of TDS ${inr(r[2])})` : ''}`);
        });
        if (li.inv.cn) parts.push(`credit note ${inr(li.inv.cn[1])} raised separately`);
        const opening = running;
        running += li.balance;
        const lastPay = li.inv.pay && li.inv.pay.length ? Math.min(...li.inv.pay.map((r) => r[0])) : null;
        rows.push({
          id: id++,
          party_name: p.name,
          opening_balance: fixed(opening),
          particulars: `Sales - ${li.inv.items}`,
          voucher_no: li.voucher,
          bill_no: li.invNo,
          debit: fixed(li.inv.amt),
          credit: fixed(li.paid + li.tds),
          running_balance: fixed(li.balance),
          narration: `${p.city} dispatch. ${parts.join('; ')}.`,
          created_at: iso(li.dateMs + 5 * HOUR),
          email: p.email,
          phone: p.phone,
          closed: closed ? 'yes' : 'no',
          gstin: p.gstin,
          url: null,
          Final_Amount: fixed(li.balance),
          Payment_Date: closed && lastPay !== null ? dmyDash(NOW - lastPay * DAY) : null,
        });
        if (li.inv.cn) {
          const [ago, amt, why] = li.inv.cn;
          const cnNo = `HP/26-27/CN/${String(cnSeq++).padStart(4, '0')}`;
          rows.push({
            id: id++,
            party_name: p.name,
            opening_balance: fixed(running),
            particulars: `Credit Note - ${why}`,
            voucher_no: cnNo,
            bill_no: cnNo,
            debit: '0.00',
            credit: fixed(amt),
            running_balance: '0.00',
            narration: `Against ${li.invNo}, approved by regional sales head.`,
            created_at: iso(NOW - ago * DAY + 6 * HOUR),
            email: p.email,
            phone: p.phone,
            closed: 'yes',
            gstin: p.gstin,
            url: null,
            Final_Amount: '0.00',
            Payment_Date: null,
          });
        }
      });
  });
  return rows;
}

/* ------------------------------ Outreach ------------------------------ */

const sign = (s: string): Sg => (s[0] === '+' ? '+' : s[0] === '-' ? '-' : '~');
const text = (s: string) => s.slice(1);
const SENT_WORD = { '+': 'positive', '~': 'neutral', '-': 'negative' } as const;
const SENTIMENT_SCORE = { positive: 78, neutral: 50, negative: 20 };

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const dmon = (ms: number) => {
  const d = new Date(ms);
  return `${p2(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};
const rs = (n: number) => `Rs ${Math.round(n).toLocaleString('en-IN')}`;
const AT = (ago: number, hm: string) => {
  const [h, m] = hm.split(':').map(Number);
  const d = new Date(NOW - ago * DAY);
  d.setHours(h, m, 0, 0);
  return d.getTime();
};
const MIN = 60_000;
/** Keeps follow-up replies inside working hours (08:00 to 21:00). */
function humanize(ts: number, seed: number): number {
  const d = new Date(ts);
  const h = d.getHours();
  if (h >= 8 && h < 21) return ts;
  if (h >= 21) d.setDate(d.getDate() + 1);
  d.setHours(9 + (seed % 3), (seed * 7) % 60, 0, 0);
  return d.getTime();
}
const CUTOFF = NOW - 10 * MIN;

const BANK = 'Bank details: Happilo International Pvt Ltd | HDFC Bank, Indiranagar Branch, Bengaluru | A/c No. 50200067841932 | IFSC HDFC0000342';
const H_FROM = 'Neha Rao <accounts@happilo.com>';
const H_SIG = 'Regards,\nNeha Rao\nAccounts Receivable, Happilo International Pvt Ltd\nBengaluru | care@happilo.com | +91 88844 84000';

function utrFor(seed: string): string {
  const h = hashStr(seed);
  const h2 = hashStr(seed + 'x');
  return String(400000000000 + ((h * 7919 + h2) % 599999999999)).padStart(12, '0');
}

/** Credit-note numbers, assigned in the same order as the ledger. */
const CN_NO: Map<Inv, string> = (() => {
  const m = new Map<Inv, string>();
  let seq = 27;
  PARTIES.forEach((p) => {
    [...p.invs].sort((a, b) => b.age - a.age).forEach((inv) => {
      if (inv.cn) m.set(inv, `HP/26-27/CN/${String(seq++).padStart(4, '0')}`);
    });
  });
  return m;
})();

interface PCtx {
  p: Party;
  v: Voice;
  lis: LedgerInv[];
  open: LedgerInv[];
  target: LedgerInv;
  cleared: boolean;
  od: number;
  prev?: LedgerInv;
  mgr: [string, string];
  vars: Record<string, string>;
  lastPayAgo: number | null;
}

function pendingAt(li: LedgerInv, ago: number): number {
  let paid = 0;
  (li.inv.pay ?? []).forEach((r) => { if (r[0] >= ago) paid += r[1] + (r[2] ?? 0); });
  if (li.inv.cn && li.inv.cn[0] >= ago) paid += li.inv.cn[1];
  return Math.max(0, li.inv.amt - paid);
}

function itemNames(inv: Inv): string[] {
  return inv.items.split(', ').map((x) => x.replace(/ x \d+$/, '').replace(/^Sales - /, ''));
}

function buildCtx(p: Party, lis: LedgerInv[], target: LedgerInv, cleared: boolean, signed: number): PCtx {
  const open = lis.filter((l) => l.balance > 0);
  const others = lis.filter((l) => l !== target);
  const prev = others.filter((l) => l.balance === 0 && (l.inv.pay?.length ?? 0) > 0).sort((a, b) => b.inv.age - a.inv.age)[0];
  const mgr = MGR[p.city] ?? ['Divya Shenoy', 'divya.shenoy@happilo.com'];
  const names = itemNames(target.inv);
  const second = open.find((l) => l !== target);
  const first = p.owner.split(' ')[0].replace(/\.$/, '');
  const lastPay = target.inv.pay && target.inv.pay.length ? Math.min(...target.inv.pay.map((r) => r[0])) : null;
  const promMs = NOW + (p.promise ?? 3) * DAY;
  const cnInv = [target, ...others].find((l) => l.inv.cn);
  const prevPay = prev?.inv.pay ? prev.inv.pay[prev.inv.pay.length - 1] : undefined;
  const vars: Record<string, string> = {
    first, owner: p.owner, party: p.name, city: p.city, bill: target.invNo, bill2: second?.invNo ?? '',
    amt1: rs(target.inv.amt), bal: rs(cleared ? target.inv.amt : target.balance), amt2: second ? rs(second.balance) : '',
    tot: rs(open.reduce((s, l) => s + l.balance, 0)), due: dmon(target.dueMs), invdate: dmon(target.dateMs), terms: String(p.terms),
    items: names.slice(0, 2).join(' and '), item1: names[0], mgr: mgr[0].split(' ')[0] + ' ' + mgr[0].split(' ')[1], cnNo: cnInv ? CN_NO.get(cnInv.inv) ?? '' : '',
    cn: cnInv?.inv.cn ? rs(cnInv.inv.cn[1]) : '', prom: dmon(promMs), promDay: DAYS[new Date(promMs).getDay()],
    pbill: prev?.invNo ?? '', pamt: prev ? rs(prev.inv.amt) : '', pdue: prev ? dmon(prev.dueMs) : '',
    putr: prev ? utrFor(prev.invNo) : '', utr: utrFor(target.invNo), prevpaid: prevPay ? rs(prevPay[1]) : '',
  };
  return { p, v: VOICES[p.name] ?? {}, lis, open, target, cleared, od: signed, prev, mgr, vars, lastPayAgo: lastPay, };
}

function fill(s: string, c: PCtx, extra: Record<string, string>): string {
  return s.replace(/\{(\w+)\}/g, (_, k) => extra[k] ?? c.vars[k] ?? `{${k}}`);
}

/** Pending amounts at a point in time: due invoices if any, else the invoice in play. */
function amtAt(c: PCtx, ago: number, bills: LedgerInv[]): number {
  const t = NOW - ago * DAY;
  const due = bills.filter((l) => l.dueMs <= t && pendingAt(l, ago) > 0);
  if (due.length) return due.reduce((s, l) => s + pendingAt(l, ago), 0);
  return bills.reduce((s, l) => s + (l.dateMs <= t ? pendingAt(l, ago) : 0), 0) || pendingAt(bills[0], ago);
}

/* ---- Generic stories for the standard journeys ---- */

const PREV_EXCUSE = ['Sorry sir, will release in a day or two.', 'Payment is in process, will send the UTR once done.', 'Ji, accountant is on it. Will do tomorrow.'];

function genWa(c: PCtx): WaStage[] {
  const { p, v, target, od } = c;
  const T = p.terms;
  const st: WaStage[] = [];
  const age = target.inv.age;

  // Earlier history: previous invoice, or the order confirmation
  if (c.prev) {
    const pv = c.prev;
    const payAgo = Math.min(...(pv.inv.pay ?? [[0]]).map((r) => r[0]));
    const dueAgo = Math.floor((NOW - pv.dueMs) / DAY);
    if (payAgo < dueAgo) {
      st.push({ hist: true, ago: Math.max(dueAgo - 1, payAgo + 1), hm: '11:40', s: '~', lines: [
        ['H', 'Hi {first}, invoice {pbill} ({pamt}) was due on {pdue}. Could you share the payment date? Bank details are printed on the invoice.'],
        ['C', PREV_EXCUSE[hashStr(p.name) % 3], 140],
        ['H', 'Thank you. Please send the UTR once it is done.', 10],
      ] });
    }
    const pr = (pv.inv.pay ?? [])[(pv.inv.pay ?? []).length - 1];
    const tdsNote = pr && pr[2] ? ` after TDS of ${rs(pr[2])}` : '';
    st.push({ hist: true, ago: payAgo, hm: '12:20', s: '+', lines: [
      ['H', 'Hi {first}, checking if the payment for {pbill} has been released.', 0],
      ['C', v.prevPay ?? `Payment released today, UTR {putr}. Rs ${pr ? Math.round(pr[1]).toLocaleString('en-IN') : ''}${tdsNote}.`, 95],
      ['H', 'Received with thanks, {first}. {pbill} is now settled in our books.', 35],
    ] });
  } else {
    st.push({ hist: true, ago: age + 2, hm: '16:10', s: '+', lines: [
      ['H', 'Hi {first}, Happilo accounts here. Your order of {items} is confirmed. Credit terms of {terms} days from the invoice date are in place for your account.', 0],
      ['C', 'Thanks. Please dispatch as early as possible, stock is running low.', 85],
      ['H', 'Sure. It will leave our Bengaluru warehouse tomorrow morning and I will share the invoice once it is delivered.', 12],
      ['C', 'Okay.', 20],
    ] });
  }

  // Current invoice cycle
  st.push({ ago: od + T - 2, hm: '11:30', s: '+', lines: [
    ['H', 'Hi {first}, Happilo accounts here. Your consignment was delivered yesterday. Invoice {bill} for {amt1} is attached for your records. Terms are {terms} days, due on {due}.', 0, ['Invoice_' + target.invNo.replace(/\//g, '_') + '.pdf']],
    ['C', v.recv ?? 'Received, thank you.', 95],
    ['H', 'Great. Please let me know if the GST invoice needs any change before you book it.', 12],
  ] });
  const ack = v.ack ?? 'Noted, thanks for the reminder.';
  st.push({ ago: od < -3 ? Math.min(1, od + T - 3) : od + 3, hm: '12:10', s: '+', lines: [
    ['H', 'Hi {first}, a small reminder that invoice {bill} ({amt}) falls due on {due}. Sharing the bank details again for convenience.', 0],
    ['H', 'Happilo International Pvt Ltd | HDFC Bank, Indiranagar, Bengaluru | A/c 50200067841932 | IFSC HDFC0000342', 1],
    ['C', ack, 190],
    ['H', 'Noted, thank you. Please share the UTR once it is done.', 12],
  ] });

  const ex1 = v.ex1 ?? '~Sorry, this slipped. Will arrange it soon.';
  st.push({ off: 1, hm: '10:50', s: sign(ex1), lines: [
    ['H', 'Hi {first}, invoice {bill} ({amt}) was due on {due}. Could you share the payment date? Bank details are printed on the invoice.', 0],
    ['C', text(ex1), 140],
    ['H', 'Understood, {first}. Can you give me a date by which we can expect the transfer?', 10],
    ['C', v.d1 ?? 'By end of this week.', 25],
    ['H', 'Thank you, noted. I will check with you again then.', 6],
  ] });

  const ex2 = v.ex2 ?? '~Will do this week, bit busy with festive orders.';
  st.push({ off: 6, hm: '12:25', s: sign(ex2), lines: [
    ['H', '{first}, following up on {bill}. {amt} is {days} days past due. Please confirm when the transfer will go and send the UTR once it is done.', 0],
    ['C', text(ex2), 210],
    ['H', 'Is there any problem with the goods or the invoice? If yes, please tell me so that I can get it resolved.', 10],
    ['C', v.d2 ?? 'No, all fine. Only timing.', 40],
    ['H', 'Okay, I have noted it. Sending the statement of account so that your accountant can match it.', 8, ['Statement_of_Account_Nov2026.pdf']],
  ] });

  const push = v.push ?? '~Will see this week.';
  const pushLines: Line[] = [
    ['H', 'Dear {first}, {amt} against {bill} is now {days} days overdue. Please release it this week, otherwise we will have to hold your next dispatch.', 0],
    ['C', text(push), 120],
    ['H', 'I do not want to stop your supplies, {first}. Even a part payment this week will help me hold it back.', 12],
  ];
  const p6 = v.p6 ?? (sign(push) === '+' ? '+Yes, noted.' : sign(push) === '~' ? '~Let me check and tell you.' : '-I will see.');
  if (p6) pushLines.push(['C', text(p6), 55]);
  st.push({ off: 14, hm: '11:15', s: sign(push), lines: pushLines });

  st.push({ off: 25, hm: '15:35', s: '~', lines: [
    ['H', '{first}, one more reminder on {bill}, {amt}, {days} days overdue. Our sales manager {mgr} has been informed. Please call me on +91 88844 84000 today so we can close this out.', 0],
    ...(sign(push) === '-' ? [] : ([['C', 'Will call you tomorrow.', 100], ['H', 'Thank you, I will wait for your call.', 6]] as Line[])),
  ] });
  st.push({ off: 38, hm: '12:05', s: '~', lines: [
    ['H', '{first}, {amt} is now {days} days overdue and your account is on supply hold from today. We will release dispatches as soon as the payment is received.', 0],
    ['C', 'Ok, understood.', 80],
  ] });

  // Receipts on the current invoice
  const pays = target.inv.pay ?? [];
  let cum = 0;
  pays.forEach((r, k) => {
    cum += r[1] + (r[2] ?? 0);
    const left = target.inv.amt - cum - (target.inv.cn && target.inv.cn[0] >= r[0] ? target.inv.cn[1] : 0);
    const net = r[2] ? ` after TDS of ${rs(r[2])}` : '';
    const txt = v.payText?.[k] ?? `Payment released today, UTR {utr}. Amount ${rs(r[1])}${net}.`;
    const isLast = k === pays.length - 1;
    const closing = left > 0 && isLast ? `Received ${rs(r[1])} against {bill}, thank you {first}. The balance on this invoice is ${rs(c.cleared ? 0 : target.balance)}.`
      : left > 0 ? `Received ${rs(r[1])} against {bill}, thank you {first}. The balance on this invoice is ${rs(left)}.`
      : 'Received with thanks, {first}. {bill} is now settled in our books.';
    st.push({ ago: r[0], hm: '12:30', s: '+', lines: [
      ['H', 'Hi {first}, checking if the payment for {bill} has been released.', 0],
      ['C', txt.replace('{utr}', utrFor(target.invNo + k)), 110],
      ['H', closing, 35],
    ] });
  });

  if (v.claim) {
    const cl = v.claim;
    st.push({ ago: cl.ago, hm: cl.hm, s: '+', lines: [
      ['H', 'Hi {first}, checking if the payment for {bill} has been released.', 0],
      ['C', cl.text ?? 'Payment done today, UTR {utr}.', 45, cl.att],
      ['H', 'Thank you {first}. We will confirm once it reflects in our account, NEFT usually takes a few hours on a working day.', 18],
    ] });
  }
  return st;
}

const MAIL_OFFS: Array<[number, 'reminder' | 'overdue' | 'final']> = [[2, 'reminder'], [10, 'overdue'], [22, 'overdue'], [36, 'final'], [52, 'final']];

function genEm(c: PCtx): MailStage[] {
  const { p, v, target, od } = c;
  const T = p.terms;
  const st: MailStage[] = [];
  const hrsOf = (i: number) => 3 + ((hashStr(p.name) + i * 5) % 22);
  st.push({ ago: od + T - 2, hm: '11:20', kind: 'invoice', s: '+', thread: [{ w: 'C', hrs: hrsOf(0), body: (v.recv ?? 'Received, thank you.') }] });
  let replies = (v.em ?? []).slice();
  let receipt: string | null = null;
  if (c.cleared && replies.length && replies[replies.length - 1].startsWith('+')) receipt = text(replies.pop() as string);
  MAIL_OFFS.forEach(([off, kind], j) => {
    const r = replies[j] ?? '';
    const sg: Sg = r ? sign(r) : '~';
    const thread: MailMsg[] = [];
    if (r) {
      thread.push({ w: 'C', hrs: hrsOf(j + 1), body: text(r) });
      if (sg === '-') {
        thread.push({ w: 'H', hrs: 3, fwd: true, body: '{mgrFirst}, please see the mail below from {party}. Invoice {bill}, open amount {amt}. Could you speak with {first} ji and let me know what is holding up the payment?' });
        thread.push({ w: 'H', hrs: 4, cc: true, body: 'Understood. I have looped in our sales manager {mgr}, who will speak with you. We will revert with an update within two working days.' });
      } else if (sg === '~') {
        thread.push({ w: 'H', hrs: 3, att: ['Statement_of_Account_Nov2026.pdf'], body: 'Thank you for the quick revert. The statement of account is attached for your reference. Kindly confirm the expected payment date so that we can note it.' });
      } else {
        thread.push({ w: 'H', hrs: 3, body: 'Thank you, noted. We will match the receipt against {bill} on arrival. Please share the UTR once the payment is released.' });
      }
    }
    st.push({ off, kind, s: sg, hm: `${10 + ((hashStr(p.name) + j) % 4)}:${p2((hashStr(p.name) * (j + 3)) % 60)}`, thread });
  });
  if (c.prev) {
    const pv = c.prev;
    const payAgo = Math.min(...(pv.inv.pay ?? [[0]]).map((r) => r[0]));
    const pr = (pv.inv.pay ?? [])[(pv.inv.pay ?? []).length - 1];
    st.push({ hist: true, ago: payAgo + 1, hm: '15:20', kind: 'reminder', s: '+', thread: [
      { w: 'C', hrs: 20, att: ['Payment_Advice_UTR_' + utrFor(pv.invNo) + '.pdf'], body: `Payment of ${rs(pr ? pr[1] : pv.inv.amt)} for ${pv.invNo} has been released today. UTR {putr}. Advice attached.` },
      { w: 'H', hrs: 2, body: 'Thank you, we have received the payment and {pbill} is now settled.' },
    ] });
  }
  if (receipt !== null) {
    const lastAgo = c.lastPayAgo ?? 0;
    st.push({ ago: lastAgo + 1, hm: '15:30', kind: 'reminder', s: '+', thread: [
      { w: 'C', hrs: 19, att: ['Payment_Advice.pdf'], body: receipt },
      { w: 'H', hrs: 2, body: 'Thank you, we have received the payment and {bill} is now settled in our books.' },
    ] });
  }
  return st;
}

const PROBES: string[] = [
  'I understand, {first} ji. Is there anything on our side that I can help sort out?',
  'Is it only the timing then, or is there any issue with the goods or the invoice?',
];

const CALLS_DEFAULT: Record<string, string[]> = {
  'Balaji Wholesale Mart': ['~Ramesh ji asked for ten more days.'],
  'Hotel Grand Orchid': ['', '~Imran said the cheque is signed and waiting for the GM.', '~Confirmed the cheque will be couriered in two days.'],
  'Lakshmi Provision Stores Wholesale': ['~Muthu said he will pay on Monday after the Diwali rush.'],
  'Mehta Agro Foods': ['', '+Chirag confirmed the balance next Thursday.'],
  'Bharat Gift Hampers': ['', '+Kunal confirmed the balance by 26 Nov.'],
  'Lakeview Residency Hotels': ['~Anand Rao said the bill is with the GM for approval.'],
  'Sri Manjunatha Traders': ['', '+Manjunath said he will pay today.'],
  'Hotel Sai Palace': ['', '~Raghav said the accountant is on leave.'],
};

function genCall(c: PCtx): CallStage[] {
  const { p, v } = c;
  const outcomes = p.call ?? CALLS_DEFAULT[p.name] ?? [];
  const OFFS = [7, 16, 28, 45, 65];
  const st: CallStage[] = [];
  const connectedIdx: number[] = [];
  OFFS.forEach((_, i) => { if (outcomes[i]) connectedIdx.push(i); });
  const lastConn = connectedIdx.length ? connectedIdx[connectedIdx.length - 1] : -1;
  OFFS.forEach((off, i) => {
    const o = outcomes[i];
    if (o === undefined) return;
    const hm = `${11 + ((hashStr(p.name) + i * 3) % 6)}:${p2((hashStr(p.name) * (i + 2)) % 60)}`;
    if (o === '') {
      st.push(i % 2 === 0
        ? { off, hm, status: 'no-answer', summary: 'No answer. Will try again next working day.' }
        : { off, hm, status: 'voicemail', summary: 'Voicemail left asking for a call back.' });
      return;
    }
    const sg = sign(o);
    const S = [v.ex1, v.d1, v.ex2, v.d2, v.push].map((x, k) => (x === undefined ? undefined : k === 0 || k === 2 || k === 4 ? text(x) : x));
    const window = i === 0 ? [S[0], S[1]] : i === 1 ? [S[2], S[3]] : [S[4], S[3]];
    const a = window[0] ?? text(o);
    const b = window[1] ?? 'Just a matter of timing, nothing else.';
    const reason: Line[] = [
      ['C', a], ['H', PROBES[0]], ['C', b], ['H', PROBES[1]],
      ['C', sg === '-' ? 'The goods are fine. I am not in a position to discuss it today.' : 'No no, goods are fine. Only timing, nothing else.'],
    ];
    const isLast = i === lastConn;
    const promised = sg !== '-' && isLast && p.promise !== undefined && p.promise >= 0;
    const dateWord = promised ? `${DAYS[new Date(NOW + (p.promise as number) * DAY).getDay()]}, ${dmon(NOW + (p.promise as number) * DAY)}` : 'this week';
    const commit: Line[] = sg === '-'
      ? [['H', 'Could you give me any date at all, {first} ji?'], ['C', 'Not now. I will tell you when I can.'], ['H', 'Okay, I will keep it noted and not call for a few days.'], ['C', 'Fine.']]
      : [['H', 'So by when can I note the payment, {first} ji?'], ['C', promised ? `${dateWord}. Pakka.` : 'Let me see, by end of this week.'], ['H', `Noted. I will mark ${promised ? dateWord : 'the end of this week'} on my side.`], ['C', 'Okay.']];
    st.push({
      off, hm, status: 'connected', s: sg,
      summary: o.slice(1),
      ptpFromNow: promised ? (p.promise as number) : undefined,
      ptpDays: !promised && sg === '+' ? 4 + (hashStr(p.name) % 3) : null,
      reason, commit,
    });
  });
  return st;
}

/* ---- Resolve stories into timed messages ---- */

interface TimedLine { w: 'H' | 'C'; text: string; ts: number; att?: string[] }
interface TimedWa { stage: WaStage; ts0: number; lines: TimedLine[]; sg: Sg; hist: boolean }
interface TimedMail { stage: MailStage; ts0: number; msgs: Array<{ w: 'H' | 'C'; ts: number; subject: string; from: string; to: string; cc: string; att: string[]; body: string }>; sg: Sg; hist: boolean }
interface TimedCall { stage: CallStage; ts: number; turns: TimedLine[]; dur: string | null; ptp: number | null }

function stageAgo(s: { off?: number; ago?: number }, od: number): number {
  return s.ago !== undefined ? s.ago : od - (s.off as number);
}

function resolveWa(stages: WaStage[], c: PCtx): TimedWa[] {
  const out: TimedWa[] = [];
  stages.forEach((s) => {
    const ago = stageAgo(s, c.od);
    if (ago < 0) return;
    if (c.cleared && c.lastPayAgo !== null && !s.hist && ago < c.lastPayAgo) return;
    let ts = AT(ago, s.hm);
    const lines: TimedLine[] = [];
    const bills = [...c.open.length ? c.open : [c.target]];
    const amt = rs(amtAt(c, ago, c.cleared ? [c.target] : bills));
    const days = String(Math.max(1, Math.floor((AT(ago, s.hm) - c.target.dueMs) / DAY)));
    s.lines.forEach((ln, i) => {
      if (i > 0) ts = humanize(ts + (ln[2] ?? 5) * MIN, hashStr(ln[1]) + i);
      if (!ln[1]) return;
      if (ts > CUTOFF) return;
      lines.push({ w: ln[0], text: fill(ln[1], c, { amt, days }), ts, att: ln[3] });
    });
    if (!lines.some((l) => l.w === 'H')) return;
    out.push({ stage: s, ts0: lines[0].ts, lines, sg: s.s ?? '~', hist: Boolean(s.hist) });
  });
  out.sort((a, b) => a.ts0 - b.ts0);
  while (out.length > 8) out.shift();
  while (out.length > 3 && out.reduce((n, t) => n + t.lines.length, 0) > 22) out.shift();
  return out;
}

const attInvoice = (bill: string) => `Invoice_${bill.replace(/\//g, '_')}.pdf`;

function mailTable(c: PCtx, bills: LedgerInv[], ago: number): { text: string; total: number } {
  const rows = bills.filter((l) => l.dateMs <= NOW - ago * DAY && pendingAt(l, ago) > 0);
  const use = rows.length ? rows : [bills[0]];
  const head = 'Invoice No.            Date         Due date     Amount (Rs)   Pending (Rs)';
  const body = use.map((l) => `${l.invNo.padEnd(22)} ${dmon(l.dateMs).padEnd(12)} ${dmon(l.dueMs).padEnd(12)} ${Math.round(l.inv.amt).toLocaleString('en-IN').padEnd(13)} ${Math.round(pendingAt(l, ago)).toLocaleString('en-IN')}`);
  const total = use.reduce((s, l) => s + pendingAt(l, ago), 0);
  return { text: [head, ...body, `Total pending: ${rs(total)}`].join('\n'), total };
}

function resolveMail(stages: MailStage[], c: PCtx): TimedMail[] {
  const out: TimedMail[] = [];
  const cust = `${c.p.owner} <${c.p.email}>`;
  const mgrAddr = `${c.mgr[0]} <${c.mgr[1]}>`;
  stages.forEach((s) => {
    const ago = stageAgo(s, c.od);
    if (ago < 0) return;
    if (c.cleared && c.lastPayAgo !== null && !s.hist && ago < c.lastPayAgo) return;
    const isPrev = Boolean(s.hist && c.prev);
    const bills = isPrev ? [c.prev as LedgerInv] : (c.open.length ? c.open : [c.target]);
    const billsForTable = c.cleared && !isPrev ? [c.target] : bills;
    const ref = billsForTable[0];
    const t0 = AT(ago, s.hm);
    const days = String(Math.max(1, Math.floor((t0 - ref.dueMs) / DAY)));
    const subjAmt = Math.round(pendingAt(ref, ago)).toLocaleString('en-IN');
    const pendingNow = rs(amtAt(c, ago, billsForTable));
    const extra: Record<string, string> = { amt: pendingNow, days, mgrFirst: c.mgr[0].split(' ')[0] };
    if (isPrev) { extra.bill = ref.invNo; extra.amt1 = rs(ref.inv.amt); extra.due = dmon(ref.dueMs); extra.invdate = dmon(ref.dateMs); }
    const dueFuture = ref.dueMs > t0;
    const stmt = `Statement_of_Account_${MONTHS[new Date(t0).getMonth()]}${new Date(t0).getFullYear()}.pdf`;
    const inv = attInvoice(ref.invNo);
    let subject = s.subject ?? '';
    let intro = '';
    let atts = s.att;
    switch (s.kind) {
      case 'invoice':
        subject ||= `Invoice ${ref.invNo} - Rs ${Math.round(ref.inv.amt).toLocaleString('en-IN')}, due ${dmon(ref.dueMs)}`;
        intro = `Please find attached invoice ${ref.invNo} dated ${dmon(ref.dateMs)} for ${rs(ref.inv.amt)}, dispatched from our Bengaluru warehouse to your ${c.p.city} godown. Payment terms are ${c.p.terms} days from the invoice date, so the due date is ${dmon(ref.dueMs)}.`;
        atts ??= [inv];
        break;
      case 'statement':
        subject ||= `Statement of account as on ${dmon(t0)} - ${c.p.name}`;
        intro = `Please find attached your statement of account as on ${dmon(t0)}. It lists the invoices that are open on our books. Kindly review it against your records and let us know if anything does not match.`;
        atts ??= [stmt];
        break;
      case 'reminder':
        subject ||= `Payment reminder: invoice ${ref.invNo} - Rs ${subjAmt}`;
        intro = `This is a gentle reminder that the invoice below ${dueFuture ? 'falls due on' : 'was due on'} ${dmon(ref.dueMs)}. If the payment has already been released, kindly share the UTR so that we can match it.`;
        atts ??= [inv, stmt];
        break;
      case 'overdue':
        subject ||= `Overdue invoice ${ref.invNo} - Rs ${subjAmt}`;
        intro = `The invoice below is ${days} days past its due date. We would appreciate it if the payment could be released this week. If there is any issue with the goods or the documents, please let us know so that we can resolve it quickly.`;
        atts ??= [inv, stmt];
        break;
      default:
        subject ||= `Final reminder: overdue invoice ${ref.invNo} - Rs ${subjAmt}`;
        intro = `Despite our earlier reminders the amount below remains unpaid, now ${days} days past the due date. Further dispatches to your account will be on hold until it is regularised. Please call me on +91 88844 84000, or reply to this email with the payment date today.`;
        atts ??= [inv, stmt];
    }
    const table = mailTable(c, billsForTable, ago);
    const wantsCc = s.cc ?? (s.kind === 'overdue' || s.kind === 'final');
    const msgs: TimedMail['msgs'] = [];
    const firstBody = s.first ? fill(s.first, c, extra)
      : `Dear ${c.vars.first},\n\n${intro}\n\n${table.text}\n\n${BANK}\n\n${H_SIG}`;
    msgs.push({ w: 'H', ts: t0, subject, from: H_FROM, to: cust, cc: wantsCc ? mgrAddr : '', att: atts ?? [], body: firstBody });
    let ts = t0;
    let lastC = '';
    s.thread.forEach((m) => {
      ts = humanize(ts + (m.hrs ?? 4) * 3_600_000, hashStr(subject) + msgs.length);
      if (ts > CUTOFF) return;
      const body = fill(m.body, c, extra);
      if (m.w === 'C') {
        lastC = body;
        msgs.push({ w: 'C', ts, subject: `Re: ${subject}`, from: cust, to: 'Neha Rao <accounts@happilo.com>', cc: '', att: m.att ?? [],
          body: `Dear Neha,\n\n${body}\n\nRegards,\n${c.p.owner}\n${c.p.name}, ${c.p.city}\n${c.p.phone}` });
      } else if (m.fwd) {
        msgs.push({ w: 'H', ts, subject: `Fwd: Re: ${subject}`, from: H_FROM, to: mgrAddr, cc: c.p.founder ? 'Aarav Khanna <founder@happilo.com>' : '', att: m.att ?? [],
          body: `${c.mgr[0].split(' ')[0]},\n\n${body}\n\nRegards,\nNeha\n\n---------- Forwarded message ----------\nFrom: ${cust}\nSubject: Re: ${subject}\n\n${lastC}` });
      } else {
        msgs.push({ w: 'H', ts, subject: `Re: ${subject}`, from: H_FROM, to: cust, cc: m.cc ? mgrAddr : '', att: m.att ?? [],
          body: `Dear ${c.vars.first},\n\n${body}\n\n${H_SIG}` });
      }
    });
    out.push({ stage: s, ts0: t0, msgs, sg: s.s ?? '~', hist: Boolean(s.hist) });
  });
  out.sort((a, b) => a.ts0 - b.ts0);
  while (out.length > 8) out.shift();
  return out;
}

function mmss(sec: number) { return `${p2(Math.floor(sec / 60))}:${p2(sec % 60)}`; }

function resolveCall(stages: CallStage[], c: PCtx, scripted = false): TimedCall[] {
  const out: TimedCall[] = [];
  const eng = ['Modern Trade', 'Corporate Gifting', 'HoReCa', 'E-commerce Reseller'].includes(c.p.kind);
  stages.forEach((s, idx) => {
    const ago = stageAgo(s, c.od);
    if (ago < 0) return;
    if (c.cleared && c.lastPayAgo !== null && ago < c.lastPayAgo) return;
    const ts = AT(ago, s.hm);
    if (ts > CUTOFF) return;
    const days = String(Math.max(1, Math.floor((ts - c.target.dueMs) / DAY)));
    const amt = rs(amtAt(c, ago, c.cleared ? [c.target] : (c.open.length ? c.open : [c.target])));
    const extra = { amt, days };
    const turns: TimedLine[] = [];
    let ptp: number | null = null;
    if (s.status === 'connected') {
      const v = eng ? (hashStr(c.p.name + idx) % 2 === 0 ? 0 : 2) : hashStr(c.p.name + idx) % 3;
      const pick = (a: [string, string, string]) => a[v];
      const opener: Line[] = scripted
        ? [['H', 'Hello, am I speaking with {owner} ji from {party}? This is Neha calling from Happilo International, Bengaluru, accounts team.']]
        : [
        ['H', 'Namaste, am I speaking with {owner} ji from {party}?'],
        ['C', pick(['Yes, speaking. Who is this?', 'Haan ji, boliye.', 'Yes, this is {first}. Tell me.'])],
        ['H', 'Namaste {first} ji, this is Neha from Happilo International, Bengaluru, accounts team. Is this a good time for two minutes?'],
        ['C', pick(['Yes, go ahead.', 'Haan bolo, kya baat hai?', 'Quickly please, I am a little busy.'])],
        ['H', Number(days) > 0 && ts > c.target.dueMs ? 'Thank you. I am calling regarding invoice {bill} dated {invdate}. The pending amount on our books is {amt}, due on {due}, which is now {days} days overdue.' : 'Thank you. I am calling regarding invoice {bill} dated {invdate}. The pending amount on our books is {amt}, due on {due}.'],
        ['C', pick(['Hmm, one second, let me recall which one that is.', 'Kaun sa invoice? Ek minute, yaad karta hu.', 'Okay, which consignment is this?'])],
        ['H', 'It is the dispatch to your {city} godown, {items}.'],
        ['C', pick(['Yes yes, the {item1} one. I remember.', 'Haan, wo {item1} wala. Yaad hai.', 'Okay, that one. Yes.'])],
        ['H', 'Our records show {amt} outstanding against it. Does that match what you have?'],
        ['C', pick(['Let me check with my accountant, but roughly yes.', 'Haan, lagbhag wahi hoga.', 'Yes, that looks right.'])],
      ];
      const recap: Line[] = scripted
        ? [
          ['H', 'Just to recap for my notes, {first} ji: the open amount on our books is {amt}, against invoice {bill} dated {invdate}, due on {due}.'],
          ['C', pick(['Yes, that is what we have also.', 'Haan, wahi hai.', 'Yes, noted.'])],
          ['H', s.ptpFromNow !== undefined || s.ptpDays ? 'And I am noting the date you have given me against this invoice.' : 'I will put down what we discussed and share it with our sales manager as well.'],
          ['C', pick(['Sure.', 'Haan ji.', 'Okay.'])],
        ]
        : [];
      const lines: Line[] = [
        ...opener,
        ...(s.reason ?? []),
        ...(s.commit ?? []),
        ...recap,
        ['H', 'Thank you {first} ji. I will send the statement and the bank details on WhatsApp right after this call.'],
        ['C', pick(['Okay, send it.', 'Haan bhej do.', 'Fine.'])],
        ['H', 'Please share the UTR once the payment is released so that we can mark it on our side. Is there anything else I can help with?'],
        ['C', pick(['No, that is all.', 'Nahi, bas.', 'No, thanks.'])],
        ['H', 'Thank you for your time. Have a good day.'],
        ['C', pick(['Thanks, bye.', 'Theek hai, rakhta hu.', 'Bye.'])],
      ];
      const merged: Line[] = [];
      lines.forEach((ln, k) => {
        if (!scripted && k === 10 && ln[0] === 'C') merged.push(['H', 'Thank you. May I ask what is holding the payment up at your end?']);
        const last = merged[merged.length - 1];
        if (last && last[0] === ln[0]) merged[merged.length - 1] = [last[0], `${last[1]} ${ln[1]}`];
        else merged.push(ln);
      });
      let t = ts;
      merged.forEach((ln) => { t += 6000 + (ln[1].length * 55); turns.push({ w: ln[0], text: fill(ln[1], c, extra), ts: t }); });
      if (s.ptpFromNow !== undefined) ptp = NOW + s.ptpFromNow * DAY;
      else if (s.ptpDays) ptp = ts + s.ptpDays * DAY;
    }
    const dur = s.status === 'connected' ? mmss(Math.round((turns[turns.length - 1].ts - ts) / 1000)) : null;
    out.push({ stage: s, ts, turns, dur, ptp });
  });
  out.sort((a, b) => a.ts - b.ts);
  while (out.length > 8) out.shift();
  return out;
}

function waStatus(tl: TimedWa, i: number, hasLater: boolean, ts: number): 'sent' | 'delivered' | 'read' {
  void tl; void i;
  return hasLater || ts < NOW - DAY ? 'read' : 'delivered';
}

function buildOutreach(): RecoveryOutreachRow[] {
  const out: RecoveryOutreachRow[] = [];
  let id = 1;
  PARTIES.forEach((p) => {
    const lis = ledgerInvoices(p).sort((a, b) => a.dateMs - b.dateMs);
    const open = lis.filter((l) => l.balance > 0);
    const cleared = open.length === 0;
    const target = cleared ? lis[lis.length - 1] : open[0];
    const totalOwed = open.reduce((s, l) => s + l.balance, 0);
    const overdueOpen = open.filter((l) => l.dueMs < NOW);
    const overdueAmt = overdueOpen.reduce((s, l) => s + l.balance, 0);
    const signed = Math.floor((NOW - target.dueMs) / DAY);
    const overdueDays = Math.max(0, signed);
    const dueStr = ddmmyyyy(target.dueMs);
    void dueStr;

    const c = buildCtx(p, lis, target, cleared, signed);
    const story = SPECIAL[p.name];
    const waT = resolveWa(story?.wa ?? genWa(c), c);
    const emT = resolveMail(story?.em ?? genEm(c), c);
    const clT = resolveCall(story?.call ?? genCall(c), c, Boolean(story?.call));

    // Overall sentiment = the party's most recent reply on any channel
    const sig: Array<[number, Sg]> = [];
    waT.forEach((t) => { const r = t.lines.filter((l) => l.w === 'C').pop(); if (r) sig.push([r.ts, t.sg]); });
    emT.forEach((t) => { const r = t.msgs.filter((l) => l.w === 'C').pop(); if (r) sig.push([r.ts, t.sg]); });
    clT.forEach((t) => { if (t.stage.status === 'connected') sig.push([t.ts, t.stage.s ?? '~']); });
    sig.sort((a, b) => a[0] - b[0]);
    const sentiment: 'positive' | 'neutral' | 'negative' = cleared ? 'positive' : SENT_WORD[sig.length ? sig[sig.length - 1][1] : '~'];

    const stage = cleared
      ? 'Closed'
      : p.stage ?? (p.founder ? 'Founder Review' : overdueDays > 45 ? 'Escalation' : overdueDays > 25 ? 'Reminder 3' : overdueDays > 12 ? 'Reminder 2' : overdueDays > 0 ? 'Reminder 1' : 'Invoice Issued');
    const disputed = Boolean(p.dispute);

    const allTs: number[] = [];
    const cycleTs: number[] = [];
    waT.forEach((t) => { t.lines.forEach((l) => allTs.push(l.ts)); if (!t.hist) cycleTs.push(t.ts0); });
    emT.forEach((t) => { t.msgs.forEach((l) => allTs.push(l.ts)); if (!t.hist) cycleTs.push(t.ts0); });
    clT.forEach((t) => { allTs.push(t.ts); cycleTs.push(t.ts); });
    const cycleStart = cycleTs.length ? Math.min(...cycleTs) : target.dueMs;
    const lastActivity = allTs.length ? Math.max(...allTs) : target.dateMs;
    const payDate = cleared ? dmyDash(NOW - Math.min(...(target.inv.pay ?? [[0, 0]]).map((r) => r[0])) * DAY) : null;

    const row: Record<string, unknown> = {
      id: id++,
      party_name: p.name,
      email: p.email,
      phone: p.phone,
      gstin: p.gstin,
      overdue_amount: String(Math.round(cleared ? 0 : overdueAmt)),
      current_stage: stage,
      next_action: cleared ? 'None, payment received' : p.next ?? 'Send next reminder on WhatsApp',
      next_action_date: cleared ? null : ddmmyyyy(NOW + (p.promise !== undefined && p.promise > 0 ? Math.min(p.promise, 7) : 2) * DAY),
      status: cleared ? 'Closed' : disputed ? 'Disputed' : 'Open',
      dispute: p.dispute ?? 'no',
      founder_review: p.founder ? 'yes' : 'no',
      bill_no: target.invNo,
      voucher_no: target.voucher,
      transaction_date: ddmmyyyy(target.dateMs),
      cycle_started_date: ddmmyyyy(cycleStart),
      sentiment,
      sentiment_score: String(SENTIMENT_SCORE[sentiment] + (hashStr(p.name) % 9) - 4),
      intent: cleared ? 'paid' : disputed ? 'dispute' : sentiment === 'positive' ? 'will_pay' : sentiment === 'neutral' ? 'needs_time' : 'refusing',
      summary: cleared ? p.closedSum ?? 'Cleared in full.' : p.sum ?? 'Follow-up in progress.',
      closed: cleared ? 'yes' : 'no',
      Final_Amount: String(Math.round(cleared ? 0 : totalOwed)),
      Payment_Date: payDate,
      running_balance: String(Math.round(cleared ? 0 : totalOwed)),
      oldest_due_date: ddmmyyyy(target.dueMs),
      max_overdue_days: String(cleared ? 0 : overdueDays),
      created_at: iso(cycleStart),
      updated_at: iso(cleared ? NOW - Math.min(...(target.inv.pay ?? [[1, 0]]).map((r) => r[0])) * DAY : lastActivity),
      debit: String(Math.round(target.inv.amt)),
      credit: String(Math.round(target.paid + target.tds + target.cn)),
    };

    const noteFor = (s: Sg, ch: 'wa' | 'email') =>
      ch === 'wa' ? (s === '-' ? 'Customer pushing back' : s === '+' ? 'Positive, payment likely' : 'Needs time or documents')
        : (s === '-' ? 'Customer disputing or refusing' : s === '+' ? 'Payment commitment received' : 'Asked for documents');

    // WhatsApp
    const waConv: ConversationEntry[] = [];
    const flatWa = waT.flatMap((t, ti) => t.lines.map((l, li) => ({ t, ti, l, li })));
    for (let n = 1; n <= 8; n++) {
      const t = waT[n - 1];
      if (!t) {
        for (const f of ['date', 'content', 'status', 'sent_at', 'sentiment', 'note', 'reply']) row[`wa_${n}_${f}`] = null;
        continue;
      }
      const firstH = t.lines.find((l) => l.w === 'H') as TimedLine;
      const firstC = t.lines.find((l) => l.w === 'C' && l.ts >= firstH.ts) ?? t.lines.find((l) => l.w === 'C');
      row[`wa_${n}_date`] = ddmmyyyy(firstH.ts);
      row[`wa_${n}_content`] = firstH.text;
      row[`wa_${n}_status`] = firstC ? 'replied' : firstH.ts < NOW - 2 * DAY ? 'read' : 'delivered';
      row[`wa_${n}_sent_at`] = ddmmyyyyHm(firstH.ts);
      row[`wa_${n}_sentiment`] = firstC ? SENT_WORD[t.sg] : null;
      row[`wa_${n}_note`] = firstC ? noteFor(t.sg, 'wa') : null;
      row[`wa_${n}_reply`] = firstC ? firstC.text : null;
    }
    flatWa.forEach(({ t, ti, l }) => {
      const later = flatWa.some((o) => o.l.w === 'C' && o.l.ts > l.ts);
      const entry: ConversationEntry = { role: l.w === 'H' ? 'business' : 'customer', stage: `WA ${ti + 1}`, channel: 'whatsapp', message: l.text, timestamp: ddmmyyyyHm(l.ts) };
      if (l.w === 'H') entry.delivery = waStatus(t, ti, later, l.ts);
      if (l.att && l.att.length) entry.attachments = l.att;
      waConv.push(entry);
    });
    row.wa_conversation = waConv;

    // Email
    const emConv: ConversationEntry[] = [];
    for (let n = 1; n <= 8; n++) {
      const t = emT[n - 1];
      if (!t) {
        for (const f of ['date', 'content', 'status', 'sent_at', 'sentiment', 'note', 'reply']) row[`email_${n}_${f}`] = null;
        continue;
      }
      const first = t.msgs[0];
      const reply = t.msgs.find((m) => m.w === 'C');
      row[`email_${n}_date`] = ddmmyyyy(first.ts);
      row[`email_${n}_content`] = `Subject: ${first.subject}\n\n${first.body}`;
      row[`email_${n}_status`] = reply ? 'replied' : 'delivered';
      row[`email_${n}_sent_at`] = ddmmyyyyHm(first.ts);
      row[`email_${n}_sentiment`] = reply ? SENT_WORD[t.sg] : null;
      row[`email_${n}_note`] = reply ? noteFor(t.sg, 'email') : null;
      row[`email_${n}_reply`] = reply ? reply.body.replace(/^Dear Neha,\n\n/, '').split('\n\nRegards,')[0] : null;
      t.msgs.forEach((m) => {
        emConv.push({
          role: m.w === 'H' ? 'business' : 'customer', stage: `Email ${n}`, channel: 'email', message: m.body, timestamp: ddmmyyyyHm(m.ts),
          subject: m.subject, from: m.from, to: m.to, ...(m.cc ? { cc: m.cc } : {}), ...(m.att.length ? { attachments: m.att } : {}),
        });
      });
    }
    row.email_conversation = emConv;

    // Calls
    for (let n = 1; n <= 8; n++) {
      const t = clT[n - 1];
      if (!t) {
        for (const f of ['date', 'content', 'status', 'sent_at', 'sentiment', 'note', 'recording_url', 'duration', 'promise_date']) row[`call_${n}_${f}`] = null;
        continue;
      }
      const s = t.stage;
      row[`call_${n}_date`] = ddmmyyyy(t.ts);
      row[`call_${n}_status`] = s.status;
      row[`call_${n}_sent_at`] = ddmmyyyyHm(t.ts);
      row[`call_${n}_recording_url`] = null;
      row[`call_${n}_duration`] = t.dur;
      row[`call_${n}_promise_date`] = t.ptp ? ddmmyyyy(t.ptp) : null;
      row[`call_${n}_note`] = s.summary;
      if (s.status === 'connected') {
        row[`call_${n}_content`] = t.turns.map((x) => `${x.w === 'H' ? 'Neha (Happilo Accounts)' : p.owner}: ${x.text}`).join('\n');
        row[`call_${n}_sentiment`] = SENT_WORD[s.s ?? '~'];
      } else if (s.status === 'voicemail') {
        row[`call_${n}_content`] = `Neha (Happilo Accounts) [voicemail]: Namaste ${c.vars.first} ji, this is Neha from Happilo International, Bengaluru. I am calling about invoice ${target.invNo}. Please call me back on +91 88844 84000 when you are free. Thank you.`;
        row[`call_${n}_sentiment`] = null;
      } else {
        row[`call_${n}_content`] = 'Rang eight times, no answer. Will try again next working day.';
        row[`call_${n}_sentiment`] = null;
      }
    }

    out.push(row as unknown as RecoveryOutreachRow);
  });
  return out;
}

export interface ReceivablesDataset {
  ledger: PartyLedgerRow[];
  outreach: RecoveryOutreachRow[];
}

const g = globalThis as unknown as { __happiloAR?: ReceivablesDataset };
export function getReceivablesDataset(): ReceivablesDataset {
  if (!g.__happiloAR) g.__happiloAR = { ledger: buildLedger(), outreach: buildOutreach() };
  return g.__happiloAR;
}

/* ------------------------- Executive board summary ------------------------- */

export interface PartyBalance {
  name: string;
  owner: string;
  email: string;
  phone: string;
  outstanding: number;
  overdueDays: number;
  lastReminder: string;
  stage: string;
  invoices: { invNo: string; amount: number; date: string }[];
}

/** Open parties, largest overdue balances first. Same figures as the ledger. */
export function getPartyBalances(): PartyBalance[] {
  const { outreach } = getReceivablesDataset();
  const res: PartyBalance[] = [];
  for (const p of PARTIES) {
    const lis = ledgerInvoices(p).filter((l) => l.balance > 0).sort((a, b) => a.dateMs - b.dateMs);
    if (!lis.length) continue;
    const o = outreach.find((r) => r.party_name === p.name);
    const sentAts: number[] = [];
    if (o) {
      const r = o as unknown as Record<string, string | null>;
      for (const ch of ['wa', 'email', 'call']) {
        for (let n = 1; n <= 8; n++) {
          const s = r[`${ch}_${n}_sent_at`];
          const m = s?.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
          if (m) sentAts.push(new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1])).getTime());
        }
      }
    }
    res.push({
      name: p.name,
      owner: p.owner,
      email: p.email,
      phone: p.phone,
      outstanding: Math.round(lis.reduce((s, l) => s + l.balance, 0)),
      overdueDays: Math.max(0, Math.floor((NOW - lis[0].dueMs) / DAY)),
      lastReminder: sentAts.length ? isoDay(Math.max(...sentAts)) : 'None',
      stage: o?.current_stage ?? 'Invoice Issued',
      invoices: lis.map((l) => ({ invNo: l.invNo, amount: Math.round(l.balance), date: isoDay(l.dateMs) })),
    });
  }
  return res.sort((a, b) => b.outstanding - a.outstanding);
}
