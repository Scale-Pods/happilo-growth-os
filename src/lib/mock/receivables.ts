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
    promise: 2, next: 'Check Saturday payment, else hold next order', sum: 'Dilip has had family health issues and promised payment by Saturday.',
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
    promise: 1, stage: 'Promise to Pay', next: 'Confirm receipt of Friday batch payment',
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

const sign = (s: string): 'positive' | 'neutral' | 'negative' => (s[0] === '+' ? 'positive' : s[0] === '-' ? 'negative' : 'neutral');
const text = (s: string) => s.slice(1);
const SENTIMENT_SCORE = { positive: 78, neutral: 50, negative: 20 };

interface Touch {
  ch: 'wa' | 'email' | 'call';
  idx: number;
  at: number;
  reply: string;
  replyAt: number;
}

function plan(p: Party, overdueSigned: number): Touch[] {
  const touches: Touch[] = [];
  const base = hashStr(p.name);
  const mk = (ch: Touch['ch'], offsets: number[], replies: string[] | undefined) => {
    offsets.forEach((off, idx) => {
      if (off > overdueSigned) return;
      const dueMs = NOW - overdueSigned * DAY;
      const hourOfDay = 10 + ((base + idx * 7) % 7);
      const day0 = new Date(dueMs + off * DAY);
      day0.setHours(hourOfDay, (base + idx * 13) % 60, 0, 0);
      const at = Math.min(day0.getTime(), NOW - 2 * HOUR);
      const reply = replies?.[idx] ?? '';
      const replyAt = Math.min(at + (1 + ((base + idx) % 18)) * HOUR, NOW - 20 * 60_000);
      touches.push({ ch, idx, at, reply, replyAt });
    });
  };
  const wa0 = overdueSigned <= -3 ? Math.max(-(p.terms - 2), overdueSigned) : -3;
  mk('wa', [wa0, ...WA_OFFSETS.slice(1)], p.wa);
  mk('email', EM_OFFSETS, p.em);
  mk('call', CALL_OFFSETS, p.call);
  return touches;
}

function waText(first: string, idx: number, bill: string, amt: string, off: number, due: string): string {
  switch (idx) {
    case 0: return `Hi ${first}, Happilo accounts here. Invoice ${bill} (${amt}) falls due on ${due}. Sharing it for your records. Let us know if you need another copy.`;
    case 1: return `Hi ${first}, invoice ${bill} (${amt}) was due on ${due}. Could you share the payment date? Bank details are printed on the invoice.`;
    case 2: return `${first}, following up on ${bill}. ${amt} is ${off} days past due. Please confirm when we can expect the transfer and send the UTR once it is done.`;
    case 3: return `Dear ${first}, ${amt} against ${bill} is now ${off} days overdue. Please release it this week, otherwise we will have to hold your next dispatch.`;
    default: return `${first}, one more reminder on ${bill}, ${amt}, ${off} days overdue. Our sales head has been informed. Please call Neha on +91 88844 84000 today so we can close this out.`;
  }
}

function emailText(owner: string, idx: number, bill: string, amt: string, off: number, due: string): string {
  const sig = 'Regards,\nNeha Rao\nAccounts Receivable, Happilo International Pvt Ltd\nBengaluru | care@happilo.com | +91 88844 84000';
  switch (idx) {
    case 0: return `Subject: Statement of account and invoice ${bill}\n\nDear ${owner},\n\nPlease find attached your statement of account and invoice ${bill} for ${amt}, which was due on ${due}. Kindly let us know the expected payment date.\n\n${sig}`;
    case 1: return `Subject: Reminder - ${bill} pending for ${off} days\n\nDear ${owner},\n\nThis is a gentle reminder that ${amt} against ${bill} is still outstanding. If payment is already released, please share the UTR so we can match it.\n\n${sig}`;
    case 2: return `Subject: Overdue payment - ${bill}\n\nDear ${owner},\n\nInvoice ${bill} is now ${off} days past due (${amt}). We would appreciate payment this week. If there is any issue with the goods or documents, please tell us so that we can resolve it.\n\n${sig}`;
    default: return `Subject: Final notice before supply hold - ${bill}\n\nDear ${owner},\n\n${amt} against ${bill} is overdue by ${off} days despite repeated reminders. Further dispatches will be held until the account is regularised. Please call me on +91 88844 84000 to discuss.\n\n${sig}`;
  }
}

function callContent(first: string, bill: string, amt: string, reply: string): string {
  if (!reply) return `Called twice, no answer. Will try again next working day.`;
  return `Neha (Happilo Accounts): Namaste ${first} ji, Neha from Happilo International, Bengaluru. Calling about ${bill}, ${amt}.\n${first}: ${text(reply)}\nNeha: Thank you, I have noted that. I will send the details on WhatsApp.`;
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
    // For cleared accounts the cycle ran against the invoice paid last.
    const signed = Math.floor((NOW - target.dueMs) / DAY);
    const overdueDays = cleared ? Math.max(0, signed) : Math.max(0, signed);
    const dueStr = ddmmyyyy(target.dueMs);
    const amtStr = inr(cleared ? target.inv.amt : overdueAmt || target.balance);

    let touches = plan(p, signed);
    if (cleared) {
      // Cycle ended when the payment came in; drop touches after the last receipt.
      const lastPayAgo = Math.min(...(target.inv.pay ?? [[0, 0]]).map((r) => r[0]));
      touches = touches.filter((t) => t.at < NOW - lastPayAgo * DAY);
    }
    touches.sort((a, b) => a.at - b.at);

    const lastReplied = [...touches].reverse().find((t) => t.reply);
    const sent = lastReplied ? sign(lastReplied.reply) : 'neutral';
    const sentiment = cleared ? 'positive' : sent;

    const stage = cleared
      ? 'Closed'
      : p.stage ?? (p.founder ? 'Founder Review' : overdueDays > 45 ? 'Escalation' : overdueDays > 25 ? 'Reminder 3' : overdueDays > 12 ? 'Reminder 2' : overdueDays > 0 ? 'Reminder 1' : 'Invoice Issued');
    const disputed = Boolean(p.dispute);
    const cycleStart = touches.length ? touches[0].at : target.dueMs;
    const lastTouch = touches.length ? touches[touches.length - 1] : null;
    const lastActivity = lastTouch ? Math.max(lastTouch.at, lastTouch.reply ? lastTouch.replyAt : 0) : target.dateMs;
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

    const first = p.owner.split(' ')[0].replace(/\.$/, '');
    // WhatsApp
    const waT = touches.filter((t) => t.ch === 'wa');
    const waConv: ConversationEntry[] = [];
    for (let n = 1; n <= 8; n++) {
      const t = waT[n - 1];
      if (!t) {
        for (const f of ['date', 'content', 'status', 'sent_at', 'sentiment', 'note', 'reply']) row[`wa_${n}_${f}`] = null;
        continue;
      }
      const off = Math.max(1, Math.round((t.at - target.dueMs) / DAY));
      const content = waText(first, t.idx, target.invNo, amtStr, off, dueStr);
      row[`wa_${n}_date`] = ddmmyyyy(t.at);
      row[`wa_${n}_content`] = content;
      row[`wa_${n}_status`] = t.reply ? 'replied' : t.at < NOW - 2 * DAY ? 'read' : 'delivered';
      row[`wa_${n}_sent_at`] = ddmmyyyyHm(t.at);
      row[`wa_${n}_sentiment`] = t.reply ? sign(t.reply) : null;
      row[`wa_${n}_note`] = t.reply ? (sign(t.reply) === 'negative' ? 'Customer pushing back' : sign(t.reply) === 'positive' ? 'Positive, payment likely' : 'Needs time or documents') : null;
      row[`wa_${n}_reply`] = t.reply ? text(t.reply) : null;
      waConv.push({ role: 'business', stage: `WA ${n}`, channel: 'whatsapp', message: content, timestamp: ddmmyyyyHm(t.at) });
      if (t.reply) waConv.push({ role: 'customer', stage: `WA ${n}`, channel: 'whatsapp', message: text(t.reply), timestamp: ddmmyyyyHm(t.replyAt) });
    }
    row.wa_conversation = waConv;

    // Email
    const emT = touches.filter((t) => t.ch === 'email');
    const emConv: ConversationEntry[] = [];
    for (let n = 1; n <= 8; n++) {
      const t = emT[n - 1];
      if (!t) {
        for (const f of ['date', 'content', 'status', 'sent_at', 'sentiment', 'note', 'reply']) row[`email_${n}_${f}`] = null;
        continue;
      }
      const off = Math.max(1, Math.round((t.at - target.dueMs) / DAY));
      const body = emailText(p.owner, t.idx, target.invNo, amtStr, off, dueStr);
      row[`email_${n}_date`] = ddmmyyyy(t.at);
      row[`email_${n}_content`] = body;
      row[`email_${n}_status`] = t.reply ? 'replied' : 'delivered';
      row[`email_${n}_sent_at`] = ddmmyyyyHm(t.at);
      row[`email_${n}_sentiment`] = t.reply ? sign(t.reply) : null;
      row[`email_${n}_note`] = t.reply ? (sign(t.reply) === 'negative' ? 'Customer disputing or refusing' : sign(t.reply) === 'positive' ? 'Payment commitment received' : 'Asked for documents') : null;
      row[`email_${n}_reply`] = t.reply ? text(t.reply) : null;
      emConv.push({ role: 'business', stage: `Email ${n}`, channel: 'email', message: body, timestamp: ddmmyyyyHm(t.at) });
      if (t.reply) emConv.push({ role: 'customer', stage: `Email ${n}`, channel: 'email', message: text(t.reply), timestamp: ddmmyyyyHm(t.replyAt) });
    }
    row.email_conversation = emConv;

    // Calls
    const clT = touches.filter((t) => t.ch === 'call');
    for (let n = 1; n <= 8; n++) {
      const t = clT[n - 1];
      if (!t) {
        for (const f of ['date', 'content', 'status', 'sent_at', 'sentiment', 'note', 'recording_url']) row[`call_${n}_${f}`] = null;
        continue;
      }
      row[`call_${n}_date`] = ddmmyyyy(t.at);
      row[`call_${n}_content`] = callContent(first, target.invNo, amtStr, t.reply);
      row[`call_${n}_status`] = t.reply ? 'connected' : 'no-answer';
      row[`call_${n}_sent_at`] = ddmmyyyyHm(t.at);
      row[`call_${n}_sentiment`] = t.reply ? sign(t.reply) : null;
      row[`call_${n}_note`] = t.reply ? (sign(t.reply) === 'positive' ? 'Promise to pay noted' : sign(t.reply) === 'negative' ? 'Customer unwilling, escalate' : 'Asked to call back') : 'No answer';
      row[`call_${n}_recording_url`] = null;
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
