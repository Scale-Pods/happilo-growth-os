/**
 * Scripted recovery conversations (WhatsApp, email, phone) for the Happilo
 * receivables demo. Text uses {placeholders} that the dataset builder fills in
 * from the party ledger, so every amount and date matches the books.
 *
 * Placeholders: {first} {owner} {party} {city} {bill} {bill2} {amt} {amt1} {bal} {amt2} {tot}
 * {due} {invdate} {items} {item1} {mgr} {cnNo} {cn} {prom} {promDay} {days} {terms} {utr}
 * {pbill} {pamt} {pdue} {putr}
 */

export type Sg = '+' | '~' | '-';
export type Who = 'H' | 'C';
/** [speaker, text, minutes after the previous line, attachments] */
export type Line = [Who, string, number?, string[]?];

export interface WaStage {
  /** Earlier cycle or onboarding chat, not part of the current recovery cycle. */
  hist?: boolean;
  /** Days after the due date (negative = before). */
  off?: number;
  /** Or: days before today (wins over off). */
  ago?: number;
  hm: string;
  s?: Sg;
  lines: Line[];
}

export interface MailMsg {
  w: Who;
  body: string;
  /** Hours after the previous message. */
  hrs?: number;
  att?: string[];
  /** Internal forward to the sales manager. */
  fwd?: boolean;
  cc?: boolean;
}

export type MailKind = 'invoice' | 'statement' | 'reminder' | 'overdue' | 'final';

export interface MailStage {
  hist?: boolean;
  off?: number;
  ago?: number;
  hm: string;
  kind: MailKind;
  s?: Sg;
  /** Replace the generated opening email body. */
  first?: string;
  subject?: string;
  att?: string[];
  cc?: boolean;
  thread: MailMsg[];
}

export interface CallStage {
  off?: number;
  ago?: number;
  hm: string;
  status: 'connected' | 'no-answer' | 'voicemail';
  s?: Sg;
  summary: string;
  /** Promise-to-pay as days from the call (null = no date given). */
  ptpDays?: number | null;
  /** Absolute promise-to-pay as days from today (overrides ptpDays). */
  ptpFromNow?: number;
  reason?: Line[];
  commit?: Line[];
}

export interface Story {
  wa?: WaStage[];
  em?: MailStage[];
  call?: CallStage[];
}

/** Customer voice for the standard late-payer journey. Sign prefix: + positive, ~ neutral, - negative. */
export interface Voice {
  recv?: string;
  ack?: string;
  ex1?: string;
  d1?: string;
  ex2?: string;
  d2?: string;
  push?: string;
  p6?: string;
  /** Replies to successive reminder emails (sign prefixed, '' = no reply). */
  em?: string[];
  /** Customer wording for each receipt on the current invoice (in order). */
  payText?: string[];
  /** Customer wording for the earlier invoice's payment. */
  prevPay?: string;
  /** Payment claimed but not yet in the bank. */
  claim?: { ago: number; hm: string; utr: string; att?: string[]; text?: string };
}

export const MGR: Record<string, [string, string]> = {
  Hyderabad: ['Rohit Bansal', 'rohit.bansal@happilo.com'],
  Chennai: ['Arun Pillai', 'arun.pillai@happilo.com'],
  Madurai: ['Arun Pillai', 'arun.pillai@happilo.com'],
  Coimbatore: ['Arun Pillai', 'arun.pillai@happilo.com'],
  Bengaluru: ['Divya Shenoy', 'divya.shenoy@happilo.com'],
  Mysuru: ['Divya Shenoy', 'divya.shenoy@happilo.com'],
  Mangaluru: ['Divya Shenoy', 'divya.shenoy@happilo.com'],
  Delhi: ['Sandeep Chauhan', 'sandeep.chauhan@happilo.com'],
  Lucknow: ['Sandeep Chauhan', 'sandeep.chauhan@happilo.com'],
  Varanasi: ['Sandeep Chauhan', 'sandeep.chauhan@happilo.com'],
  Jaipur: ['Sandeep Chauhan', 'sandeep.chauhan@happilo.com'],
  Mumbai: ['Pooja Iyer', 'pooja.iyer@happilo.com'],
  Pune: ['Pooja Iyer', 'pooja.iyer@happilo.com'],
  Nagpur: ['Pooja Iyer', 'pooja.iyer@happilo.com'],
  Ahmedabad: ['Hardik Vora', 'hardik.vora@happilo.com'],
  Surat: ['Hardik Vora', 'hardik.vora@happilo.com'],
  Rajkot: ['Hardik Vora', 'hardik.vora@happilo.com'],
  Kolkata: ['Sourav Dutta', 'sourav.dutta@happilo.com'],
};

/** Standard customer voices for the generated journeys, keyed by party name. */
export const VOICES: Record<string, Voice> = {
  'Sharma Traders': {},
  'Om Sai Agencies': {
    ack: 'Thanks, will pay in a day or two.',
    claim: { ago: 0, hm: '10:05', utr: '641289773105', text: 'Payment done today sir, UTR 641289773105. Amount {amt}.' },
  },
  'Balaji Wholesale Mart': {
    recv: 'Mil gaya bill. Saman uthaya ja chuka hai.',
    ack: 'Ji dekhte hain, abhi shaadi ka season hai, stock ka paisa phasa hua hai.',
    ex1: '~Wedding season mein stock lag gaya hai, 10 din aur do please.',
    d1: 'Agle hafte Friday tak pakka kar denge sir. Kuch hissa pehle bhej dunga.',
    ex2: '~Sir bola na 10 din. Dhanteras ki sale ke baad poora clear karunga.',
    d2: 'Half payment next week, baaki Dhanteras sales ke baad. Bas isse zyada abhi nahi ho payega.',
    push: '~Next dispatch rokna mat sir, season ka time hai. Half payment Monday ko bhejta hu.',
    em: ['~Send fresh statement please.', '~Statement mil gaya. Half payment next week.'],
  },
  'Jain Brothers Distribution': {
    recv: 'Invoice received, thanks. Stock also checked and OK.',
    ack: 'Thanks for the reminder, we pay on due date as usual.',
    em: ['+Noted, payment will go on the due date.'],
  },
  'Patel Super Bazaar': {
    recv: 'Maal mil gaya, sab theek hai.',
    ack: 'Will pay on Monday, noted.',
    em: ['+Okay, Monday payment.'],
  },
  'Fresh & Fine Supermart': {
    recv: 'Received. GRN done at all three stores.',
    ack: 'Okay noted. Our payment run is at month end, I will check with finance.',
    ex1: '+Part payment of 1 lakh went on 1st. Balance after month-end bills.',
    d1: 'Rest of the balance by the 20th, finance has put it in the run.',
    ex2: '~Balance will be cleared by the 20th, finance has confirmed.',
    d2: 'Yes, 20th is final from our side.',
    push: '~Balance will be cleared by the 20th.',
    payText: ['Part payment of 1 lakh sent today, UTR {utr}. Balance after month-end bills.'],
    em: ['+Part payment made on 1st, balance next week.', '+Balance in the 20th run, will send the advice.'],
  },
  'Kothari Corporate Gifts': {
    recv: 'Received the invoice. Passing to our accounts for the client PO.',
    ack: 'Noted. The client is yet to release the final PO payment to us.',
    ex1: '+Got it. Client has approved PO, our payment is in the November run.',
    d1: 'November run, after the 21st. I will send the UTR myself.',
    ex2: '+Yes it is in the run, do not worry.',
    d2: 'After 21st, definitely.',
    push: '+Payment will be released after 21 Nov, it is approved.',
    em: ['+Invoice noted. Payment in the November run, TDS will be deducted as usual.', '+Approved in the run.'],
  },
  'Hotel Grand Orchid': {
    recv: 'Received, thank you. Stores has checked everything.',
    ack: 'Okay, noted. Will inform purchase desk.',
    ex1: '~Cheque is signed, waiting for GM to release it.',
    d1: 'GM is travelling till Wednesday. Cheque will go by courier on Thursday.',
    ex2: '~GM has still not signed the last cheque, he is out of station.',
    d2: 'Courier in two days, I will send the docket number.',
    push: '~Will courier the cheque in two days, I am on it.',
    em: ['~Cheque to be couriered.', '~Cheque signed, courier in two days.'],
  },
  'Gupta Dry Fruit Emporium': {
    recv: 'Mil gaya ji, thank you.',
    ack: 'Last bill cleared, this one will go on due date.',
    em: ['+Noted.'],
  },
  'Daily Needs Hypermart': {
    recv: 'Invoices received and entered in the system.',
    ack: 'Reminder noted, vendor payment day is 28th.',
    em: ['+Please note our vendor payment day is the 28th of every month.'],
  },
  'NutriKart Online': {
    recv: 'Received. Marketplace listing is updated.',
    prevPay: 'Paid, UTR {putr}. Also sent by mail.',
    ack: 'Okay, will arrange. Settlement from marketplace comes on Friday.',
    em: ['+Payment released this morning.'],
  },
  'Shree Ganesh Kirana Wholesale': {
    recv: 'Bill mil gaya.',
    ack: 'Sir thoda ruko, abhi mushkil chal raha hai.',
    ex1: '~Beta bimar hai, hospital mein hoon. Next week bhejta hu.',
    d1: 'Agle hafte Monday ko bhej dunga. Maafi chahta hu.',
    ex2: '~Hospital ka kharcha ho gaya, sab paisa wahin laga hai. Next week pakka.',
    d2: 'Saturday tak karta hu sir, promise.',
    push: '~Next week pakka. Aap order rokna mat.',
    em: [],
  },
  'Rathod & Sons Wholesale': {
    recv: 'Received. Thanks.',
    ack: 'Will do tomorrow.',
    claim: { ago: 1, hm: '19:10', utr: '', att: ['Payment_Screenshot.jpg'], text: 'Done sir, transferred just now. Screenshot attached, amount {amt}.' },
  },
  'Lakshmi Provision Stores Wholesale': {
    recv: 'Bill received.',
    ack: 'Sorry sir, Diwali rush. Paying by Monday.',
    ex1: '+Sorry sir, Diwali rush. Paying by Monday.',
    d1: 'Monday morning I will do the transfer first thing.',
    ex2: '~Shop mein bheed thi sir, bank jaana reh gaya. Monday pakka.',
    d2: 'Monday, I will send the UTR on this number.',
    push: '+Monday sir, I have told my son to do it.',
    em: [],
  },
  'Annapurna Dry Fruits Traders': {
    recv: 'Invoice received. Thank you.',
    ack: 'Statement dekhna hai, last bill ka credit note adjust hua ki nahi?',
    ex1: '~Statement dekhna hai, last bill ka credit note adjust hua ki nahi?',
    d1: 'Statement dekh ke bataunga. Cheque taiyar hai, bas ye clear ho jaye.',
    ex2: '~Cheque ready, Sunday ko bhej denge.',
    d2: 'Sunday ko courier se, 3-4 din mein pahunch jayega.',
    push: '~Courier ke through bhej diya, track number next week bhejunga.',
    p6: '~Courier ka docket number nahi mil raha, office se mangwata hu.',
    em: ['~Please send updated statement.', '+Cheque couriered on 9th, please check.'],
  },
  'Bharat Gift Hampers': {
    recv: 'Received the invoice, thanks.',
    ack: 'Okay. Our corporate client pays us on the 25th, that is when I clear vendors.',
    ex1: '~Our corporate client pays on the 25th, I will clear vendors after that.',
    d1: 'After the 25th, I will send you a part payment before if possible.',
    ex2: '~Will send a part payment this week if possible.',
    d2: 'Part this week, rest after the 25th.',
    push: '+Balance by 26th, as told. First instalment already sent.',
    payText: ['1st instalment sent, UTR {utr}. Corporate client pays us on 25th, will clear rest then.'],
    em: ['+Balance on 26th latest.'],
  },
  'Lakeview Residency Hotels': {
    recv: 'Received, forwarded to our accounts.',
    ack: 'Bill is with the GM for approval, will revert.',
    ex1: '~Bill is with GM for approval. Month-end payout.',
    d1: 'Month-end payout cycle, around the 25th to 28th.',
    ex2: '~Our system needs the bank details on your letterhead before payment, please send.',
    d2: 'Once I get the letterhead, the vendor master update takes 2-3 days.',
    push: '~Waiting for the letterhead copy, then we can process.',
    em: ['~Please confirm bank details on letterhead, our system needs vendor update.', '~Got the letterhead, vendor update in progress.'],
  },
  'Spice Route Caterers': {
    recv: 'Bill received.',
    ack: 'Ok sir.',
    ex1: '~Wedding client has not paid us yet, I will pay when I get it.',
    d1: 'Maybe by the 5th, depends on my client.',
    ex2: '~Event payments are still pending with me, give me 2 weeks.',
    d2: 'Two weeks more. I will call you.',
    push: '-Told you, 2 weeks more. Please stop sending reminders daily.',
    p6: '',
    em: [],
  },
  'Agarwal Sweets & Dry Fruits': {
    recv: 'Maal mil gaya, thank you.',
    ack: 'Ji dekhta hu.',
    ex1: '~Diwali stock hi bika hai abhi, payment next week dunga.',
    d1: 'Agle hafte Monday ya Tuesday tak.',
    ex2: '~Kal bhejta hu, bank jaana hai.',
    d2: 'Kal bank jaake NEFT kar dunga, UTR bhej dunga.',
    push: '~Kal pakka bhejta hu.',
    em: [],
  },
  'Hyderabad Gift Studio': {
    recv: 'Invoice received, thanks. Our client has acknowledged the delivery.',
    ack: 'Thanks for the heads up, payment scheduled for 15th.',
    em: ['+Payment is scheduled for 15 Nov, will share UTR.'],
  },
  'Anand Sweets & Namkeen': {
    recv: 'Received sir.',
    ack: 'Sure sir, will pay on due date.',
    em: [],
  },
  'Madurai Nuts & Spices Co.': {
    recv: 'Bill received, thank you.',
    ack: 'Received, due date is 3rd, will pay then.',
    em: [],
  },
  'Infinite Corporate Solutions': {
    recv: 'Received. Forwarded to our finance for PO matching.',
    ack: 'PO closure is pending at our end, will update.',
    ex1: '~PO closure pending at our end, finance needs TDS certificate for last quarter.',
    d1: 'Once we get the certificate, finance will take it in the next batch.',
    ex2: '~TDS cert received, now needs CFO sign-off.',
    d2: 'CFO is in Dubai till Thursday. Friday batch should include it.',
    push: '+Confirmed in Friday batch, Preeti from finance told me.',
    em: ['~Kindly share Form 16A for Q1 and Q2.', '+Form 16A received, payment in next batch.'],
  },
  'Sri Manjunatha Traders': {
    recv: 'Bill mil gaya sir.',
    ack: 'Okay sir.',
    ex1: '+Sorry sir, bill mixed up with another vendor. Paying today.',
    d1: 'Today itself, I will send the UTR.',
    claim: { ago: 0, hm: '10:20', utr: '631477920148', text: 'Paid Rs 98,640, UTR 631477920148. Please check sir.' },
  },
  'Mehta Agro Foods': {
    recv: 'Received, thanks.',
    ack: 'Okay noted, will see.',
    ex1: '~Accountant is travelling, will send something this week.',
    d1: 'Part payment this week.',
    ex2: '~Part payment in two or three days, rest by Thursday next week.',
    d2: 'Part this week, balance next Thursday.',
    push: '+1 lakh sent last week, balance next Thursday.',
    payText: ['1 lakh sent, UTR {utr}. Balance next Thursday.'],
    em: ['~Part payment will go this week.', '+Part payment attached. Balance on Thursday.'],
  },
  'Mahalaxmi Super Stores': {
    recv: 'Bill received.',
    ack: 'Ji, payment is under process.',
    ex1: '~Payment is under process.',
    d1: 'Within this week.',
    ex2: '~Our accountant is on leave, Sunday tak aa jayega.',
    d2: 'This week surely.',
    push: '~Will clear this week.',
    payText: ['Done, UTR 628740192233.'],
    em: ['', '', '', '+Payment released, UTR on WhatsApp.'],
  },
  'Hotel Sai Palace': {
    recv: 'Received, thank you.',
    ack: 'Okay, we will check with accounts.',
    ex1: '~Accountant is on leave, will do once he is back.',
    d1: 'He is back on Monday. I will remind him.',
    ex2: '~Sorry for the delay, accountant was on leave.',
    d2: 'Will pay as soon as I get the approval.',
    push: '~Will pay this week.',
    payText: ['Sorry for delay, accountant was on leave. Paid today, UTR {utr}.'],
    em: ['', '+Payment advice attached.'],
  },
  'Kashi Dry Fruits Mart': {
    recv: 'Mil gaya.',
    ack: 'Ji.',
    ex1: '~Abhi paisa nahi aaya market se.',
    d1: 'Weekend collections ke baad.',
    ex2: '~Market se paisa abhi aaya nahi, thoda ruko.',
    d2: 'Weekend collections ke baad kuch bhej dunga, baaki 5 tareekh tak.',
    push: '~Weekend collections ke baad kuch bhejta hu.',
    payText: ['70,000 done, rest after weekend collections.', 'Rest also transferred. UTR {utr}.'],
    em: [],
  },
};

/* --------------------------- Hand-written stories --------------------------- */

const SALES = 'Sales manager';

export const SPECIAL: Record<string, Story> = {
  'Venkateshwara FMCG Distributors': {
    wa: [
      { ago: 69, hm: '11:15', s: '+', lines: [
        ['H', 'Namaste {first} ji, Happilo accounts here. Invoice {bill} for {amt1} was delivered to your Hyderabad godown yesterday. Copy attached for your records. Terms are 30 days, due {due}.', 0, ['Invoice_HP_26-27_INV.pdf']],
        ['C', 'Namaste. Received the invoice. Stock is being counted, will let you know.', 190],
      ] },
      { ago: 48, hm: '12:05', s: '-', lines: [
        ['C', 'Rs 3,00,000 sent today as part payment, UTR 424517390866 (HDFC to HDFC). Please note there was shortage in the cashew lot. We got 40 cartons less than invoice.', 0],
        ['H', 'Thank you {first} ji, we have received Rs 3,00,000. Regarding the shortage, could you share the unloading photos and the POD copy with the count?', 22],
        ['C', 'Store manager will send. Pay only after the short supply is credited properly.', 70],
        ['H', 'Understood. I am raising this with Rohit from our sales team and the dispatch team today.', 8],
      ] },
      { ago: 40, hm: '16:20', s: '-', lines: [
        ['H', 'Namaste {first} ji, update on the shortage. Our dispatch team has approved credit note {cnNo} for {cn}, which covers 24 cartons. Copy attached.', 0, ['Credit_Note_HP_26-27_CN_0027.pdf']],
        ['C', 'CN is for 24 cartons only. We received 40 less. I have already told your sales head, Rohit.', 55],
        ['H', 'Noted. The dispatch records show 24 cartons short in the loading sheet. I have asked the Bengaluru warehouse to check the remaining 16 against the transporter POD.', 12],
        ['C', 'Fine. Till then payment is on hold.', 30],
      ] },
      { ago: 33, hm: '11:30', s: '~', lines: [
        ['H', '{first} ji, the due date for {bill} was {due}. Balance after the part payment and credit note is {bal}. Is it possible to release the undisputed part at least?', 0],
        ['C', 'Will check with godown and revert.', 240],
      ] },
      { ago: 20, hm: '15:45', s: '-', lines: [
        ['H', 'Namaste {first} ji, the transporter POD copies are in. Sharing the signed LR and the unloading sheet. Please compare with your store entry.', 0, ['Signed_POD_Hyderabad.pdf', 'Unloading_Sheet.pdf']],
        ['C', 'The signature on POD is of a casual worker, not our store in-charge. We cannot accept it.', 95],
        ['H', 'Understood, I will ask the transporter for the driver statement. Meanwhile can the accounts team confirm the amount you are comfortable releasing?', 15],
        ['C', 'Pay only after reconciliation. Already told your sales head. Payment on hold.', 120],
      ] },
      { ago: 8, hm: '11:10', s: '-', lines: [
        ['H', '{first} ji, invoice {bill2} for {amt2} also fell due today. Together with {bill} the open amount is {tot}. Statement attached.', 0, ['Statement_of_Account_Nov2026.pdf']],
        ['C', 'Both invoices are on hold till the short supply is settled.', 300],
        ['H', 'I understand your position. I am requesting our founder to speak with you personally so that this gets closed.', 20],
      ] },
      { ago: 3, hm: '12:40', s: '~', lines: [
        ['H', 'Namaste {first} ji, our founder Aarav Khanna would like to call you on this. Is tomorrow after 4 pm convenient?', 0],
        ['C', 'Fine, he can call after the warehouse POD check is done. Not before that.', 140],
        ['H', 'Thank you. I will inform him and share the revised POD check with you before the call.', 10],
      ] },
    ],
    em: [
      { ago: 68, hm: '11:40', kind: 'invoice', s: '~', thread: [
        { w: 'C', hrs: 20, body: 'Invoice received. Please send the signed POD copies, our store has not matched the count.' },
        { w: 'H', hrs: 5, body: 'Thank you for the confirmation. We have asked the transporter for the signed POD and will send it by Monday. Please send your store count sheet so that both can be compared together.' },
      ] },
      { ago: 41, hm: '10:30', kind: 'reminder', s: '-', cc: true, thread: [
        { w: 'C', hrs: 26, body: 'Raised with Rohit from your sales team twice. Need revised credit note before release. CN of 24 cartons is not acceptable, we received 40 cartons less.' },
        { w: 'H', hrs: 3, fwd: true, body: 'Rohit, please see the mail below from Venkateshwara FMCG. They are insisting on credit for 40 cartons against the 24 in {cnNo}. Can you check the dispatch loading sheet and join a call with Venkatesh ji this week? Invoice {bill}, balance {bal}.' },
        { w: 'H', hrs: 4, att: ['Credit_Note_HP_26-27_CN_0027.pdf'], body: 'We have checked the dispatch sheet and our sales manager Rohit is coordinating with your Hyderabad store. We will revert with the final position within two working days. Credit note {cnNo} is attached again for reference.' },
      ] },
      { ago: 9, hm: '11:20', kind: 'overdue', s: '-', cc: true, thread: [
        { w: 'C', hrs: 30, body: 'Payment is on hold till reconciliation of the cashew lot is complete. Please do not send further reminders to accounts. Speak to Rohit.' },
        { w: 'H', hrs: 2, body: 'Understood, we will pause automated reminders and keep this with our sales manager and founder office. We would still request you to release the undisputed amount, if any, so that the account stays current.' },
      ] },
    ],
    call: [
      { ago: 24, hm: '12:10', status: 'no-answer', s: undefined, summary: 'No answer.', },
      { ago: 14, hm: '16:05', status: 'connected', s: '~', ptpDays: null, summary: 'Owner says accounts will not release payment against a disputed lot. Told to discuss with Rohit from sales. No payment date given.',
        reason: [
          ['C', 'Look, the issue is not with money, the issue is with the count. 40 cartons of cashew did not reach my godown.'],
          ['H', 'I understand, Venkatesh ji. As per our dispatch sheet 24 cartons were short and a credit note has already been issued. Do you have the unloading photos?'],
          ['C', 'My store manager has them. But the driver has also taken a signature from some labour. That is not our store in-charge.'],
          ['H', 'Okay. So the dispute is about the 16 cartons beyond the credit note. Is the rest of the invoice fine, quality and expiry?'],
          ['C', 'Quality is fine. Only the count. But accounts will not release against a disputed lot, that is our policy.'],
          ['H', 'Could the undisputed part be released? The balance after credit note and part payment is Rs 6,04,215.'],
        ],
        commit: [
          ['C', 'Discuss with Rohit. When Rohit gives the revised credit note, I will clear it in the same week.'],
          ['H', 'Understood. I will ask Rohit to call you tomorrow itself. Can I note that you will review the payment once the revised credit note is in?'],
          ['C', 'Yes, you can note that. Not before.'],
        ] },
      { ago: 3, hm: '15:30', status: 'connected', s: '-', ptpDays: null, summary: 'Declined to discuss payment on call. Asked that only the founder or the sales head contact him until the cashew count dispute is closed.',
        reason: [
          ['C', 'I am telling you again, call me only after Rohit gives the revised CN. Why are you calling again?'],
          ['H', 'Sorry for the repeated call, sir. I wanted to tell you that the transporter has shared the POD and our founder will call you tomorrow.'],
          ['C', 'Founder will call, fine. But I have nothing to say to accounts.'],
          ['H', 'Sure. I will not push for payment today. Only want to make sure you received the POD on WhatsApp and email.'],
          ['C', 'Received. Store is checking. Do not call me for few days.'],
          ['H', 'Alright sir, I will give you time. The founder office will fix the time with you directly.'],
        ],
        commit: [
          ['C', 'Okay. Whatever is correct, we will pay. We have been doing business with Happilo for years.'],
          ['H', 'Thank you {first} ji, we value that. I will note that you will respond after the POD check.'],
          ['C', 'Yes.'],
        ] },
    ],
  },

  'Sharma Traders': {
    wa: [
      { ago: 50, hm: '12:00', s: '+', lines: [
        ['H', 'Namaste Vinod ji, Happilo accounts here. Invoice {bill} for {amt1} was delivered to your Delhi godown today. Copy attached. Terms 30 days, due {due}.', 0, ['Invoice_HP_26-27_INV.pdf']],
        ['C', 'Namaste. Maal aa gaya, theek hai. Thanks.', 95],
      ] },
      { ago: 25, hm: '11:30', s: '~', lines: [
        ['H', 'Vinod ji, small reminder that {bill} ({amt1}) falls due on {due}. Bank details are on the invoice.', 0],
        ['C', 'Ji, dekh lenge.', 260],
      ] },
      { ago: 21, hm: '10:45', s: '~', lines: [
        ['H', 'Namaste Vinod ji, {bill} was due yesterday. Could you share the payment date?', 0],
        ['C', 'Statement bhej do, accountant mismatch dekh raha hai.', 120],
        ['H', 'Sure sir, sending the statement of account right now. It includes both open invoices, GST invoice copies and e-way bill numbers.', 6, ['Statement_of_Account_Nov2026.pdf']],
        ['C', 'Okay mil gaya. Dekhte hain.', 30],
      ] },
      { ago: 14, hm: '12:15', s: '~', lines: [
        ['H', 'Vinod ji, following up on {bill}. It is now {days} days past due. Has your accountant been able to tally the statement?', 0],
        ['C', 'Statement mil gaya, Monday ko process karte hain.', 340],
        ['H', 'Thank you sir. I will check on Tuesday for the UTR.', 4],
      ] },
      { ago: 7, hm: '11:50', s: '~', lines: [
        ['H', 'Namaste Vinod ji, {bill} is {days} days overdue. Monday ka process nahi hua kya? Please let me know if something is stuck from our side.', 0],
        ['C', 'Truck problem tha sir, accountant gaya hua tha Surat. Is week pakka karte hain.', 210],
        ['H', 'Understood. Both invoices together make {tot}. Shall I note a single NEFT for the full amount this week?', 10],
        ['C', 'Haan dono ek saath karenge.', 25],
      ] },
      { ago: 1, hm: '17:20', s: '+', lines: [
        ['H', 'Vinod ji, just checking if all is on track for the combined payment of {tot}.', 0],
        ['C', 'Done, NEFT scheduled for Tuesday morning. Will send UTR.', 40],
        ['H', 'Perfect, thank you sir. I will release your next dispatch for processing as soon as the amount reflects on Tuesday.', 6],
        ['C', 'Okay ji, shukriya.', 12],
      ] },
    ],
    em: [
      { ago: 49, hm: '11:30', kind: 'invoice', s: '+', thread: [
        { w: 'C', hrs: 22, body: 'Invoice received. Please resend both invoice copies with e-way bill numbers, accountant needs them for the book entry.' },
        { w: 'H', hrs: 4, att: ['Invoice_HP_26-27_INV.pdf', 'EwayBill_Copy.pdf'], body: 'Please find attached the invoice copy along with the e-way bill. The second invoice will follow when it is dispatched.' },
      ] },
      { ago: 20, hm: '10:20', kind: 'statement', s: '~', thread: [
        { w: 'C', hrs: 19, body: 'Statement received. Accountant is matching with our books, will revert by Monday.' },
        { w: 'H', hrs: 2, body: 'Thank you. Please let us know in case any invoice or e-way bill is missing. We will send it immediately.' },
      ] },
      { ago: 6, hm: '12:00', kind: 'overdue', s: '+', cc: true, thread: [
        { w: 'C', hrs: 7, body: 'Noted. Payment run is on Tuesday. Both invoices will go together in one NEFT.' },
        { w: 'H', hrs: 2, body: 'Thank you, Vinod ji. We will expect {tot} on Tuesday and will share the receipt on receipt of funds. Please send the UTR once released.' },
      ] },
    ],
    call: [
      { ago: 24, hm: '11:20', status: 'voicemail', summary: 'Voicemail left asking Vinod ji to call back.' },
      { ago: 13, hm: '16:20', status: 'connected', s: '~', ptpDays: null, summary: 'Vinod ji was on a shipment and asked to call after 4 pm. Statement discussed, accountant is tallying and will process Monday.',
        reason: [
          ['C', 'Haan, truck loading chal rahi hai. Statement mil gaya tha.'],
          ['H', 'Great sir. Did your accountant manage to match both invoices with the books?'],
          ['C', 'Pehla invoice match ho gaya. Dusre mein e-way bill number ka difference hai, wo dekh raha hai.'],
          ['H', 'The e-way bill for {bill2} was generated on the day of dispatch, I will send you the number again on WhatsApp right after this call.'],
          ['C', 'Haan wo bhej do. Fir hum payment bana denge.'],
          ['H', 'And the first invoice, {bill}, is already {days} days past due, so that one is more urgent. Can that go on Monday?'],
        ],
        commit: [
          ['C', 'Monday ko hi process karte hain, accountant bol raha tha.'],
          ['H', 'Thank you sir. I have noted Monday for {bill}. I will message you on Tuesday for the UTR.'],
          ['C', 'Theek hai.'],
        ] },
      { ago: 4, hm: '16:40', status: 'connected', s: '+', ptpFromNow: 4, summary: 'Confirmed one NEFT for both invoices on Tuesday morning. Statement of account shared and acknowledged.',
        reason: [
          ['C', 'Haan Neha ji, bolo. Payment ke liye hi call kiya na?'],
          ['H', 'Yes sir, since the Monday payment did not go I wanted to check if there is something I can help with.'],
          ['C', 'Truck problem aur accountant Surat gaya tha, isliye delay hua. Ab sab theek hai.'],
          ['H', 'No problem. The total open amount is Rs 6,99,005 across both invoices. Shall we plan one transfer for the full amount?'],
          ['C', 'Haan, dono ek saath karenge. Total kitna hua, Rs 6,99,005 na?'],
          ['H', 'Correct sir, Rs 4,86,430 for the first invoice and Rs 2,12,575 for the second.'],
        ],
        commit: [
          ['C', 'Tuesday ko subah NEFT kar dunga, UTR bhej dunga.'],
          ['H', 'Perfect, Tuesday the 17th. I will release your next dispatch to the warehouse as soon as it reflects.'],
          ['C', 'Done, thank you.'],
        ] },
    ],
  },

  'Kaveri Trading Co.': {
    wa: [
      { ago: 116, hm: '11:20', s: '+', lines: [
        ['H', 'Namaste Madhavan ji, Happilo accounts here. Invoice {bill} for {amt1} has been dispatched to your Chennai warehouse. Copy attached. Terms are 45 days.', 0, ['Invoice_HP_26-27_INV.pdf']],
        ['C', 'Received. Thanks.', 130],
      ] },
      { ago: 84, hm: '12:30', s: '~', lines: [
        ['H', 'Madhavan ji, a gentle reminder that {bill} falls due on {due}. Could you share the payment date?', 0],
        ['C', 'Which invoice are you talking about? Send details.', 220],
        ['H', 'It is {bill} dated {invdate} for {amt1}: Pistachios x 480, Cashew x 360 and Ajwa Dates x 120. Statement attached.', 8, ['Statement_of_Account_Nov2026.pdf']],
      ] },
      { ago: 80, hm: '14:10', s: '+', lines: [
        ['C', 'Rs 2,00,000 sent as part payment for the cashew and dates, UTR 3326184407921. Pistachio lot we will talk separately.', 0],
        ['H', 'Received with thanks, Madhavan ji. Rs 2,00,000 credited against {bill}. May I know what the concern on the pistachio lot is?', 35],
      ] },
      { ago: 72, hm: '11:45', s: '-', lines: [
        ['C', 'Pistachio lot had short expiry. Retailers returned stock. We will not pay for that.', 0],
        ['H', 'I am sorry to hear that. Can you share the batch number and the photos of the carton labels? I will get our quality team to verify the MFG and expiry dates.', 18],
        ['C', 'Batch details are with the Chennai sales manager. Ask him.', 90],
        ['H', 'Understood, I will take it up with Arun Pillai from our Chennai sales team and come back to you.', 12],
      ] },
      { ago: 26, hm: '12:00', s: '-', lines: [
        ['H', 'Namaste Madhavan ji, {bill2} for {amt2} has also crossed the due date. Total open now is {tot}. Our quality team is checking the pistachio batch dates and will revert to you shortly.', 0],
        ['C', 'Stop messaging, I have told our accountant.', 40],
        ['H', 'Sure sir. I will not message daily. Only wanted to make sure you have the statement.', 12],
      ] },
      { ago: 22, hm: '15:10', s: '-', lines: [
        ['H', 'Madhavan ji, quality team has completed its check. MFG for the lot was in August with 12 months shelf life, so at dispatch it had about 9 months left. Batch sheet attached.', 0, ['Batch_QA_Report_Pistachio.pdf']],
        ['C', '60 percent of the lot had under 90 days left when it reached our shops. Your sheet is wrong.', 160],
        ['H', 'We will inspect the returned stock together if you can keep it aside. Our founder would also like to speak with you.', 20],
        ['C', 'Let him call. I want credit note for the returned stock.', 75],
      ] },
      { ago: 5, hm: '12:20', s: '-', lines: [
        ['H', 'Namaste Madhavan ji, our founder Aarav Khanna will call you this week about the pistachio lot. Open amount on the account is {tot}.', 0],
        ['C', '', 0],
      ] },
    ],
    em: [
      { ago: 114, hm: '12:00', kind: 'invoice', s: '~', thread: [
        { w: 'C', hrs: 26, body: 'Received. Please share the batch numbers and MFG dates of the pistachio lot, our team needs it for the stock register.' },
        { w: 'H', hrs: 6, att: ['Batch_Details_Pistachio.pdf'], body: 'Please find attached the batch details of the pistachio lot included in this dispatch.' },
      ] },
      { ago: 70, hm: '11:10', kind: 'overdue', s: '-', cc: true, thread: [
        { w: 'C', hrs: 34, body: 'The dispute is with your Chennai sales manager, not accounts. Do not send payment reminders on this account.' },
        { w: 'H', hrs: 3, fwd: true, body: 'Arun, Kaveri Trading is disputing the pistachio lot (short expiry, returned by retailers). Invoice {bill}, open amount {tot}. Can QA share batch MFG and expiry sheets, and can you meet Madhavan ji this week?' },
        { w: 'H', hrs: 5, body: 'We have forwarded your concern to Arun Pillai, our Chennai sales manager, and to our quality team. We will revert with batch details by Friday.' },
      ] },
      { ago: 20, hm: '10:40', kind: 'final', s: '-', cc: true, thread: [
        { w: 'C', hrs: 48, body: 'We have said clearly that the pistachio lot will not be paid for. Kindly issue a credit note for the returned stock.' },
        { w: 'H', hrs: 6, body: 'We have noted this and our founder will contact you personally. Please keep the returned cartons aside for physical verification. Until then no further action will be taken on this account.' },
      ] },
    ],
    call: [
      { ago: 55, hm: '11:30', status: 'no-answer', summary: 'No answer.' },
      { ago: 38, hm: '15:20', status: 'connected', s: '-', ptpDays: null, summary: 'Madhavan says 60 percent of the pistachio lot had under 90 days left and wants a credit note for returned stock. No payment date.',
        reason: [
          ['C', 'Yes, tell me. But if it is about that pistachio invoice, I have already told my position.'],
          ['H', 'I understand sir. I am calling to understand exactly what happened with the lot, so I can get the right team to help.'],
          ['C', 'The lot reached us with very short expiry. 60 percent of the packs had under 90 days left. Retailers will not take such stock.'],
          ['H', 'How many packs were returned to you, roughly?'],
          ['C', 'Around 140 cartons came back from three shops. They are lying in my godown.'],
          ['H', 'Thank you. That helps. Our quality team will compare the batch dates. In the meantime, the cashew and the dates in the same invoice were fine?'],
          ['C', 'Those are fine, I paid Rs 2,00,000 for them.'],
        ],
        commit: [
          ['C', 'I want a credit note for the returned stock. Until then no payment.'],
          ['H', 'I will put this request in writing to our sales and quality teams today. Can I come back to you on this next week?'],
          ['C', 'Okay, but call me on this number only after you have something concrete.'],
        ] },
      { ago: 12, hm: '12:45', status: 'connected', s: '-', ptpDays: null, summary: 'Declined to discuss further on the call. Says the dispute is with the Chennai sales manager and the founder.',
        reason: [
          ['C', 'Neha, I have nothing more to say to accounts. Settle it with Arun and your founder.'],
          ['H', 'Understood sir. I am only calling to inform that the quality sheet is ready and has been shared with you.'],
          ['C', 'I saw it. It is wrong. You are showing MFG date, I am telling you how much life was left in the shop.'],
          ['H', 'I will note your point and pass it on. Would you be willing to talk to our founder directly?'],
          ['C', 'Yes, he can call. Not accounts.'],
          ['H', 'Sure. I will request him to call you this week.'],
        ],
        commit: [
          ['C', 'Ok. Do not send more messages till then.'],
          ['H', 'Noted, I will hold the reminders. Thank you for your time, Madhavan ji.'],
          ['C', 'Hmm.'],
        ] },
    ],
  },

  'Nutri Basket Mart': {
    wa: [
      { ago: 56, hm: '11:35', s: '+', lines: [
        ['H', 'Hi Farhan, Happilo accounts here. Invoice {bill} for {amt1} was delivered to your Mumbai store. Copy attached. Terms 30 days, due {due}.', 0, ['Invoice_HP_26-27_INV.pdf']],
        ['C', 'Received. Thanks.', 160],
      ] },
      { ago: 31, hm: '12:10', s: '~', lines: [
        ['H', 'Farhan, reminder that {bill} ({amt1}) falls due on {due}. Could you share the payment date? Bank details are on the invoice.', 0],
        ['C', 'Sales slow this month, will pay in installments.', 280],
        ['H', 'Understood. Can we plan two instalments? Please tell me the first date.', 12],
        ['C', 'Will tell you by weekend.', 45],
      ] },
      { ago: 24, hm: '12:30', s: '-', lines: [
        ['H', 'Hi Farhan, checking on the first instalment for {bill}. Open amount is {bal}.', 0],
        ['C', 'Last cheque bounced from our supplier side, give us till month end.', 190],
        ['H', 'Sorry to hear that. If you can pay half now, the rest can follow at month end and I will keep your next dispatch active.', 10],
        ['C', 'Not possible now. Month end full payment.', 35],
      ] },
      { ago: 15, hm: '11:15', s: '~', lines: [
        ['H', 'Farhan, noting your commitment of month end for {bal} against {bill}. Statement attached to help you plan.', 0, ['Statement_of_Account_Nov2026.pdf']],
        ['C', 'Ok. Please send the ledger confirmation also, my accountant wants it.', 150],
        ['H', 'Sending the ledger confirmation by email to nutribasket.mart@gmail.com.', 8],
      ] },
      { ago: 7, hm: '15:40', s: '~', lines: [
        ['H', 'Hi Farhan, month end has gone by. Could you share an update on {bal}?', 0],
        ['C', 'Supplier payment is coming Wednesday, 11 Nov. I will pay you the same day.', 70],
        ['H', 'Thank you Farhan, I have noted Wednesday 11 Nov.', 8],
      ] },
      { ago: 2, hm: '15:40', s: '-', lines: [
        ['H', 'Hi Farhan, today was the 11th. Has the supplier payment come? We have not seen the transfer of {bal} yet.', 0],
        ['C', 'Not yet. Please stop daily messages, I said I will pay when it comes.', 70],
        ['H', 'Understood, Farhan. This is only the second message this week. I would like to help you avoid a supply hold on your next order.', 14],
        ['C', 'Ok ok. I will see.', 20],
      ] },
      { ago: 1, hm: '12:00', s: '~', lines: [
        ['H', 'Farhan, to make this easy, we can accept two instalments of half each, one this week and one by 30 Nov. Shall I note that?', 0],
        ['C', '', 0],
      ] },
    ],
    em: [
      { ago: 54, hm: '11:05', kind: 'invoice', s: '~', thread: [
        { w: 'C', hrs: 30, body: 'Please send ledger confirmation for our records.' },
        { w: 'H', hrs: 4, att: ['Ledger_Confirmation_Oct2026.pdf'], body: 'Please find attached the ledger confirmation as on date. Kindly sign and return a copy.' },
      ] },
      { ago: 29, hm: '10:50', kind: 'overdue', s: '~', cc: true, thread: [] },
      { ago: 1, hm: '11:30', kind: 'final', s: '-', cc: true, thread: [
        { w: 'C', hrs: 15, body: 'Supplier payment is delayed. I will pay when it comes. Please stop sending notices.' },
        { w: 'H', hrs: 3, fwd: true, body: 'Pooja, Nutri Basket has missed the 11 Nov date and has asked us to stop reminders. Open amount {bal} on {bill}. Please advise whether we should offer instalments or hold the next order.' },
      ] },
    ],
    call: [
      { ago: 22, hm: '12:10', status: 'no-answer', summary: 'No answer on the shop line.' },
      { ago: 9, hm: '15:10', status: 'connected', s: '-', ptpDays: null, summary: 'Farhan asked us not to call the shop number again. He will call back himself.',
        reason: [
          ['C', 'Haan, bolo. Customer khada hai shop mein, jaldi bolo.'],
          ['H', 'Sorry for disturbing you at the shop, Farhan. I will keep it short. It is about {bill}, {bal}, which was due on {due}.'],
          ['C', 'Wo mere supplier ka cheque bounce ho gaya, isliye paisa atka hai. Maine message mein bataya tha.'],
          ['H', 'Yes I saw. Month end has passed, Farhan. What is the new date?'],
          ['C', 'Dekhte hain. Is mahine sales hi nahi hui, Diwali ke baad market down hai.'],
          ['H', 'I understand. Could we do a half payment this week so that your next dispatch is not stopped?'],
        ],
        commit: [
          ['C', 'Is shop wale number pe call mat karo. Mai khud call karunga.'],
          ['H', 'Okay, I will not call this number again. When can I expect your call, Farhan?'],
          ['C', 'Jab paisa aayega. Rakhta hu.'],
        ] },
    ],
  },

  'Siddhi Vinayak Distributors': {
    wa: [
      { ago: 101, hm: '11:00', s: '+', lines: [
        ['H', 'Namaste Mahesh ji, Happilo accounts here. Invoice {bill} for {amt1} has been delivered to your Pune godown. Copy attached. Terms 30 days.', 0, ['Invoice_HP_26-27_INV.pdf']],
        ['C', 'Received sir, thank you.', 150],
      ] },
      { ago: 66, hm: '12:20', s: '~', lines: [
        ['H', 'Mahesh ji, {bill} was due on {due}. Please share the payment date.', 0],
        ['C', 'Will pay 2 lakh this week.', 210],
        ['H', 'Thank you, I will look for it by Friday.', 8],
      ] },
      { ago: 35, hm: '16:05', s: '~', lines: [
        ['C', 'Rs 2,00,000 sent today, UTR 645220013871. Rest on 10 Nov.', 0],
        ['H', 'Received Rs 2,00,000 against {bill}, thank you. The balance is {bal}. I will note 10 Nov for the rest.', 30],
      ] },
      { ago: 18, hm: '11:40', s: '~', lines: [
        ['H', 'Mahesh ji, a reminder that the balance of {bal} is pending. You had mentioned 10 Nov for the rest. Please confirm.', 0],
        ['C', 'Paid 2 lakh already, rest on 10th.', 120],
      ] },
      { ago: 3, hm: '12:15', s: '-', lines: [
        ['H', 'Mahesh ji, today is 10 Nov. Can I expect the balance today? Amount due is {bal}.', 0],
        ['C', 'Sir stock is dead in my godown, Diwali sales were bad.', 95],
        ['H', 'I understand it has been a tough season. Even Rs 1,00,000 now would show your intent. Can you do that today?', 14],
        ['C', 'Nahi ho paayega sir. Partners mana kar rahe hain.', 40],
      ] },
      { ago: 2, hm: '15:10', s: '-', lines: [
        ['H', 'Mahesh ji, {bal} has now been overdue for {days} days and two promises have passed. We have to put new dispatches on hold from today.', 0],
        ['C', 'Please talk to your sales head.', 60],
        ['H', 'Our sales head Pooja Iyer has been informed, and our founder will also speak with you.', 10],
      ] },
      { ago: 1, hm: '12:45', s: '-', lines: [
        ['H', 'Namaste Mahesh ji, our founder Aarav Khanna will call you tomorrow. Supplies stay on hold until at least Rs 1,50,000 is received. Statement attached.', 0, ['Statement_of_Account_Nov2026.pdf']],
        ['C', 'Hmm okay.', 100],
      ] },
    ],
    em: [
      { ago: 99, hm: '11:30', kind: 'invoice', s: '+', thread: [
        { w: 'C', hrs: 24, body: 'Invoice received, thanks.' },
      ] },
      { ago: 64, hm: '10:15', kind: 'overdue', s: '~', cc: true, thread: [
        { w: 'C', hrs: 18, body: 'Statement received, will reply.' },
        { w: 'H', hrs: 3, body: 'Thank you. We will wait for your reply and the proposed payment schedule.' },
      ] },
      { ago: 2, hm: '11:50', kind: 'final', s: '-', cc: true, thread: [
        { w: 'C', hrs: 18, body: 'Our partners are not agreeing to release the balance at this time. Please give us some more time.' },
        { w: 'H', hrs: 4, fwd: true, body: 'Pooja, Siddhi Vinayak has now missed two commitments (Rs 2,00,000 paid on 9 Oct, balance promised for 10 Nov, not paid). Open: {bal}. We have put dispatches on hold. Founder office to speak to Mahesh ji.' },
        { w: 'H', hrs: 3, body: 'Understood. As a goodwill we have not charged any interest so far, but we need a firm schedule. Please send your proposed dates for the balance of {bal} within 3 working days.' },
      ] },
    ],
    call: [
      { ago: 38, hm: '12:00', status: 'connected', s: '~', ptpDays: 3, summary: 'Mahesh promised Rs 2,00,000 by Friday.',
        reason: [
          ['C', 'Haan Neha ji, namaste.'],
          ['H', 'Namaste Mahesh ji. I am calling about {bill}. {bal} is pending and it is already {days} days past due.'],
          ['C', 'Haan pata hai. Diwali ke pehle ka maal hai, abhi tak bik nahi paaya poora.'],
          ['H', 'I understand that, sir. We are not asking for the full amount. What can you release this week?'],
          ['C', 'Do lakh to kar dunga. Partners se baat ho gayi hai.'],
          ['H', 'And the rest?'],
        ],
        commit: [
          ['C', 'Rest ke liye next month dekhna padega. Pehle Friday tak do lakh.'],
          ['H', 'Thank you. I have noted Rs 2,00,000 by Friday. I will share the bank details on WhatsApp and you can send the UTR once done.'],
          ['C', 'Theek hai.'],
        ] },
      { ago: 25, hm: '12:30', status: 'connected', s: '~', ptpDays: 22, summary: 'Rs 2,00,000 received on 9 Oct. Mahesh committed the balance for 10 Nov.',
        reason: [
          ['C', 'Haan bolo.'],
          ['H', 'Namaste Mahesh ji. Thank you for the Rs 2,00,000. I wanted to confirm when the balance of {bal} will come.'],
          ['C', 'Wo 10 November tak kar dunga. Diwali ki sale ke baad.'],
          ['H', 'Is there any chance of a smaller part before that, so that the account does not age further?'],
          ['C', 'Abhi mushkil hai, stock pada hua hai. 10 tareekh pakka.'],
          ['H', 'Understood. I will note 10 Nov firmly.'],
        ],
        commit: [
          ['C', 'Haan, pakka. Mai khud bhej dunga.'],
          ['H', 'Thank you, Mahesh ji. I will message you on the 9th as a reminder.'],
          ['C', 'Okay.'],
        ] },
      { ago: 5, hm: '12:00', status: 'connected', s: '-', ptpDays: null, summary: 'Call connected after a missed attempt. Said cash flow is tight and the stock is not moving. No new date given.',
        reason: [
          ['C', 'Haan Neha ji. Phone nahi utha paya pehle, busy tha.'],
          ['H', 'No problem sir. The 10 Nov date is coming up. Everything on track for the balance of {bal}?'],
          ['C', 'Sir sach bolu to cash flow ka issue hai. Diwali sales kharab rahi.'],
          ['H', 'I understand. Can you tell me honestly what part, if any, you can arrange by the 10th?'],
          ['C', 'Ek lakh bhi mushkil hai abhi. Partners release karne ko ready nahi hain.'],
          ['H', 'Would returning slow-moving stock help? We can look at credit for unopened cartons.'],
        ],
        commit: [
          ['C', 'Wo sales head se baat karni padegi. Mai abhi kuch commit nahi kar sakta.'],
          ['H', 'Okay sir. I will ask Pooja ji to speak with you. Our founder will also reach out.'],
          ['C', 'Theek hai, rakhta hu.'],
        ] },
    ],
  },

  'Metro Mart Retail - Western Region': {
    wa: [
      { ago: 92, hm: '11:20', s: '~', lines: [
        ['H', 'Hello Sanjay ji, Happilo accounts here. Invoice {bill} for {amt1} has been delivered to your Bhiwandi DC. Copy attached. Terms 45 days.', 0, ['Invoice_HP_26-27_INV.pdf']],
        ['C', 'Received. Will be processed through the AP system after GRN.', 140],
      ] },
      { ago: 52, hm: '12:00', s: '-', lines: [
        ['H', 'Sanjay ji, {bill} falls due on {due}. Could you confirm the payment date from your side?', 0],
        ['C', 'Invoice rejected in system, GRN quantity differs from your invoice.', 190],
        ['H', 'Thank you for telling me. Could you share the GRN copy so that we can compare it with the delivery challan?', 10],
        ['C', 'Will ask the DC. It says 36 cartons less than invoice.', 55],
      ] },
      { ago: 38, hm: '15:30', s: '-', lines: [
        ['H', 'Sanjay ji, our dispatch team has checked the delivery challan. The signed challan shows full quantity received. Copy attached. Can you check with your DC head?', 0, ['Signed_Delivery_Challan.pdf']],
        ['C', 'Raised debit note for the difference. Pay the revised value only.', 85],
        ['H', 'A debit note without a matching credit note will not tally in our books. Let us first reconcile the GRN with the challan together on a call.', 14],
        ['C', 'Will check with AP head.', 30],
      ] },
      { ago: 14, hm: '11:45', s: '~', lines: [
        ['H', 'Sanjay ji, it is {days} days past due on {bill}, {amt}. Any update on the reconciliation with your AP head?', 0],
        ['C', 'Pending with category head. He will review next week.', 260],
        ['H', 'Our regional sales head Pooja Iyer will also meet your category head. I will share the meeting date once fixed.', 12],
      ] },
      { ago: 5, hm: '12:20', s: '-', lines: [
        ['H', 'Namaste Sanjay ji, Pooja Iyer from our sales team is meeting your category head on Tuesday. Could the AP team keep the payment ready for the undisputed quantity?', 0],
        ['C', 'AP says they will pay only the GRN quantity, rest on credit note.', 130],
        ['H', 'Understood. Once the meeting is done, we will issue a credit note for the exact cartons that the GRN shows short, and you can release the rest.', 18],
      ] },
    ],
    em: [
      { ago: 90, hm: '11:50', kind: 'invoice', s: '~', thread: [
        { w: 'C', hrs: 36, body: 'Invoice received. Kindly upload invoices on the vendor portal with the PO number.' },
        { w: 'H', hrs: 4, body: 'Thank you. We will upload them on the vendor portal with the PO reference today.' },
      ] },
      { ago: 47, hm: '10:30', kind: 'overdue', s: '-', cc: true, thread: [
        { w: 'C', hrs: 28, body: 'Invoice does not match PO. Please issue credit note for 36 cartons.' },
        { w: 'H', hrs: 3, fwd: true, body: 'Pooja, Metro Mart West has rejected {bill} on a GRN mismatch of 36 cartons. Open amount {bal}. Challan shows full qty received. Please meet their category head and help reconcile. Dispatch team copied for the signed challan.' },
        { w: 'H', hrs: 5, att: ['Signed_Delivery_Challan.pdf'], body: 'We have checked the signed delivery challan, which shows the full quantity received at your DC. Copy attached. Please compare with the GRN, and let us fix a call with your category head and our regional sales head.' },
      ] },
      { ago: 15, hm: '11:20', kind: 'final', s: '~', cc: true, thread: [
        { w: 'C', hrs: 48, body: 'Pending with category head.' },
        { w: 'H', hrs: 3, att: ['Statement_of_Account_Nov2026.pdf'], body: 'Thank you. Statement attached. Please let us know the date of the review so that we can keep our regional sales head available.' },
      ] },
    ],
    call: [
      { ago: 30, hm: '11:30', status: 'connected', s: '~', ptpDays: null, summary: 'Sanjay was in a review meeting and said he will revert.',
        reason: [
          ['C', 'Sanjay here. I have a meeting in five minutes, tell quickly.'],
          ['H', 'Sure sir. It is about invoice {bill}, {amt}, which is overdue by {days} days. Your system shows it as rejected.'],
          ['C', 'Yes. GRN shows 36 cartons less than your invoice. AP cannot pass an invoice that does not match GRN.'],
          ['H', 'Our signed delivery challan shows full quantity. Can the DC check the physical count of the Dried Californian Blueberries and the Sports Mix cartons?'],
          ['C', 'I do not know which items were short. The DC head would know.'],
          ['H', 'Could you ask him to send the item-wise GRN to me? I will reconcile it with dispatch the same day.'],
        ],
        commit: [
          ['C', 'I will ask him. Let me get back to you after the meeting.'],
          ['H', 'Thank you, Sanjay ji. I will note that you will revert by tomorrow evening. I will send a mail with the details.'],
          ['C', 'Okay, send it.'],
        ] },
      { ago: 8, hm: '12:40', status: 'connected', s: '-', ptpDays: null, summary: 'AP says they will pay only the GRN quantity; the rest only against a credit note for 36 cartons. No payment date yet.',
        reason: [
          ['C', 'Accounts payable, Metro Mart. Yes, I am the one who handles Happilo.'],
          ['H', 'Namaste. Neha from Happilo accounts. I am calling about {bill}, {amt}, now {days} days overdue.'],
          ['C', 'Yes, we know. We will pay only what GRN shows. The remaining is on credit note.'],
          ['H', 'How much do you consider payable, based on GRN?'],
          ['C', 'GRN value is lower by 36 cartons. I will send you the GRN sheet by mail, you reconcile.'],
          ['H', 'Please do. If the count is confirmed we will issue the credit note on the same day.'],
        ],
        commit: [
          ['C', 'Once the credit note comes, the revised invoice value will be released in the next payment cycle.'],
          ['H', 'Understood. When is your next payment cycle?'],
          ['C', 'Early December. I cannot say exact date now.'],
        ] },
    ],
  },

  'DealDukaan Retail': {
    wa: [
      { ago: 54, hm: '11:25', s: '+', lines: [
        ['H', 'Hi Aman, Happilo accounts here. Invoice {bill} for {amt1} has been delivered to your Delhi fulfilment centre. Copy attached. Terms 30 days.', 0, ['Invoice_HP_26-27_INV.pdf']],
        ['C', 'Received.', 90],
      ] },
      { ago: 25, hm: '12:00', s: '~', lines: [
        ['H', 'Aman, {bill} ({amt1}) was due on {due}. Could you share the payment date?', 0],
        ['C', 'Marketplace deducted returns from our settlement, we need credit note for 88 units.', 160],
        ['H', 'Understood. Could you send the return report with order IDs, so that the sales ops team can verify the units?', 10],
        ['C', 'Sending on mail.', 20],
      ] },
      { ago: 21, hm: '15:10', s: '~', lines: [
        ['H', 'Aman, we received the return report. Sales ops is matching it with the return GRN. The deduction shows Rs 21,360 for RTO returns. Is that the full amount you want covered?', 0],
        ['C', 'Share CN and we will adjust.', 130],
        ['H', 'I will get the credit note issued as soon as the warehouse confirms the return GRN. Can you release the undisputed balance in the meantime?', 14],
        ['C', 'Rs 21,360 is what they cut, so pay the balance after CN.', 60],
      ] },
      { ago: 10, hm: '12:30', s: '~', lines: [
        ['H', 'Aman, return GRN is confirmed for 82 of 88 units. Six units are not received at our warehouse yet. Credit note will be for 82 units.', 0],
        ['C', 'Six units are stuck with the courier. Please adjust for all 88.', 110],
        ['H', 'We will include the six units once they arrive. Please do release the rest, we will not hold it back.', 12],
      ] },
      { ago: 4, hm: '16:00', s: '-', lines: [
        ['H', 'Aman, any update on payment of {amt}? Credit note is being issued.', 0],
        ['C', 'Not releasing till CN comes.', 40],
        ['H', 'Okay. I am pushing the credit note with finance today, and will send it to you by tomorrow evening.', 8],
      ] },
    ],
    em: [
      { ago: 52, hm: '11:45', kind: 'invoice', s: '+', thread: [
        { w: 'C', hrs: 20, body: 'Received. Thanks.' },
      ] },
      { ago: 24, hm: '10:50', kind: 'overdue', s: '~', cc: true, thread: [
        { w: 'C', hrs: 14, body: 'Please send credit note against returned units. Marketplace RTO deduction is Rs 21,360.' },
        { w: 'H', hrs: 4, fwd: true, body: 'Sandeep, DealDukaan is claiming a credit note of about Rs 21,360 for 88 returned units. Can sales ops confirm the return GRN so that we issue it? Invoice {bill}, open {amt}.' },
        { w: 'H', hrs: 4, att: ['Statement_of_Account_Nov2026.pdf'], body: 'We have requested sales ops to confirm the return GRN. We will issue the credit note as soon as the units are verified. Statement of account is attached for your reference.' },
      ] },
      { ago: 5, hm: '11:15', kind: 'final', s: '~', cc: true, thread: [
        { w: 'C', hrs: 22, body: 'We will release the balance as soon as the credit note is received. Please share it at the earliest.' },
        { w: 'H', hrs: 3, body: 'Thank you. Credit note is under approval and will be sent to you within 48 hours.' },
      ] },
    ],
    call: [
      { ago: 20, hm: '11:40', status: 'no-answer', summary: 'No answer.' },
      { ago: 7, hm: '16:20', status: 'connected', s: '~', ptpFromNow: 6, summary: 'Aman will pay the balance once a credit note of about Rs 21,360 for returned units is issued.',
        reason: [
          ['C', 'Haan Neha, bolo.'],
          ['H', 'Aman, I am calling about {bill}. The pending amount is {amt}. Was due on {due}.'],
          ['C', 'Wo returns wala hai na. Marketplace ne Rs 21,360 kaat liya hai humare settlement se.'],
          ['H', 'Yes, I have the return report. Sales ops confirmed 82 of 88 units are received back.'],
          ['C', 'Baki 6 courier mein hain. Sab 88 ke liye adjust karna padega.'],
          ['H', 'We will adjust the remaining six units once they reach the warehouse. Is the rest of the invoice fine, quantity and quality?'],
          ['C', 'Haan wo sab theek hai.'],
        ],
        commit: [
          ['C', 'CN bhej do, rest is week mein bhej dunga.'],
          ['H', 'Great. I will send the credit note by tomorrow evening. Should I note payment of the balance by next Thursday?'],
          ['C', 'Thursday ya Friday.'],
        ] },
    ],
  },

  'Southern Fresh Retail - Regional Office': {
    wa: [
      { ago: 98, hm: '11:10', s: '+', lines: [
        ['H', 'Namaste Gayathri ji, Happilo accounts here. Invoice {pbill} for {pamt} has been uploaded on the vendor portal. Terms 45 days.', 0, ['Invoice_Copy.pdf']],
        ['C', 'Thank you, received.', 120],
      ] },
      { ago: 41, hm: '12:30', s: '+', lines: [
        ['C', 'Payment for {pbill} released today, UTR {putr}. Rs 5,17,852 after TDS deduction of Rs 518.', 0],
        ['H', 'Received, thank you Gayathri ji. We will upload the TDS certificate in the next quarter.', 40],
      ] },
      { ago: 62, hm: '11:30', s: '~', lines: [
        ['H', 'Gayathri ji, invoice {bill} for {amt1} has also been uploaded on the portal, with the Coimbatore DC delivery challan. Terms 45 days.', 0, ['Invoice_HP_26-27_INV.pdf']],
        ['C', 'Invoice is in the vendor portal, payment on approval.', 180],
      ] },
      { ago: 22, hm: '12:10', s: '~', lines: [
        ['H', 'Gayathri ji, {bill} falls due on {due}. Could you confirm the approval status on the portal?', 0],
        ['C', 'Vendor code mismatch on 2nd invoice, resubmit through portal.', 150],
        ['H', 'Thank you for flagging. The vendor code on the invoice is the old one for Bengaluru. Resubmitting it through the portal today with the Coimbatore code.', 14],
      ] },
      { ago: 9, hm: '15:20', s: '~', lines: [
        ['H', 'Gayathri ji, I have resubmitted both {bill} and {bill2} on the portal with the corrected code. Please check on your side.', 0],
        ['C', 'Portal approval is stuck at category manager. GRN is also pending for DC Hosur for the third invoice.', 210],
        ['H', 'Understood. Could you share the contact of the store team handling GRN at Hosur? I can follow up directly.', 12],
        ['C', 'Will send the number of the store in-charge.', 40],
      ] },
      { ago: 2, hm: '12:00', s: '~', lines: [
        ['H', 'Gayathri ji, the Hosur store in-charge confirmed that GRN will be posted tomorrow. The total open on the account is {tot} across two invoices. Statement attached.', 0, ['Statement_of_Account_Nov2026.pdf']],
        ['C', 'Okay. Once the GRN is posted, the payment should be in the next run, around the 25th.', 160],
      ] },
    ],
    em: [
      { ago: 60, hm: '11:20', kind: 'invoice', s: '~', thread: [
        { w: 'C', hrs: 30, body: 'Please upload invoices on the vendor portal with GRN reference.' },
        { w: 'H', hrs: 4, body: 'Thank you. We have uploaded the invoice with the GRN reference on the vendor portal today.' },
      ] },
      { ago: 19, hm: '10:40', kind: 'overdue', s: '~', cc: true, thread: [
        { w: 'C', hrs: 21, body: 'GRN pending for DC Hosur, store team following up. Vendor code mismatch also needs to be corrected by you.' },
        { w: 'H', hrs: 3, body: 'We are correcting the vendor code and resubmitting through the portal. Could you share the contact of the store team handling GRN at DC Hosur, so we can follow up?' },
        { w: 'C', hrs: 6, body: 'Contact will be shared separately by phone.' },
      ] },
      { ago: 6, hm: '11:00', kind: 'statement', s: '~', cc: true, thread: [
        { w: 'C', hrs: 20, body: 'Noted. Payment will be taken once approval is complete at the category manager.' },
      ] },
    ],
    call: [
      { ago: 12, hm: '12:00', status: 'connected', s: '~', ptpDays: null, summary: 'Gayathri says portal approval is stuck at the category manager. Vendor code correction in progress.',
        reason: [
          ['C', 'Gayathri speaking. Accounts payable.'],
          ['H', 'Namaste Gayathri ji. Neha from Happilo International. I am calling about invoices {bill} and {bill2}, total {tot}.'],
          ['C', 'Yes, they are in the portal. Second one needs vendor code corrected.'],
          ['H', 'We resubmitted with the corrected code. Is it visible on your side?'],
          ['C', 'Let me check. Yes it is visible, but approval is stuck at the category manager.'],
          ['H', 'Who is the category manager? Can I ask our sales team to follow up with him?'],
          ['C', 'Mr. Prasad. Your sales team can call him. I cannot approve on my own.'],
        ],
        commit: [
          ['C', 'Once he approves, payment goes in the next run, around the 25th of this month.'],
          ['H', 'I have noted the 25th. I will share the invoice numbers by mail so that Mr. Prasad has all details.'],
          ['C', 'Okay, send to the vendor payables mailbox.'],
        ] },
    ],
  },

  'Greenleaf Hypermarkets - Karnataka RO': {
    wa: [
      { ago: 51, hm: '11:30', s: '+', lines: [
        ['H', 'Namaste Deepak ji, Happilo accounts here. Invoice {bill} for {amt1} has been delivered to your Bengaluru DC. Copy attached. Terms 45 days.', 0, ['Invoice_HP_26-27_INV.pdf']],
        ['C', 'Received, will be processed after GRN.', 120],
      ] },
      { ago: 28, hm: '12:05', s: '~', lines: [
        ['H', 'Deepak ji, a reminder that {bill} falls due on {due}. Could you share the expected payment date?', 0],
        ['C', 'Two stores have returned Party Mix packs, near expiry. We have raised a return request.', 140],
        ['H', 'Sorry about that. Could you send the store-wise return count and the batch numbers? We will arrange a credit note.', 10],
      ] },
      { ago: 20, hm: '14:40', s: '+', lines: [
        ['H', 'Deepak ji, credit note {cnNo} for {cn} is issued for 96 returned packs of Party Mix. Copy attached.', 0, ['Credit_Note_HP_26-27_CN_0028.pdf']],
        ['C', 'Thanks. Debit note has been raised for the return, balance will be released in the next cycle.', 90],
      ] },
      { ago: 14, hm: '12:20', s: '+', lines: [
        ['C', 'Part payment of Rs 2,50,000 released today, UTR 457190034218.', 0],
        ['H', 'Received Rs 2,50,000, thank you Deepak ji. Net of the credit note the balance is {bal}. Statement attached.', 25, ['Statement_of_Account_Nov2026.pdf']],
        ['C', 'Yes that matches our books. Balance in next payment cycle.', 60],
      ] },
      { ago: 3, hm: '11:50', s: '+', lines: [
        ['H', 'Deepak ji, checking on the next payment cycle for {bal}. Please let me know the date.', 0],
        ['C', 'Next cycle is around 20 to 22 Nov. It is approved.', 150],
        ['H', 'Thank you. I will check on the 21st.', 8],
      ] },
    ],
    em: [
      { ago: 49, hm: '11:00', kind: 'invoice', s: '+', thread: [
        { w: 'C', hrs: 20, body: 'Received, thanks.' },
      ] },
      { ago: 25, hm: '10:30', kind: 'reminder', s: '+', thread: [
        { w: 'C', hrs: 22, body: 'Debit note has been raised for the return. Balance will be released in the next payment cycle after adjusting the credit note.' },
        { w: 'H', hrs: 3, att: ['Credit_Note_HP_26-27_CN_0028.pdf'], body: 'Thank you. Credit note {cnNo} for {cn} is attached. Please adjust against {bill} and release the balance.' },
      ] },
      { ago: 8, hm: '11:20', kind: 'statement', s: '+', thread: [
        { w: 'C', hrs: 28, body: 'Statement matches our books. Payment in the next cycle.' },
      ] },
    ],
    call: [
      { ago: 11, hm: '12:00', status: 'connected', s: '+', ptpDays: 10, summary: 'Deepak confirmed part payment of Rs 2,50,000 and the credit note adjustment. Balance expected next cycle.',
        reason: [
          ['C', 'Deepak here, accounts payable, Greenleaf.'],
          ['H', 'Namaste Deepak ji. Neha from Happilo. I am calling about {bill}, balance {bal}, due on {due}.'],
          ['C', 'Yes, the return of Party Mix packs was adjusted. I have the credit note.'],
          ['H', 'Thank you. After the credit note of Rs 12,480 and the part payment of Rs 2,50,000 the balance is Rs 3,01,240. Is that what you see?'],
          ['C', 'Hold on. Yes, Rs 3,01,240. Same as ours.'],
          ['H', 'When can that go?'],
        ],
        commit: [
          ['C', 'In the next payment cycle, around 20th of this month.'],
          ['H', 'Thank you, I will note 20th. Please send the UTR when it is released.'],
          ['C', 'Okay, will do.'],
        ] },
    ],
  },
};

export { SALES };
