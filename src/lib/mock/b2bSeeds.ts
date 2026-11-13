/**
 * Hand-written B2B lead seeds for Happilo's bulk, gifting, retail and
 * distributor pipeline. Messages are prefixed "o:" (Happilo sent) or
 * "i:" (lead replied). Voice lines are "A:" (Aarav) / "U:" (the lead).
 * Timings are relative: `last` = days since the last message, `span` = days
 * the whole thread covers.
 */

export type Cat =
  | 'corporate_gifting'
  | 'retail_store'
  | 'distributor'
  | 'hotel_cafe'
  | 'ecommerce_reseller'
  | 'gym_wellness'
  | 'institutional';

export type StageKey =
  | 'lead_generated'
  | 'contacted'
  | 'interested'
  | 'sample_sent'
  | 'demo_booked'
  | 'negotiation'
  | 'won'
  | 'lost';

export type Interest = 'positive' | 'neutral' | 'negative' | 'not_interested';

export interface ChannelThread {
  last: number;
  span: number;
  msgs: string[];
  /** first outbound message fails to deliver */
  failFirst?: string;
}

export interface EmailThread {
  last: number;
  span: number;
  subject: string;
  msgs: string[];
}

export interface CallSeed {
  daysAgo: number;
  outcome: 'completed' | 'voicemail' | 'no-answer';
  secs?: number;
  lines?: string[];
  summary?: string;
}

export interface LeadSeed {
  co: string;
  cat: Cat;
  who: string;
  role?: string;
  region: string;
  place: string;
  stage: StageKey;
  src: 'google_maps' | 'referral' | 'inbound' | 'trade_show' | 'csv_upload';
  age: number; // days since added
  note: string;
  domain?: string;
  rep?: number;
  wa?: ChannelThread;
  em?: EmailThread;
  call?: CallSeed;
  sent?: [Interest, string, string]; // interest, intent, one-line summary
  voiceSent?: [Interest, string, string];
}

export const SEEDS: LeadSeed[] = [
  /* ------------------------------ New leads ------------------------------ */
  { co: 'Shree Ganesh Dry Fruits & Sweets', cat: 'retail_store', who: 'Ganesh Kulkarni', region: 'Pune', place: 'Kothrud', stage: 'lead_generated', src: 'google_maps', age: 2, note: 'Old-style dry fruit and mithai shop near Kothrud depot. Sells loose, no branded packs on shelf.', domain: 'shreeganeshdryfruits.in' },
  { co: 'Hotel Lakshmi Residency', cat: 'hotel_cafe', who: 'Murali Krishnan', role: 'Purchase manager', region: 'Chennai', place: 'Adyar', stage: 'lead_generated', src: 'google_maps', age: 1, note: '3-star, around 60 rooms. Buffet breakfast, might need trail mix and dates for the counter.', domain: 'lakshmiresidency.co.in' },
  { co: 'Bean & Barrel Cafe', cat: 'hotel_cafe', who: 'Aditi Rao', region: 'Bengaluru', place: 'HSR Layout', stage: 'lead_generated', src: 'google_maps', age: 3, note: 'Two outlets in HSR and Sarjapur Road. Sells granola bowls and snack jars.', domain: 'beanandbarrel.in' },
  { co: 'FitFuel Nutrition Studio', cat: 'gym_wellness', who: 'Coach Rahul Mehra', region: 'Mumbai', place: 'Powai', stage: 'lead_generated', src: 'google_maps', age: 4, note: 'Gym with a protein bar and snack counter, about 400 members.', domain: 'fitfuelstudio.com' },
  { co: 'Jaipur Gift Gallery', cat: 'corporate_gifting', who: 'Sunita Chauhan', region: 'Jaipur', place: 'C-Scheme', stage: 'lead_generated', src: 'google_maps', age: 5, note: 'Gift shop doing wedding and corporate hampers. Currently packs loose dry fruits in their own boxes.', domain: 'jaipurgiftgallery.in' },
  { co: 'Mahalaxmi Provision Stores', cat: 'retail_store', who: 'Dinesh Thakkar', region: 'Mumbai', place: 'Vashi', stage: 'lead_generated', src: 'google_maps', age: 2, note: 'Busy kirana near Vashi station, dry fruit rack at the counter.' },
  { co: 'Anand Bhandar Wholesale', cat: 'distributor', who: 'Hitesh Anand', region: 'Ahmedabad', place: 'Maninagar', stage: 'lead_generated', src: 'csv_upload', age: 6, note: 'Came in a Gujarat wholesaler list. Supplies around 80 kirana stores in east Ahmedabad.' },
  { co: 'Greenfield International School', cat: 'institutional', who: 'Lakshmi Prasad', role: 'Admin office', region: 'Hyderabad', place: 'Gachibowli', stage: 'lead_generated', src: 'referral', age: 3, note: 'Referred by a parent. Tuck shop plus annual-day goody bags for 1,800 students.' },

  /* ------------------------------- Contacted ------------------------------ */
  { co: 'Nandi Super Market', cat: 'retail_store', who: 'Raghavendra Gowda', region: 'Bengaluru', place: 'Jayanagar', stage: 'contacted', src: 'google_maps', age: 9, note: 'Two-floor supermarket, strong dry fruit aisle. Owner usually visits in the evening.', domain: 'nandisupermarket.in',
    wa: { last: 5, span: 0, msgs: ['o:Namaste Raghavendra ji, this is Karthik from Happilo B2B team, Bengaluru. We supply Happilo nuts, dates, makhana and trail mixes to supermarkets directly with proper trade margins. Can I share our retail rate card?'] } },
  { co: 'Kapoor Dry Fruit House', cat: 'retail_store', who: 'Ashok Kapoor', region: 'Delhi NCR', place: 'Lajpat Nagar', stage: 'contacted', src: 'google_maps', age: 11, note: 'Third-generation dry fruit shop. Mostly loose almonds and cashews.', domain: 'kapoordryfruit.com',
    wa: { last: 7, span: 4, msgs: ['o:Hello Ashok ji, Divya here from Happilo. Many dry fruit shops are now keeping our sealed 200g and 500g packs for walk-in customers. Shall I send the pack sizes and trade price?', 'o:Following up Ashok ji, happy to courier a small sample of cashew and pistachio packs to the shop if you want to check quality first.'] },
    em: { last: 6, span: 0, subject: 'Happilo packs for your Lajpat Nagar shop', msgs: ['o:Dear Ashok ji,\n\nI am writing from Happilo International. We supply sealed, FSSAI-certified nuts and dry fruits to retailers across Delhi and would like to introduce our trade range to Kapoor Dry Fruit House. I have attached the pack list. Please let me know a good time to call.\n\nRegards,\nDivya Nair\nHappilo B2B Team\ncare@happilo.com | +91 88844 84000'] } },
  { co: 'Sai Krupa Traders', cat: 'distributor', who: 'Srinivas Rao', region: 'Hyderabad', place: 'Secunderabad', stage: 'contacted', src: 'google_maps', age: 14, note: 'FMCG sub-distributor with 3 vans covering old city kiranas.',
    wa: { last: 9, span: 0, failFirst: 'Number not on WhatsApp', msgs: ['o:Namaste Srinivas ji, we are looking for a distributor partner for Happilo dry fruits and snacks in Hyderabad. Could we speak this week?'] },
    call: { daysAgo: 8, outcome: 'no-answer' } },
  { co: 'The Tea Junction', cat: 'hotel_cafe', who: 'Nisha Deshmukh', region: 'Pune', place: 'Koregaon Park', stage: 'contacted', src: 'google_maps', age: 8, note: 'Cafe with 4 branches in Pune. Sells tea with snack boxes.',
    wa: { last: 4, span: 3, msgs: ['o:Hi Nisha, Karthik from Happilo. We do makhana, roasted nuts and trail mix in bulk packs for cafes. Would you like our cafe price list?', 'o:Just checking if you saw the above Nisha. Can send a 1 kg trial pack of peri peri makhana too.'] } },
  { co: 'Infravia Technologies', cat: 'corporate_gifting', who: 'Preeti Hegde', role: 'HR & admin', region: 'Bengaluru', place: 'Whitefield', stage: 'contacted', src: 'inbound', age: 6, note: 'Filled the bulk enquiry form for year-end gifts, about 350 employees.', domain: 'infravia.com',
    wa: { last: 3, span: 0, msgs: ['o:Hi Preeti, thanks for your enquiry on happilo.com. For 350 gift boxes we usually offer three budget options. May I send the gifting deck and slabs here?'] },
    em: { last: 3, span: 0, subject: 'Year-end gifting for Infravia - Happilo options', msgs: ['o:Hi Preeti,\n\nThank you for reaching out. Attaching our corporate gifting deck with boxes at three budget points, with branded sleeve and a personalised card option. For 300+ boxes we need about 12 working days from artwork approval.\n\nWould it help to schedule a short call?\n\nRegards,\nRohan Verma\nHappilo B2B Team'] } },
  { co: 'Dolphin Hampers & Gifts', cat: 'corporate_gifting', who: 'Soumik Banerjee', region: 'Kolkata', place: 'Park Street', stage: 'contacted', src: 'google_maps', age: 17, note: 'Mid-size hamper maker, big in Christmas cake and dry fruit baskets.',
    wa: { last: 10, span: 6, msgs: ['o:Hello Soumik da, this is Divya from Happilo. We have ready gift boxes and loose bulk packs that hamper makers use. Can I share prices?', 'o:Hi Soumik, sharing the Christmas and New Year gifting catalogue in case it helps with your planning.'] } },
  { co: 'Rathod Kirana & General', cat: 'retail_store', who: 'Bharat Rathod', region: 'Ahmedabad', place: 'Satellite', stage: 'contacted', src: 'google_maps', age: 12, note: 'Family-run general store, decent footfall from nearby apartments.',
    wa: { last: 8, span: 0, msgs: ['o:Namaste Bharat bhai, Happilo ke makhana aur dry fruits ke packs aapki dukaan ke liye available hain, good margin ke saath. Rate card bhej du?'] } },
  { co: 'Vasundhara Traders', cat: 'distributor', who: 'Mahesh Saini', region: 'Jaipur', place: 'Vaishali Nagar', stage: 'contacted', src: 'google_maps', age: 15, note: 'Dry fruit and spice wholesaler, supplies sweet shops and kiranas.',
    wa: { last: 6, span: 5, msgs: ['o:Namaste Mahesh ji, Happilo B2B team se Karthik. Rajasthan mein hum wholesalers aur sub-distributors dhoondh rahe hain. Baat kar sakte hain?', 'o:Mahesh ji, ek baar rate card dekh lijiye, MOQ kaafi kam hai. Aap bolein to kal call kar lu.'] },
    call: { daysAgo: 4, outcome: 'voicemail' } },
  { co: 'QuickCart Foods', cat: 'ecommerce_reseller', who: 'Varun Malhotra', region: 'Delhi NCR', place: 'Sector 62, Noida', stage: 'contacted', src: 'inbound', age: 10, note: 'Small quick-commerce seller, wants to list healthy snacks on their own app and Amazon.', domain: 'quickcartfoods.in',
    em: { last: 6, span: 0, subject: 'Reseller terms - Happilo makhana and trail mix', msgs: ['o:Hi Varun,\n\nThanks for writing in. We do work with a few resellers, but we need to keep MRP and listing prices aligned across Amazon, Flipkart and quick-commerce. If that suits you, I can send the reseller price list and MOQ.\n\nRegards,\nRohan Verma\nHappilo B2B Team'] },
    wa: { last: 6, span: 0, msgs: ['o:Hi Varun, Rohan from Happilo. Sent you an email with reseller terms, please have a look. Happy to discuss on a call.'] } },

  /* ------------------------------- Interested ----------------------------- */
  { co: 'Gupta Dry Fruit Emporium', cat: 'retail_store', who: 'Manoj Gupta', region: 'Delhi NCR', place: 'Karol Bagh', stage: 'interested', src: 'google_maps', age: 19, note: 'Wants the B2B rate card for cashews, pistachios and walnuts. Moves roughly 50 kg a month.', domain: 'guptadryfruits.in', rep: 2,
    wa: { last: 2, span: 12, msgs: [
      'o:Hello Manoj ji, Divya from Happilo. We supply sealed nuts and dry fruits to retailers in Delhi. Can I send the trade rate card?',
      'i:Haan bhejiye. Hum cashew, pista aur akhrot zyada bechte hain. Mahine ka 50 kg aaraam se ho jata hai.',
      'o:Sure, sharing the PDF now. Our Premium Whole Cashew 200g is MRP 336 and the Jumbo Roasted Pistachio 200g is 353. Retailer margin is around 22 to 25 percent depending on quantity.',
      'i:Margin theek lag raha hai. Minimum order kitna hai?',
      'o:For Delhi we start at one carton of mixed SKUs, around Rs 18,000. Delivery is free above Rs 25,000.',
      'i:Okay. Kya aap credit dete ho? Hum purane customers ko 15 din ka credit dete hain, toh humein bhi thoda time chahiye.',
      'o:First two orders are advance, after that we can discuss 15 days. Let me check with my manager and confirm tomorrow.'
    ] },
    call: { daysAgo: 5, outcome: 'completed', secs: 132, lines: [
      'A:Namaste, am I speaking with Manoj ji? This is Aarav from Happilo.',
      'U:Haan Manoj bol raha hu. Divya madam ne rate card bheja tha.',
      'A:Ji sir. I wanted to check if the margin and pack sizes work for your Karol Bagh shop.',
      'U:Pack sizes theek hain. Bas credit ka dekhna hai, aur ek baar sample dekhna chahta hu pistachio ka.',
      'A:Sure sir, I will ask Divya ma\'am to send a pistachio pack with your first order. And she will confirm credit terms tomorrow.',
      'U:Ok ok, thik hai.'
    ], summary: 'Pack sizes and margin are fine. Wants to see the pistachio pack and confirm credit terms.' },
    sent: ['positive', 'wants_pricing', 'Moves about 50 kg a month, liked the margin, asking for 15 days credit after the first orders.'] },
  { co: 'Meridian Software Pvt Ltd', cat: 'corporate_gifting', who: 'Shilpa Narang', role: 'Admin head', region: 'Pune', place: 'Hinjewadi', stage: 'interested', src: 'inbound', age: 16, note: 'New Year gifts for 600 employees plus 80 client boxes. Budget Rs 900 to 1,200 per box.', domain: 'meridiansoft.in', rep: 3,
    wa: { last: 1, span: 9, msgs: [
      'o:Hi Shilpa, Rohan from Happilo. Thanks for your enquiry. For 600+ boxes we can do a custom box with your logo sleeve. What budget per box are you looking at?',
      'i:Around 1000 to 1200. Mostly nuts and dates, nothing too sweet. Some people are diabetic so no heavy mithai.',
      'o:Makes sense. A 5-item box with almonds, cashews, pistachios, Medjoul dates and a trail mix comes to about Rs 1,150 with the printed sleeve. I will share photos.',
      'i:Please send. Also can the delivery be to 3 offices, Pune, Hyderabad and Noida?',
      'o:Yes, we can ship to all three. Multi-city adds about 4 working days. Sending the deck and a sample proposal on email.',
      'i:Got the mail. Let me show it to my VP, will revert by Monday.'
    ] },
    em: { last: 1, span: 0, subject: 'Re: Gifting proposal - Meridian Software', msgs: ['o:Hi Shilpa,\n\nAttaching the proposal for 680 boxes (600 employee + 80 client) at Rs 1,150 per box including printed sleeve and GST invoice. Delivery split: Pune 320, Hyderabad 180, Noida 180. Production time 12 working days from artwork sign-off.\n\nRegards,\nRohan Verma', 'i:Hi Rohan, received. The client box needs to be slightly premium, could you quote a separate price for 80 boxes at around Rs 1,800? Will confirm after VP approval.\n\nShilpa'] },
    sent: ['positive', 'wants_pricing', 'Needs 680 boxes across three cities, budget around Rs 1,150, waiting for VP approval.'] },
  { co: 'Hari Om Super Bazaar', cat: 'retail_store', who: 'Prakash Joshi', region: 'Jaipur', place: 'Malviya Nagar', stage: 'interested', src: 'google_maps', age: 22, note: 'Large kirana-supermarket, 6 billing counters. Wants makhana and trail mix.',
    wa: { last: 4, span: 8, msgs: [
      'o:Namaste Prakash ji, Karthik from Happilo. Makhana aur trail mix ka demand kaafi badh raha hai retail me, humare packs aapke store ke liye available hain.',
      'i:Haan humare yahan makhana ki demand hai. 55 gram wale flavoured packs milenge?',
      'o:Ji, Peri Peri, Cream & Onion aur Salt & Pepper, teeno 55g. MRP Rs 102 hai. Box mein 24 packs aate hain.',
      'i:Ek box mein kitna margin bachega?',
      'o:Around 25 percent, so per box roughly Rs 600 aapka margin. Rate card bhej raha hu.',
      'i:Theek hai bhejiye, partner se baat karke batata hu.'
    ] },
    sent: ['positive', 'wants_pricing', 'Interested in 55g makhana packs and trail mix, wants to confirm with his partner.'] },
  { co: 'Brew Room Cafe', cat: 'hotel_cafe', who: 'Sneha Kapoor', region: 'Bengaluru', place: 'Indiranagar', stage: 'interested', src: 'referral', age: 13, note: 'Three outlets. Looking for a jar of roasted mixed nuts for tables and packed snack boxes for takeaway.', domain: 'brewroom.in',
    wa: { last: 3, span: 7, msgs: [
      'o:Hi Sneha, Karthik from Happilo. Heard from Aditya that you want snack options for the cafes. We can do 1 kg bulk packs of roasted and salted almonds, cashews and party mix.',
      'i:Yes. We want roasted almonds and cashews for the counter jars, around 8 kg a week across 3 outlets.',
      'o:For that volume I can offer 1 kg packs at about Rs 1,150 a kg for cashew and Rs 920 for almonds. Delivered to Indiranagar, weekly or fortnightly.',
      'i:Can you share the exact prices on mail? Our accounts team needs it with GST.',
      'o:Sure, will mail within the hour.'
    ] },
    sent: ['positive', 'wants_pricing', 'Needs about 8 kg a week for three cafes, wants a written quote with GST for accounts.'] },
  { co: 'SnackSquare Marketplace', cat: 'ecommerce_reseller', who: 'Kavya Pillai', region: 'Bengaluru', place: 'Koramangala', stage: 'interested', src: 'inbound', age: 20, note: 'Sells snack subscription boxes on their own site and Instagram.', domain: 'snacksquare.in',
    em: { last: 2, span: 6, subject: 'Re: Reseller price list - Happilo', msgs: [
      'o:Hi Kavya,\n\nSharing the reseller price list. Makhana 55g (all three flavours) and the 160g Daily Super Health Mix work best for subscription boxes. MOQ is 10 cartons per order.\n\nRegards,\nRohan Verma\nHappilo B2B Team',
      'i:Hi Rohan,\n\nThanks. 10 cartons of makhana is fine for us, but the Daily Super Health Mix is high at the quoted rate. Can you do something better if we take 15 cartons every month?\n\nKavya',
      'o:Hi Kavya, for 15 cartons a month we can bring it down by about 6 percent and keep the price fixed for 3 months. I will confirm in writing once my manager signs off.\n\nRohan'
    ] },
    wa: { last: 5, span: 3, msgs: ['o:Hi Kavya, Rohan from Happilo. Sent the reseller list on mail. Let me know if the MOQ works.', 'i:Saw it, thanks. Replying on mail today.'] },
    sent: ['positive', 'wants_pricing', 'Wants 15 cartons a month of makhana and Daily Super Health Mix, negotiating on price.'] },
  { co: 'Sunrise Fitness Club', cat: 'gym_wellness', who: 'Vikram Nayak', role: 'Owner', region: 'Chennai', place: 'Anna Nagar', stage: 'interested', src: 'google_maps', age: 18, note: 'Premium gym, ~700 members. Has a juice and snack bar at reception.',
    wa: { last: 6, span: 5, msgs: [
      'o:Hello Vikram sir, this is Divya from Happilo. We supply protein-friendly snack options like roasted pistachios, almonds, sports mix and makhana to gym counters. Would you like to see?',
      'i:Yes, my members ask for healthy snacks after workout. Something small packs, not 500g.',
      'o:The Premium International Sports Mix 350g and the Daily Super Health Mix 160g sell well in gyms. Single serve packs of makhana 55g also. I can send a trial carton.',
      'i:Send the Daily Super Health Mix and the makhana. I will place near the counter and see for 2 weeks.',
      'o:Done. Please share the address and I will dispatch tomorrow.'
    ] },
    sent: ['positive', 'wants_sample', 'Will trial Daily Super Health Mix and makhana at the counter for two weeks.'] },
  { co: 'Royal Occasions Gifting', cat: 'corporate_gifting', who: 'Tanvi Shah', region: 'Mumbai', place: 'Powai', stage: 'interested', src: 'google_maps', age: 24, note: 'Event and gifting company, handles BFSI client gifts. Prefers email.', domain: 'royaloccasions.in',
    em: { last: 3, span: 10, subject: 'Re: Premium gifting range for corporate clients', msgs: [
      'o:Dear Tanvi,\n\nI am from the Happilo B2B team. Our gifting boxes are available at several budget levels and we also supply loose premium nuts for your own hamper designs. Could I share the catalogue with prices?\n\nRegards,\nDivya Nair',
      'i:Hi Divya, yes please. Our clients are mostly banks and we need good packaging. What is the lead time for 250 boxes?',
      'o:Hi Tanvi, 250 boxes need about 8 to 10 working days. I have attached the catalogue. Boxes at Rs 799, Rs 1,199 and Rs 1,799 are the popular ones for BFSI.',
      'i:Thanks. Please send photos of the Rs 1,199 box with the inside layout. Also is the GST invoice with HSN code?'
    ] },
    sent: ['positive', 'asking_details', 'Gifting vendor for banks, needs 250 boxes, asking for box photos and GST invoice details.'] },
  { co: 'Kaveri Trading Co.', cat: 'distributor', who: 'Madhavan Subramanian', region: 'Chennai', place: 'T. Nagar', stage: 'interested', src: 'referral', age: 28, note: 'Established FMCG distributor for south Chennai, wants a dry fruits line with decent margin.', domain: 'kaveritrading.co.in',
    wa: { last: 5, span: 14, msgs: [
      'o:Vanakkam Madhavan sir, Karthik from Happilo B2B. Shankar sir from Annanagar suggested we speak. We are expanding distribution in Tamil Nadu.',
      'i:Vanakkam. Yes, he told me. What is your margin structure for distributors?',
      'o:Distributor margin is 8 to 10 percent on top of the retailer margin, depends on SKU mix and monthly volume. Minimum first order is about Rs 2 lakh.',
      'i:We handle around 400 retailers. Dry fruits is seasonal for us, what about Diwali and wedding season support?',
      'o:We run trade schemes during Diwali and wedding months, plus display units for large retailers. I will send the distributor application form.',
      'i:Send it. I will fill and discuss with my partner.'
    ] },
    sent: ['positive', 'wants_pricing', 'Handles around 400 retailers in south Chennai, reviewing the distributor form with his partner.'] },
  { co: 'Hotel Grand Orchid', cat: 'hotel_cafe', who: 'Imran Qureshi', role: 'Purchase manager', region: 'Mumbai', place: 'Bandra West', stage: 'interested', src: 'google_maps', age: 15, note: '120-room hotel, wants in-room snack baskets and breakfast buffet nuts.', domain: 'grandorchid.in',
    wa: { last: 2, span: 6, msgs: [
      'o:Good morning Imran sir, Rohan from Happilo. We supply bulk nuts, dates and trail mix to hotels, including packs for in-room baskets.',
      'i:Good morning. We are redoing our room baskets for December. Need small packs, something premium, 120 rooms plus banquet.',
      'o:For in-room we suggest Happilo makhana 55g and the 160g Daily Super Health Mix. For buffet, 1 kg bulk packs of almonds, raisins and anjeer. I will send a quote.',
      'i:Please do. Also we need FSSAI copy and the product spec sheet for our records.'
    ] },
    em: { last: 2, span: 0, subject: 'FSSAI and spec sheets - Happilo', msgs: ['o:Dear Imran sir,\n\nAttached are our FSSAI licence copy and product specification sheets. I have also added an indicative quote for 120 rooms at 3 refills a month.\n\nRegards,\nRohan Verma\nHappilo B2B Team\ncare@happilo.com | +91 88844 84000'] },
    sent: ['positive', 'asking_details', 'Redoing in-room baskets for December, asked for FSSAI copy and spec sheets.'] },

  /* ------------------------------ Sample sent ----------------------------- */
  { co: 'Anand Gifting Studio', cat: 'corporate_gifting', who: 'Meenal Anand', region: 'Bengaluru', place: 'Indiranagar', stage: 'sample_sent', src: 'referral', age: 31, note: 'Sample gift-box kit sent. Takes festive orders from IT companies, volumes of 100 to 400 boxes.', domain: 'anandgifting.com', rep: 1,
    wa: { last: 1, span: 14, msgs: [
      'o:Hi Meenal ji, Karthik from Happilo. As discussed, I will send our festive box samples to your Indiranagar studio.',
      'i:Yes please. We have two clients asking for dry fruit boxes for New Year. Budget 700 to 900.',
      'o:Dispatched today via Delhivery, AWB 3914 2207 6615. Should reach by Thursday.',
      'i:Received the box yesterday. Packaging looks nice, almonds and cashews very fresh.',
      'i:One client wants the sleeve in their brand colours. Is that possible for 150 boxes?',
      'o:Yes, custom sleeve is possible from 100 boxes, artwork needs 3 days to approve. I will send the price with sleeve printing today.',
      'i:Okay, send. We will decide by Friday.'
    ] },
    sent: ['positive', 'wants_pricing', 'Liked the sample, one client wants 150 boxes with branded sleeve, deciding by Friday.'] },
  { co: 'Nutri Basket Mart', cat: 'retail_store', who: 'Farhan Sheikh', region: 'Hyderabad', place: 'Banjara Hills', stage: 'sample_sent', src: 'google_maps', age: 26, note: 'Upmarket grocery store, health-food aisle. Sample sent for dates and nuts.',
    wa: { last: 3, span: 10, msgs: [
      'o:Hello Farhan sir, Divya from Happilo. We can send you samples of Medjoul dates, Ajwa dates and roasted pistachios. Which address?',
      'i:Send to Road No. 12 store. Our customers like dates especially in this season, but price should work.',
      'o:Sent via Blue Dart, AWB 5028 3317 441. Please check the King Medjoul 200g, retail Rs 395, and Ajwa 500g Rs 795.',
      'i:Got it. Medjoul is very good, Ajwa also fine. Can you do slightly better on Ajwa for 20 boxes?',
      'o:For 20 boxes we can improve margin by 3 percent. I will confirm the exact number by evening.'
    ] },
    call: { daysAgo: 6, outcome: 'voicemail' },
    sent: ['positive', 'wants_pricing', 'Sample of dates approved, asking for better margin on Ajwa for 20 boxes.'] },
  { co: 'Lakeview Resort & Spa', cat: 'hotel_cafe', who: 'Deepa Thomas', role: 'Housekeeping and F&B', region: 'Pune', place: 'Lonavala', stage: 'sample_sent', src: 'referral', age: 22, note: 'Resort with 85 rooms and a weekend-banquet business. Welcome-basket and buffet requirement.',
    wa: { last: 4, span: 8, msgs: [
      'o:Hi Deepa ma\'am, Rohan from Happilo. Courier with the trail mix and nuts sample is on the way, AWB 7711 0482 9930.',
      'i:Received. The team tried the Panchmewa and the party mix, both were liked. Guests like the roasted flavour.',
      'o:Great to hear ma\'am. For weekend banquets, we also have 1 kg packs of the party mix at a better rate. Can I send the rates?',
      'i:Yes, with delivery cost to Lonavala and what quantity is the minimum.'
    ] },
    sent: ['positive', 'wants_pricing', 'Resort team liked Panchmewa and party mix, wants rates and delivery cost to Lonavala.'] },
  { co: 'Arogya Pharmacy Chain', cat: 'retail_store', who: 'Neelam Joshi', role: 'Category manager', region: 'Kolkata', place: 'Salt Lake', stage: 'sample_sent', src: 'trade_show', age: 33, note: 'Met at a retail expo. 14 pharmacy outlets in Kolkata, wants sugar-free and health snacks.', domain: 'arogyapharmacy.in',
    wa: { last: 5, span: 12, msgs: [
      'o:Hello Neelam ma\'am, Karthik from Happilo. Nice meeting you at the expo. Sending you the samples, AWB 6620 1198 5532.',
      'i:Got the box today, thank you. We will taste and share with the store heads.',
      'i:Our customers ask for no-added-sugar snacks. Which of your products are good for that? Also need to know the shelf life.',
      'o:Our makhana, roasted seeds, unsalted pistachios and the Daily Super Health Mix have no added sugar. Shelf life is 9 to 12 months from packing depending on the SKU, I will send details in writing.'
    ] },
    sent: ['neutral', 'asking_details', 'Reviewing samples with store heads, asking which SKUs are no-added-sugar and about shelf life.'] },
  { co: 'Jain Brothers Distribution', cat: 'distributor', who: 'Naresh Jain', region: 'Ahmedabad', place: 'Navrangpura', stage: 'sample_sent', src: 'google_maps', age: 29, note: 'Distributor for biscuits and snacks, 6 salesmen on road. Adding dry fruits.',
    wa: { last: 6, span: 11, msgs: [
      'o:Namaste Naresh bhai, Happilo ki taraf se. Aapke liye sample carton bheja hai, tracking 4419 7720 3381.',
      'i:Mil gaya. Packaging achhi hai. Ab humein dekhna hai ki market me kaise chalta hai.',
      'o:Bilkul. Aap 2-3 kirana wale se feedback le lijiye. Main kal call karta hu pricing discuss karne.',
      'i:Haan thik hai, Friday ke baad call karna.'
    ] },
    sent: ['neutral', 'call_back_later', 'Got the carton, will get shop feedback first. Asked for a call after Friday.'] },
  { co: 'Vidyaniketan Public School', cat: 'institutional', who: 'Sister Anita Mathew', role: 'Administrator', region: 'Bengaluru', place: 'Hebbal', stage: 'sample_sent', src: 'referral', age: 20, note: 'School canteen and annual-day gift bags for around 1,500 students.',
    wa: { last: 7, span: 6, msgs: [
      'o:Good morning ma\'am, Divya from Happilo. We have sent a sample of trail mix and makhana for the canteen committee, AWB 3300 8821 7746.',
      'i:Received, thank you. Committee will taste on Wednesday. Please note we cannot have anything with sugar coating or colours.',
      'o:Understood ma\'am. All of our nuts, makhana and the Daily Super Health Mix are free from artificial colours and coating. FSSAI details are on the pack.'
    ] },
    sent: ['neutral', 'asking_details', 'Canteen committee tasting the sample, strict on no added sugar or colour.'] },
  { co: 'GiftNest Solutions', cat: 'corporate_gifting', who: 'Pooja Bansal', region: 'Delhi NCR', place: 'Cyber City, Gurugram', stage: 'sample_sent', src: 'inbound', age: 21, note: 'Gifting agency with MNC clients. Sample box and price list sent.', domain: 'giftnest.co.in',
    em: { last: 2, span: 9, subject: 'Re: Sample box dispatched - GiftNest', msgs: [
      'o:Hi Pooja,\n\nYour sample box left our Bengaluru warehouse today (AWB 8812 4401 5509, Delhivery). It has the Rs 1,199 gift box and two trail mixes. Please share your feedback once you open it.\n\nRegards,\nRohan Verma\nHappilo B2B Team',
      'i:Hi Rohan,\n\nBox arrived, very nice. Our client wants about 400 boxes for a mid-December event. Can you do dispatch to Gurugram by 10th December and what would be the price at 400?\n\nPooja Bansal',
      'o:Hi Pooja, glad it reached well. 400 boxes by the 10th is doable if we get the PO by the end of next week. I will send the quote tonight.\n\nRohan'
    ] },
    wa: { last: 3, span: 0, msgs: ['o:Hi Pooja, just confirming the sample box has reached. Rohan from Happilo.', 'i:Yes received, replying on mail.'] },
    sent: ['positive', 'wants_pricing', 'Client wants 400 boxes in Gurugram by 10 December, waiting for the quote.'] },

  /* ------------------------------ Demo booked ----------------------------- */
  { co: 'Bharat Hampers & Co.', cat: 'corporate_gifting', who: 'Harish Menon', region: 'Chennai', place: 'T. Nagar', stage: 'demo_booked', src: 'google_maps', age: 27, note: 'Hamper company with a showroom. Meeting booked for next Tuesday at their shop.', domain: 'bharathampers.in', rep: 1,
    wa: { last: 1, span: 10, msgs: [
      'o:Hello Harish sir, Karthik from Happilo. Thanks for taking my call yesterday. Can we fix a time to show you the gift boxes and bulk packs?',
      'i:Yes, you can come to the shop next Tuesday afternoon, after 3. We are in Usman Road, T. Nagar.',
      'o:Tuesday 3:30 works. I will bring the box range plus bulk samples for cashew, pistachio and walnut kernel.',
      'i:Good. Also bring the price for 2000 pieces of the small 250g box, we have a big wedding-season order.',
      'o:Noted sir. I will carry that costing. See you Tuesday.'
    ] },
    call: { daysAgo: 4, outcome: 'completed', secs: 214, lines: [
      'A:Hello, may I speak with Harish ji? This is Aarav calling from Happilo.',
      'U:Yes speaking. Who is this, Happilo dry fruits?',
      'A:Yes sir. I saw you showed interest in our festive and wedding gift boxes. Is this a good time for two minutes?',
      'U:Okay, tell me. Right now we are making hampers for New Year and also weddings, so many people are asking for dry fruits.',
      'A:That is exactly where we help sir. We have ready boxes and also loose packs, you can fill your own design. For bigger orders there is a trade price.',
      'U:How much for a 250 gram box, if I take 2000?',
      'A:For that quantity our key account manager Karthik will give you the exact price, I do not want to give a wrong number. Can he visit your shop next week?',
      'U:Yes, Tuesday afternoon is fine. Tell him to message me.',
      'A:Perfect sir, he will confirm on WhatsApp today. Thank you for your time.'
    ], summary: 'Harish is making wedding and New Year hampers, asking for price on 2,000 pieces of the 250g box. Meeting fixed for Tuesday afternoon.' },
    sent: ['positive', 'wants_demo', 'Meeting fixed at his T. Nagar shop, needs a price for 2,000 small boxes for wedding season.'] },
  { co: 'Daily Needs Hypermart', cat: 'retail_store', who: 'Suresh Reddy', region: 'Hyderabad', place: 'Madhapur', stage: 'demo_booked', src: 'google_maps', age: 25, note: '3 hypermarts in Hyderabad. Category buyer meeting at head office on Thursday.', domain: 'dailyneedshyper.in',
    wa: { last: 2, span: 12, msgs: [
      'o:Good evening Suresh garu, Divya from Happilo. We would like to present our range for your dry fruit and snack shelf. May I share a few slots?',
      'i:Our category buyer Anjali handles it. Send me the details and I will forward.',
      'o:Sharing the retail deck. Brief: Happilo is on Amazon, Flipkart, Blinkit and Zepto, so shoppers already know the brand. We can offer planogram and one-time listing support.',
      'i:Anjali will meet you Thursday 11 AM at our Madhapur office. Bring the listing form.',
      'o:Confirmed sir. I will be there with the team.'
    ] },
    sent: ['positive', 'wants_demo', 'Meeting with their category buyer on Thursday at the Madhapur head office.'] },
  { co: 'Annapurna Catering & Canteen Services', cat: 'institutional', who: 'Rahul Bhatia', role: 'Procurement', region: 'Pune', place: 'Hinjewadi', stage: 'demo_booked', src: 'google_maps', age: 30, note: 'Runs canteens in 9 IT parks. Evening snack counter and a "healthy pantry" contract.',
    wa: { last: 3, span: 9, msgs: [
      'o:Hi Rahul sir, Rohan from Happilo. We supply bulk nuts and trail mixes to corporate pantries. Happy to do a tasting at your office.',
      'i:We do have a pantry contract starting January for two big clients. Want almonds, raisins, trail mix. Come for a tasting.',
      'o:Sure. How about Wednesday 4 PM at your Hinjewadi office? I will bring the 1 kg packs and the sports mix.',
      'i:Wednesday works. Will call you from the gate.'
    ] },
    call: { daysAgo: 9, outcome: 'completed', secs: 157, lines: [
      'A:Hi, am I speaking to Rahul ji? This is Aarav from Happilo.',
      'U:Yes, tell me.',
      'A:Sir, I am calling about nuts and trail mix supply for your canteens and pantries. Do you have a few minutes?',
      'U:Yes but I am in a meeting, quickly.',
      'A:Sure sir. Right now are you buying from a local wholesaler or a brand?',
      'U:Local wholesaler, quality changes every month, that is the problem.',
      'A:Understood. Our packs have a fixed grade and FSSAI batch details, so the quality stays the same. Can our manager come with samples this week?',
      'U:Send him on Wednesday, message me the time.',
      'A:Will do sir. Thank you.'
    ], summary: 'Buys from a local wholesaler and struggles with inconsistent quality. Tasting booked for Wednesday at the Hinjewadi office.' },
    sent: ['positive', 'wants_demo', 'Quality is inconsistent with the local wholesaler, tasting booked at their Hinjewadi office.'] },
  { co: 'Patel Super Bazaar', cat: 'retail_store', who: 'Jignesh Patel', region: 'Ahmedabad', place: 'Satellite', stage: 'demo_booked', src: 'referral', age: 23, note: 'Supermarket chain with 5 stores in Ahmedabad. Our rep visits on Saturday.',
    wa: { last: 2, span: 9, msgs: [
      'o:Namaste Jignesh bhai, Divya from Happilo. Aapko Mehta ji ne refer kiya tha. Kya hum store par aa kar range dikha sakte hain?',
      'i:Haan aao, Saturday subah 11 baje Satellite store par. Owner bhi rahenge.',
      'o:Confirmed. Saturday 11 baje. Main display sample aur rate card laungi.',
      'i:Ok. Credit kitna milega ye bhi batana.'
    ] },
    sent: ['positive', 'wants_demo', 'Store visit fixed for Saturday 11 AM, will ask about credit terms.'] },
  { co: 'Saffron Leaf Restaurant', cat: 'hotel_cafe', who: 'Gurpreet Singh', role: 'Head chef', region: 'Delhi NCR', place: 'Karol Bagh', stage: 'demo_booked', src: 'google_maps', age: 17, note: 'North Indian restaurant with banquet hall. Uses a lot of almonds, cashews, raisins and makhana in sweets and gravies.',
    wa: { last: 4, span: 6, msgs: [
      'o:Sat sri akal chef, Karthik from Happilo. We supply bulk cashew, almond and makhana. Can I show you the grades?',
      'i:Sat sri akal. Cashew we use a lot for gravies, around 40 kg a month. Aajao shaam ko.',
      'o:I will come Friday evening around 6 with W320 and split cashew samples and the fox nut.',
      'i:Okay, split cashew bhi rate batana.'
    ] },
    call: { daysAgo: 8, outcome: 'completed', secs: 188, lines: [
      'A:Hello chef, this is Aarav calling from Happilo. We sell cashews, almonds and makhana in bulk.',
      'U:Haan bolo, kya rate hai cashew ka?',
      'A:Sir, rate depends on grade and quantity. Our manager can come with samples and quote on the spot. Do you buy about 40 kg a month?',
      'U:Hmm, 40-50 kg. Abhi Sadar Bazaar se lete hain, thoda mehnga padta hai.',
      'A:Understood sir. We offer direct delivery and GST invoice, and quality is the same each month. Can he come Friday evening?',
      'U:Ha Friday shaam theek hai.',
      'A:Thank you chef, he will message you.'
    ], summary: 'Uses 40 to 50 kg cashew a month, currently buying from Sadar Bazaar and finds it expensive. Visit planned Friday evening.' },
    sent: ['positive', 'wants_demo', 'Buys 40 to 50 kg cashew a month from Sadar Bazaar, wants rates and samples on Friday.'] },

  /* ------------------------------- Negotiation ---------------------------- */
  { co: 'Venkatesh FMCG Distributors', cat: 'distributor', who: 'Venkatesh Babu', region: 'Hyderabad', place: 'Secunderabad', stage: 'negotiation', src: 'referral', age: 38, note: 'Negotiating margin slabs for Telangana distributorship. Wants exclusivity for 12 months.', domain: 'venkateshfmcg.com', rep: 2,
    wa: { last: 1, span: 24, msgs: [
      'o:Namaste Venkatesh garu, Karthik from Happilo. As discussed, sending the distributor terms for Telangana.',
      'i:Received. Margin of 8 percent is low, other brands give 11 to 12 on dry fruits. Also need exclusivity.',
      'o:Sir, I can take 10 percent for first 6 months with a quarterly target of Rs 12 lakh. Exclusivity is possible for Hyderabad and Rangareddy once target is met.',
      'i:Target is fine for the first quarter if you support with 2 promoters and display stands.',
      'o:We can do one promoter for 3 months and 25 display units. Let me get approval for the second.',
      'i:Okay. Also credit, we need 30 days. Our retailers pay us in 21 to 25 days.',
      'o:I will push for 21 days with a cheque. Will come back by tomorrow evening.',
      'i:Fine. If this works we can place the first PO of around Rs 6 lakh this month itself.'
    ] },
    em: { last: 2, span: 0, subject: 'Telangana distributorship - draft terms', msgs: ['o:Dear Venkatesh garu,\n\nPlease find the draft distributor agreement. Highlights: territory Hyderabad, Rangareddy and Medchal; 10 percent margin for the first two quarters; quarterly target Rs 12 lakh; credit 21 days against PDC; one promoter for 3 months.\n\nKindly share your comments.\n\nRegards,\nKarthik Iyer\nHappilo B2B Team'] },
    call: { daysAgo: 6, outcome: 'completed', secs: 241, lines: [
      'A:Hello Venkatesh ji, this is Aarav from Happilo. Karthik asked me to check if you received the agreement draft.',
      'U:Yes yes, got it. I am reading. Few points I will discuss with Karthik directly.',
      'A:Sure sir. Are the margin and the credit period the main points?',
      'U:Margin and credit, yes. Also what about expiry returns? Dry fruits get old on the shelf.',
      'A:Good question sir. Our shelf life is long, and near-expiry stock is exchanged under the agreement. Karthik can walk you through the clause.',
      'U:Okay, let him call me tomorrow morning.',
      'A:I will let him know. Thank you sir.'
    ], summary: 'Reading the agreement. Main concerns are margin, credit period and expiry returns. Karthik to call next morning.' },
    sent: ['positive', 'wants_pricing', 'Close to a Rs 6 lakh first order, still negotiating margin, 21 vs 30 days credit and promoter support.'] },
  { co: 'Sharma Traders', cat: 'distributor', who: 'Vinod Sharma', region: 'Delhi NCR', place: 'Sadar Bazar', stage: 'negotiation', src: 'referral', age: 35, note: 'Old Sadar Bazar wholesaler, sells to mithai shops and kirana across north Delhi. Wants cheaper bulk slabs.',
    wa: { last: 2, span: 17, msgs: [
      'o:Namaste Vinod ji, Divya from Happilo. As per our last discussion sending the bulk slab sheet for cashew, almond, pistachio and raisins.',
      'i:Rate zyada hai. Sadar me almond aaj Rs 760 per kilo hai, aapka packed rate kaise match karega?',
      'o:Ji, hum sealed branded packs dete hain jo retailer ko MRP par bechne dete hain. Almond 400g Jumbo ka MRP 476. Margin 25 percent, wholesalers ko extra 6 percent slab.',
      'i:Packs me chalega lekin humein 1 kg ya 5 kg ke pack bhi chahiye, loose ke sath. Kya milega?',
      'o:Hum 1 kg bulk packs de sakte hain almond, cashew, raisin aur pista ke. 5 kg carton pe special rate mil jayega.',
      'i:Theek, 5 kg wale carton ka final rate bhejo. Hum pehla order 3 lakh ka denge agar rate sahi laga.'
    ] },
    sent: ['positive', 'wants_pricing', 'Will place a Rs 3 lakh first order if the 5 kg carton rate beats Sadar Bazar loose prices.'] },
  { co: 'Nexus Corporate Hampers', cat: 'corporate_gifting', who: 'Sidharth Rao', region: 'Bengaluru', place: 'Koramangala', stage: 'negotiation', src: 'inbound', age: 33, note: 'Large corporate gifting house. In talks for a 1,200 box order for a software client; negotiating price and delivery schedule.', domain: 'nexushampers.com', rep: 3,
    wa: { last: 1, span: 20, msgs: [
      'i:Hi, we saw your corporate gifting page. Need 1200 dry fruit boxes for a client, delivery in Bengaluru and Mysuru before 20th Dec. Please share options.',
      'o:Hello Sidharth, Rohan from Happilo. Thanks for reaching out. 1,200 boxes by the 20th is doable if we lock the design by 25 Nov. What is the per box budget?',
      'i:Rs 850 to 900 per box. 4 items. Printed sleeve with their logo.',
      'o:A 4-item box with almonds, cashews, raisins and dates in that range is possible. At 1,200 boxes I can quote Rs 879 per box with the sleeve, GST extra.',
      'i:Competitor is giving Rs 840. Can you match?',
      'o:Sir I can come down to Rs 859 if we get a 50 percent advance and you accept a single delivery point in Bengaluru. Mysuru would be dispatched separately.',
      'i:Let me discuss. Also please send the exact box items with weights, our client will ask.',
      'o:Sending the breakup now. Almonds 50g, cashews 50g, raisins 50g, Kimia dates 100g.'
    ] },
    em: { last: 1, span: 4, subject: 'Quotation - 1200 gift boxes', msgs: ['o:Dear Sidharth,\n\nQuotation as discussed: 1,200 four-item gift boxes with printed sleeve at Rs 859 per box plus 12 percent GST. 50 percent advance, balance before dispatch. Delivery to Bengaluru, Mysuru by 20 Dec.\n\nRegards,\nRohan Verma', 'i:Hi Rohan, quote received. Client has approved the sleeve design. We are checking delivery split internally and will confirm the PO quantity by Monday.\n\nSidharth'] },
    sent: ['positive', 'wants_pricing', 'Wants 1,200 boxes by 20 December, comparing a competitor at Rs 840, client approved the sleeve design.'] },
  { co: 'Fresh & Fine Supermart', cat: 'retail_store', who: 'Arvind Nair', region: 'Kochi', place: 'Edappally', stage: 'negotiation', src: 'google_maps', age: 30, note: 'Four supermarkets in Ernakulam district. Discussing listing fee and a launch scheme.',
    wa: { last: 3, span: 15, msgs: [
      'o:Hello Arvind sir, Divya here. Following our meeting at Edappally, sharing the price list and scheme sheet.',
      'i:Thanks Divya. Listing fee for 4 stores is something we need to discuss. We usually take Rs 15,000 per store for new brands.',
      'o:Sir for a new brand launch we can support with display units and a 2 percent extra margin for the first 3 months instead of listing fee.',
      'i:Hmm. Let me check with the finance head. If margin is 27 percent total, we can start with 25 SKUs in all 4 stores.',
      'o:27 percent on makhana and dates, 25 on the rest, can we do that sir?',
      'i:Will confirm in 2 days.'
    ] },
    sent: ['positive', 'wants_pricing', 'Ready to list 25 SKUs in 4 stores, haggling over listing fee versus extra margin.'] },
  { co: 'NutriKart Online', cat: 'ecommerce_reseller', who: 'Abhishek Jha', region: 'Hyderabad', place: 'Madhapur', stage: 'negotiation', src: 'inbound', age: 27, note: 'Online health food store with 12k monthly orders. Wants bulk pricing on makhana, seeds and trail mix.', domain: 'nutrikart.in',
    em: { last: 2, span: 12, subject: 'Re: Bulk supply - makhana, seeds and trail mix', msgs: [
      'i:Hi, we run NutriKart, around 12,000 orders a month. We want to stock Happilo makhana, seeds and trail mixes. Please share bulk pricing and the minimum order.',
      'o:Hi Abhishek,\n\nThanks for writing. For resellers we have MOQ of 20 cartons per order and fixed selling-price guidelines. I have attached our reseller price list.\n\nRegards,\nRohan Verma',
      'i:Thanks Rohan. We will take 40 cartons in the first order. Our concern is the price parity with Amazon. Can you share the MAP policy?',
      'o:Hi Abhishek, our MAP is within 5 percent of Amazon selling price. I am attaching the policy and a draft agreement. 40 cartons first order is perfectly fine.',
      'i:Looks ok. Legal is reviewing. Meanwhile can you do 45 days credit on the second order?'
    ] },
    wa: { last: 4, span: 0, msgs: ['o:Hi Abhishek, Rohan from Happilo. Sent the draft agreement on mail. Let me know once your legal team shares comments.', 'i:Sure, will do. They will take 2 to 3 days.'] },
    sent: ['positive', 'wants_pricing', 'Planning a 40 carton first order, legal reviewing agreement, asking for 45 days credit on later orders.'] },

  /* ---------------------------------- Won --------------------------------- */
  { co: 'Kothari Corporate Gifts', cat: 'corporate_gifting', who: 'Rajesh Kothari', region: 'Mumbai', place: 'Andheri East', stage: 'won', src: 'google_maps', age: 52, note: 'Closed Rs 7.5 lakh Diwali corporate hamper order (about 640 boxes). Delivered before Diwali. Repeat likely for New Year.', domain: 'kotharigifts.com', rep: 1,
    wa: { last: 6, span: 40, msgs: [
      'o:Namaste Rajesh ji, Karthik from Happilo B2B. We supply gift boxes for corporate Diwali gifting and would like to show you our range.',
      'i:Namaste. Yes we are planning for Diwali. We have 6 corporate clients, quantity maybe 600 plus. What are your box options?',
      'o:We have boxes at Rs 799, Rs 999, Rs 1,299 and Rs 1,799. The Rs 1,299 box has almonds, cashews, pistachios, Medjoul dates and a trail mix, and is the most picked for corporates.',
      'i:Send photos and send one sample. I will show to the clients.',
      'o:Sample courier sent today, AWB 4417 8820 1163.',
      'i:Sample received. Clients liked the Rs 999 and Rs 1,299 boxes. Total 640 boxes, split 380 of 999 and 260 of 1299. Can you give a final price?',
      'o:For 640 boxes total value comes to Rs 7.5 lakh with GST. 50 percent advance and balance on dispatch. Delivery before 4th Nov.',
      'i:Done. I am sending the PO and the advance today.',
      'i:Delivery done, all clients received. Quality was excellent, thanks to your team. We will talk for New Year and Christmas orders.'
    ] },
    sent: ['positive', 'wants_pricing', 'Delivered 640 Diwali boxes worth Rs 7.5 lakh, happy with quality, will talk New Year and Christmas.'] },
  { co: 'Om Sai Agencies', cat: 'distributor', who: 'Prakash Kulkarni', region: 'Pune', place: 'Kothrud', stage: 'won', src: 'referral', age: 47, note: 'Signed as Pune sub-distributor. First order of Rs 2.4 lakh, 140 retailers on their route.',
    wa: { last: 9, span: 30, msgs: [
      'o:Namaste Prakash ji, Karthik from Happilo. Heard from Joshi ji that you are looking at adding a dry fruit brand.',
      'i:Yes. Our retailers in Kothrud, Karve Road and Warje ask for branded packs. What is your distributor structure?',
      'o:Sub-distributor margin is 8 percent plus retailer schemes. First order minimum Rs 2 lakh. We handle logistics up to your godown.',
      'i:OK. Let me see the product list and check space. Send it.',
      'o:Sent. The best movers in Pune are 200g cashew, 200g almonds, makhana 55g and the Panchmewa mix.',
      'i:We can start with Rs 2.4 lakh. Sending PO on mail. Please dispatch to Kothrud godown.',
      'o:Received PO. Dispatch Thursday, delivery in 3 days.',
      'i:Stock received, all fine. Starting to supply this week.'
    ] },
    sent: ['positive', 'wants_pricing', 'First stock of Rs 2.4 lakh received, started supplying 140 retailers.'] },
  { co: 'Sri Lakshmi Provision Stores', cat: 'retail_store', who: 'Lakshmanan Murugesan', region: 'Chennai', place: 'Anna Nagar', stage: 'won', src: 'google_maps', age: 40, note: 'Neighbourhood supermarket. Reorders every 2 weeks, mostly makhana, cashews and dates.',
    wa: { last: 3, span: 28, msgs: [
      'o:Vanakkam Lakshmanan sir, Divya from Happilo. We supply branded nuts, dates and makhana to stores in Anna Nagar.',
      'i:Vanakkam. We keep loose items mostly. Packaged stuff sells less. But Happilo name customers know, can try.',
      'o:Sir 1 carton mixed first order is fine, around Rs 16,000. Delivery free.',
      'i:Send one carton. 5 cashew 200g, 5 almond, 24 makhana, 10 dates.',
      'o:Done, delivery on Monday. Invoice with GST.',
      'i:Received, stock finished in 10 days only. Need again, send same plus 5 more Medjoul.',
      'o:Sure sir, dispatching tomorrow.',
      'i:Okay, payment sent by UPI.'
    ] },
    sent: ['positive', 'wants_pricing', 'Reorders every two weeks, first carton sold out in 10 days.'] },
  { co: 'Cloud9 Cowork Cafe', cat: 'hotel_cafe', who: 'Nikhil Verma', region: 'Bengaluru', place: 'Whitefield', stage: 'won', src: 'inbound', age: 36, note: 'Co-working cafe, monthly pantry supply for 3 floors. About 25 kg of mixed nuts and trail mix a month.', domain: 'cloud9cowork.com',
    wa: { last: 5, span: 22, msgs: [
      'i:Hi Happilo team, need monthly supply of nuts and trail mix for our pantry, 3 floors. What are the options?',
      'o:Hi Nikhil, Rohan from Happilo B2B. For pantries we suggest 1 kg packs of roasted almonds, party mix and Daily Super Health Mix. Around how many members use the pantry?',
      'i:About 350 daily. Maybe 25 kg a month all together.',
      'o:Then I can offer a monthly standing order with fixed rates. Delivery on the first week of each month. I will send the rates.',
      'i:Rates ok. Let us start with this month. Invoice on company name please.',
      'o:Done. Order confirmed, delivery on Wednesday. GST invoice will be on Cloud9 Cowork Pvt Ltd.',
      'i:First delivery received, everyone is happy with the party mix. Please continue the same order next month.'
    ] },
    sent: ['positive', 'wants_pricing', 'Monthly pantry order of about 25 kg, first delivery liked, standing order continues.'] },
  { co: 'Mehta Kirana & General', cat: 'retail_store', who: 'Dipti Mehta', region: 'Ahmedabad', place: 'Maninagar', stage: 'won', src: 'google_maps', age: 34, note: 'Small kirana, started with makhana and dates. Referred Patel Super Bazaar to us.',
    wa: { last: 8, span: 20, msgs: [
      'o:Namaste Dipti ben, Divya from Happilo. Hum makhana aur dry fruit packs kirana stores ko supply karte hain. Rate card bhej du?',
      'i:Bhejiye. Mere paas customers makhana maangte hain.',
      'o:Ji, sending. Starter carton me 24 Peri Peri, 24 Cream & Onion aur 12 Himalayan Salt makhana, plus 10 dates. Total Rs 9,400 approx.',
      'i:Chalega. Ek carton bhej do. GST bill chahiye.',
      'o:Done ben. Delivery Thursday tak.',
      'i:Maal mil gaya. Makhana to ek hafte me gaya. Aur bhejna.'
    ] },
    sent: ['positive', 'wants_pricing', 'Small kirana that sold the first makhana carton in a week and reordered.'] },

  /* ---------------------------------- Lost -------------------------------- */
  { co: 'Balaji Wholesale Mart', cat: 'distributor', who: 'Ramesh Agarwal', region: 'Jaipur', place: 'Sanganer', stage: 'lost', src: 'google_maps', age: 44, note: 'Chose a local importer who was Rs 40 a kilo cheaper on loose cashew. Said they may come back for branded packs.',
    wa: { last: 11, span: 18, msgs: [
      'o:Namaste Ramesh ji, Karthik from Happilo. Humare bulk rates share karna chahta hu.',
      'i:Bhejiye.',
      'o:Sent. Cashew W320 1 kg pack at Rs 1,140 per kilo ex-godown Jaipur.',
      'i:Mere ko local se Rs 1,100 mil raha hai. Aapka rate zyada hai.',
      'o:Sir ours is sealed and graded with batch number. Can I give you a sample to compare?',
      'i:Nahi, abhi zarurat nahi. Humne order de diya hai. Next time dekhenge.'
    ] },
    sent: ['negative', 'already_using_competitor', 'Ordered from a local importer about Rs 40 a kilo cheaper, open to branded packs later.'],
    call: { daysAgo: 14, outcome: 'completed', secs: 96, lines: [
      'A:Hello, may I speak with Ramesh ji? This is Aarav from Happilo.',
      'U:Haan, bolo.',
      'A:Sir, I wanted to check if you got the bulk rate sheet from my colleague.',
      'U:Mil gayi. Rate zyada hai bhai, mere paas local supplier hai.',
      'A:Understood sir. If you need sealed packs for your retail customers later, we are always here.',
      'U:Theek hai, abhi nahi.'
    ], summary: 'Price was higher than his local supplier. Not buying right now.' },
    voiceSent: ['negative', 'already_using_competitor', 'Has a cheaper local supplier, not buying now.'] },
  { co: 'Urban Tadka Kitchens', cat: 'hotel_cafe', who: 'Rohit Malhotra', role: 'Operations', region: 'Mumbai', place: 'Vashi', stage: 'lost', src: 'google_maps', age: 38, note: 'Cloud kitchen group. Liked the quality, but wanted 60 days credit and we could not offer it.',
    wa: { last: 9, span: 16, msgs: [
      'o:Hi Rohit, Rohan from Happilo. We supply nuts, raisins and makhana for kitchens. Can I send bulk rates?',
      'i:Yes. We use mostly cashew, raisins and almonds for gravies and desserts across 5 kitchens.',
      'o:Sure. Rates sent. For 5 kitchens we can deliver weekly, 40 kg cashew, 25 kg raisins and 20 kg almonds.',
      'i:Quality sample was good. The only issue is payment. We pay vendors in 60 days.',
      'o:Sir at this stage we can do 15 days. For 60 days we need a bank guarantee. Not possible for this size, I am sorry.',
      'i:Then we will go with our existing vendor for now. Thanks anyway.'
    ] },
    sent: ['negative', 'not_interested', 'Liked the quality but needs 60 days credit, which Happilo cannot offer at this size.'] },
  { co: 'Metro Vending Services', cat: 'institutional', who: 'Sanjay Ghosh', region: 'Kolkata', place: 'Howrah', stage: 'lost', src: 'google_maps', age: 42, note: 'Vending operator for stations and hospitals. Wants 50g sachets and a very low price point; we do not make that pack.',
    wa: { last: 13, span: 9, msgs: [
      'o:Namaskar Sanjay babu, Divya from Happilo. We can supply nuts and trail mixes for your vending machines.',
      'i:We need small 25 to 30 gram sachets at around Rs 8 to 10 each. Do you have?',
      'o:Our smallest pack right now is 55g makhana at Rs 102 MRP. We do not have 25g sachets at present.',
      'i:Then it will not work for us. Please remove us from the list.'
    ] },
    sent: ['not_interested', 'not_interested', 'Needs 25g sachets at Rs 8 to 10, Happilo has no such pack. Asked to be removed.'] },
  { co: 'HealthyHub Retail', cat: 'ecommerce_reseller', who: 'Zoya Khan', region: 'Delhi NCR', place: 'Dwarka', stage: 'lost', src: 'inbound', age: 36, note: 'Small online store. Wanted exclusive pricing on Amazon, not possible. Stopped replying after the policy was explained.', domain: 'healthyhubretail.in',
    em: { last: 12, span: 10, subject: 'Re: Reseller terms - Happilo', msgs: [
      'i:Hi, we sell healthy snacks on Amazon and Flipkart. Please share your reseller prices. We want to sell below MRP.',
      'o:Hi Zoya,\n\nThanks for your interest. We can supply at reseller price, but online selling has to stay within 5 percent of our listed price to keep the market fair for all partners. Can I send the full terms?\n\nRegards,\nRohan Verma\nHappilo B2B Team',
      'i:If we cannot discount then it does not make sense for us. Thanks.'
    ] },
    sent: ['negative', 'not_interested', 'Wanted to sell below MRP on marketplaces, price policy did not suit them.'] },
];
