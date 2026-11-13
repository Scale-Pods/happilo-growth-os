/** Happilo marketing — content pipeline drafts (dummy data). */

export interface ContentComment {
  author: string;
  text: string;
  time: string;
}

export interface ContentHistoryEntry {
  status: string;
  by: string;
  time: string;
  note: string;
}

export interface ContentDraft {
  id: string;
  title: string;
  type: string;
  platform: string;
  product: string;
  status: string; // draft | review | revision | approved | live
  scriptText: string;
  author?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  scheduleDate?: string;
  scheduleTime?: string;
  comments?: ContentComment[];
  version?: number;
  history?: ContentHistoryEntry[];
}

export const INITIAL_CONTENT_DRAFTS: ContentDraft[] = [
  {
    id: 'c-1',
    title: 'Walnut crack, nut cracker in the box',
    type: 'Creator brief',
    platform: 'Instagram Reels',
    product: 'California Inshell Walnuts with Free Nut Cracker',
    status: 'draft',
    author: 'Riya Shetty',
    version: 1,
    scriptText:
      'Hook (0-2s): Hand holds a walnut up to camera. "This one comes with its own cracker. Free."\n\nShot 1: Tight on the crack, natural sound only, no music for the first 3 seconds.\nShot 2: Kernel drops into a steel bowl. Show it is whole, not broken.\nShot 3: Pack on the counter, 200g, ₹200 (MRP ₹235). Nut cracker beside it.\n\nVoiceover: "Walnuts in the shell stay fresher for longer, and the cracker is already in the box. 200 grams, ₹200. Kholo, Khalo, Happilo."\n\nCaption: Fresh California walnuts, free nut cracker inside. ₹200 for 200g on happilo.com.',
    comments: [],
    history: [{ status: 'draft', by: 'Riya Shetty', time: '12 Nov, 5:40 pm', note: 'First cut of the brief' }],
  },
  {
    id: 'c-2',
    title: 'Ajwa, Medjoul or Kimia: which dates for winter',
    type: 'Explainer',
    platform: 'YouTube Shorts',
    product: 'International Ajwa Dates',
    status: 'draft',
    author: 'Kabir Nair',
    version: 1,
    scriptText:
      'Hook: "Three kinds of dates, three very different prices. Here is what you get."\n\n0:03 Ajwa, 500g, ₹795. Dense, less sweet, for people who want one or two a day.\n0:14 King Medjoul, 200g, ₹395. Big, soft, caramel-like. The gifting one.\n0:25 Super Soft Kimia, 500g, ₹395. Everyday, sweet and very soft, good with warm milk.\n0:36 On-screen: "Pick one for the winter shelf." Link in description.\n\nKeep it under 45 seconds. Shoot on the kitchen counter, daylight only.',
    comments: [],
    history: [{ status: 'draft', by: 'Kabir Nair', time: '13 Nov, 10:15 am', note: 'Outline saved' }],
  },
  {
    id: 'c-3',
    title: 'Christmas gift boxes, primary text variants',
    type: 'Ad copy',
    platform: 'Meta Ads',
    product: 'Gift boxes (₹500-999)',
    status: 'draft',
    author: 'Sneha Gowda',
    version: 2,
    scriptText:
      'Primary text A: Skip the cake this Christmas. Gift boxes of nuts, dry fruits and dates, packed and ready. ₹500 to ₹999.\n\nPrimary text B: Still looking for a gift for the office Secret Santa? ₹599 gets you a Happilo box people will actually finish.\n\nHeadline: Gift boxes from ₹499\nDescription: Add a gift bag at checkout.\nCTA button: Shop now\n\nAudience note: Metro 25-44, past 180-day purchasers excluded from Text B.',
    comments: [{ author: 'Sneha Gowda', text: 'Text B is for the cold audience only. Need a creative with the Secret Santa angle.', time: '12 Nov, 6:20 pm' }],
    history: [{ status: 'draft', by: 'Sneha Gowda', time: '12 Nov, 6:05 pm', note: 'Second round of copy' }],
  },
  {
    id: 'c-4',
    title: 'Makhana flavours broadcast',
    type: 'Broadcast',
    platform: 'WhatsApp Broadcast',
    product: 'Peri Peri Makhana',
    status: 'draft',
    author: 'Arjun Bhat',
    version: 1,
    scriptText:
      'Hi {first_name}, cold evenings call for something crunchy.\n\nOur makhana packs are ₹102 each (MRP ₹120):\n- Peri Peri\n- Cream & Onion\n- Himalayan Salt & Pepper\n\nRoasted, not fried. Try all three: happilo.com/collections/makhana\n\nKholo, Khalo, Happilo!',
    comments: [],
    history: [{ status: 'draft', by: 'Arjun Bhat', time: '13 Nov, 11:30 am', note: '' }],
  },
  {
    id: 'c-5',
    title: 'Super Mom’s Trail Mix, lunchbox routine',
    type: 'Creator brief',
    platform: 'Instagram Reels',
    product: 'Super Mom’s Trail Mix',
    status: 'review',
    author: 'Riya Shetty',
    version: 2,
    scriptText:
      'Hook: "The 4 pm snack my son finishes before I finish packing the bag."\n\nShot 1: Morning, kitchen. Lunchbox open, a handful of trail mix going into a small box next to the roti.\nShot 2: School bag zip, quick cut.\nShot 3: Evening, empty box on the table. Mom laughs.\nShot 4: Pack, 325g, ₹395 (MRP ₹465).\n\nVoiceover: "Nuts, seeds and a little dried fruit. No sugar coating, nothing sticky in the bag. Kholo, Khalo, Happilo."',
    comments: [
      { author: 'Mehul Jain', text: 'Version 2 reads better. Is the creator comfortable showing the child on camera?', time: '12 Nov, 2:10 pm' },
      { author: 'Riya Shetty', text: 'Yes, Meghna confirmed. Consent form is in the shared folder.', time: '12 Nov, 3:00 pm' },
    ],
    history: [
      { status: 'draft', by: 'Riya Shetty', time: '9 Nov, 12:00 pm', note: '' },
      { status: 'review', by: 'Riya Shetty', time: '12 Nov, 11:45 am', note: 'Updated hook, v2' },
    ],
  },
  {
    id: 'c-6',
    title: 'Popular Nuts Combo, Protein Power carousel ad',
    type: 'Ad copy',
    platform: 'Meta Ads',
    product: 'Popular Nuts Combo (Almonds 400g & Cashews 400g)',
    status: 'review',
    author: 'Sneha Gowda',
    version: 1,
    scriptText:
      'Slide 1: 800g of almonds and cashews. One box.\nSlide 2: ₹1,279 (MRP ₹1,505). That works out to about ₹160 per 100g.\nSlide 3: Jumbo Californian Almonds 400g + Premium Whole Cashews 400g.\nSlide 4: Order on happilo.com.\n\nPrimary text: A month of morning almonds and evening cashews for the whole family, in one pack. Save ₹226 on MRP.\n\nHeadline: 800g Popular Nuts Combo\nCTA: Shop now',
    comments: [],
    history: [
      { status: 'draft', by: 'Sneha Gowda', time: '11 Nov, 4:00 pm', note: '' },
      { status: 'review', by: 'Sneha Gowda', time: '13 Nov, 9:30 am', note: 'Numbers checked against catalogue' },
    ],
  },
  {
    id: 'c-7',
    title: 'Year-end corporate gifting post',
    type: 'Brand post',
    platform: 'LinkedIn',
    product: 'Gift boxes (₹1,000-2,500)',
    status: 'review',
    author: 'Mehul Jain',
    version: 1,
    scriptText:
      'Year-end gifting for teams does not have to be a hamper nobody opens.\n\nHappilo gift boxes start at ₹499 and go up to ₹2,500. Nuts, dry fruits, dates, trail mixes. Individual packing, bulk pricing for 50+ boxes, and GST invoices for every order.\n\nIf you are planning gifts for clients or your team, write to us at the link below and we will send a quote within a day.\n\nMade with Love, In India.',
    comments: [{ author: 'Sneha Gowda', text: 'Check if we can promise a quote within a day over the Dec weekends.', time: '13 Nov, 10:40 am' }],
    history: [{ status: 'review', by: 'Mehul Jain', time: '13 Nov, 10:00 am', note: '' }],
  },
  {
    id: 'c-8',
    title: 'Date and walnut energy bites pin',
    type: 'Pin',
    platform: 'Pinterest',
    product: 'Premium Fard Dates',
    status: 'review',
    author: 'Arjun Bhat',
    version: 1,
    scriptText:
      'Pin title: 5-minute date and walnut energy bites\nDescription: Blend 10 Fard dates with a handful of walnut kernels and a spoon of chia. Roll, chill, done. Makes about 14 bites.\n\nIngredients linked: Premium Fard Dates 500g (₹336), Californian Walnut Kernels 200g (₹421), Raw Black Chia Seeds 250g (₹234).\nImage: vertical 2:3, bites on a wooden board.',
    comments: [],
    history: [{ status: 'review', by: 'Arjun Bhat', time: '12 Nov, 5:15 pm', note: '' }],
  },
  {
    id: 'c-9',
    title: 'Pick Your Mood, four-flavour reel',
    type: 'Creator brief',
    platform: 'Instagram Reels',
    product: 'Premium Nutritious Nutty Trail Mix',
    status: 'revision',
    author: 'Kabir Nair',
    reviewedBy: 'Mehul Jain',
    rejectionReason: 'Hook is too generic. Start with the Monday-meeting mood, not the product. Also cut shot 4, it repeats shot 2.',
    version: 1,
    scriptText:
      'Hook: "Pick your mood: salty, sweet, spicy or unsalted."\n\nShot 1: Four bowls on a table, labelled.\nShot 2: Creator picks the salty one, takes a bite.\nShot 3: Same for spicy, makes a face.\nShot 4: Back to the salty one.\nEnd card: Pick Your Mood collection on happilo.com.',
    comments: [{ author: 'Mehul Jain', text: 'Needs a real moment. Think about what mood actually makes you open a snack pack.', time: '11 Nov, 6:30 pm' }],
    history: [
      { status: 'draft', by: 'Kabir Nair', time: '8 Nov, 1:00 pm', note: '' },
      { status: 'review', by: 'Kabir Nair', time: '11 Nov, 3:00 pm', note: '' },
      { status: 'revision', by: 'Mehul Jain', time: '11 Nov, 6:30 pm', note: 'Hook too generic' },
    ],
  },
  {
    id: 'c-10',
    title: 'Makhana taste test, three flavours',
    type: 'Explainer',
    platform: 'YouTube Shorts',
    product: 'Cream & Onion Makhana',
    status: 'revision',
    author: 'Kabir Nair',
    reviewedBy: 'Sneha Gowda',
    rejectionReason: 'Runs 58 seconds. Trim to 40. Show the ₹102 price on screen at the start, not the end.',
    version: 2,
    scriptText:
      'Hook: "I ate only makhana for an afternoon. Ranking all three."\n\nThird place: Himalayan Salt & Pepper, plain but safe.\nSecond place: Peri Peri, proper heat, finishes quick.\nFirst place: Cream & Onion, the one that disappeared first.\n\nEach pack is 55g, ₹102. Link in description.',
    comments: [],
    history: [
      { status: 'review', by: 'Kabir Nair', time: '10 Nov, 4:30 pm', note: 'v2' },
      { status: 'revision', by: 'Sneha Gowda', time: '12 Nov, 11:00 am', note: 'Too long' },
    ],
  },
  {
    id: 'c-11',
    title: 'Christmas gift boxes, ₹500-999 launch ad',
    type: 'Ad copy',
    platform: 'Meta Ads',
    product: 'Gift boxes (₹500-999)',
    status: 'approved',
    author: 'Sneha Gowda',
    reviewedBy: 'Mehul Jain',
    scheduleDate: '2026-11-20',
    scheduleTime: '10:00',
    version: 3,
    scriptText:
      'Primary text: Christmas is five weeks away and the gifting list is already long. Happilo boxes of nuts, dry fruits and dates start at ₹499. Add a gift bag at checkout.\n\nHeadline: Gift boxes for every budget\nDescription: Under ₹499, ₹500-999, ₹1,000-1,499, ₹1,500-2,500\nCTA: Shop now\nUTM: xmas26_giftboxes_meta',
    comments: [],
    history: [
      { status: 'review', by: 'Sneha Gowda', time: '9 Nov, 12:00 pm', note: 'v3' },
      { status: 'approved', by: 'Mehul Jain', time: '10 Nov, 3:20 pm', note: '' },
    ],
  },
  {
    id: 'c-12',
    title: 'Dates for winter broadcast',
    type: 'Broadcast',
    platform: 'WhatsApp Broadcast',
    product: 'Premium Fard Dates',
    status: 'approved',
    author: 'Arjun Bhat',
    reviewedBy: 'Mehul Jain',
    scheduleDate: '2026-11-16',
    scheduleTime: '11:30',
    version: 1,
    scriptText:
      'Hi {first_name}, winter is the best time for dates.\n\nPremium Fard Dates, 500g, ₹336\nSuper Soft Kimia Dates, 500g, ₹395\nInternational Ajwa Dates, 500g, ₹795\n\nHave 2 with warm milk or a handful of walnuts. Order: happilo.com/collections/dates\n\nKholo, Khalo, Happilo!',
    comments: [],
    history: [
      { status: 'review', by: 'Arjun Bhat', time: '11 Nov, 2:00 pm', note: '' },
      { status: 'approved', by: 'Mehul Jain', time: '12 Nov, 10:10 am', note: '' },
    ],
  },
  {
    id: 'c-13',
    title: 'Gym bag seeds, Protein Power reel',
    type: 'Creator brief',
    platform: 'Instagram Reels',
    product: 'Raw Pumpkin Seeds',
    status: 'approved',
    author: 'Riya Shetty',
    reviewedBy: 'Sneha Gowda',
    version: 2,
    scriptText:
      'Hook: "What is actually in my gym bag. Three things, none of them powder."\n\nShot 1: Gym bag unzipped, Raw Pumpkin Seeds (200g, ₹234) pulled out.\nShot 2: Roasted Flax Seeds (250g, ₹106) and Daily Super Health Mix (160g, ₹238).\nShot 3: Post-workout, handful of seeds, honest reaction.\n\nVoiceover: "Seeds and nuts, chewed, not blended. Simple. Protein Power on happilo.com."',
    comments: [],
    history: [
      { status: 'review', by: 'Riya Shetty', time: '10 Nov, 11:00 am', note: '' },
      { status: 'approved', by: 'Sneha Gowda', time: '11 Nov, 9:45 am', note: '' },
    ],
  },
  {
    id: 'c-14',
    title: 'Diwali gift box unboxing',
    type: 'Creator brief',
    platform: 'Instagram Reels',
    product: 'Gift boxes (₹1,000-1,499)',
    status: 'live',
    author: 'Kabir Nair',
    reviewedBy: 'Mehul Jain',
    scheduleDate: '2026-11-04',
    scheduleTime: '11:00',
    version: 2,
    scriptText:
      'Hook: "My mother-in-law said no sweets this year. So I got this."\n\nShot 1: Box on a table beside diyas, lid lifts.\nShot 2: Almonds, cashews, pistachios and Medjoul dates laid out.\nShot 3: Gift bag, tied with a ribbon. "Add a gift bag at checkout."\n\nCaption: No mithai, no problem. Gift boxes from ₹499 on happilo.com. Premium nutrition, Deliciously yours.',
    comments: [],
    history: [
      { status: 'approved', by: 'Mehul Jain', time: '2 Nov, 6:00 pm', note: '' },
      { status: 'live', by: 'Auto-post', time: '4 Nov, 11:00 am', note: 'Published' },
    ],
  },
  {
    id: 'c-15',
    title: 'The ₹1 deal collection',
    type: 'Ad copy',
    platform: 'Meta Ads',
    product: '₹1 deal collection',
    status: 'live',
    author: 'Sneha Gowda',
    reviewedBy: 'Mehul Jain',
    scheduleDate: '2026-11-06',
    scheduleTime: '09:00',
    version: 1,
    scriptText:
      'Primary text: Open the ₹1 deal collection on happilo.com and see what you can add to your cart.\n\nHeadline: The ₹1 deal collection\nDescription: Only on happilo.com\nCTA: Shop now',
    comments: [],
    history: [
      { status: 'approved', by: 'Mehul Jain', time: '5 Nov, 2:00 pm', note: '' },
      { status: 'live', by: 'Auto-post', time: '6 Nov, 9:00 am', note: 'Published' },
    ],
  },
  {
    id: 'c-16',
    title: 'Whole cashews vs pieces, buying guide',
    type: 'Explainer',
    platform: 'YouTube Shorts',
    product: 'Premium Whole Cashew Nuts',
    status: 'live',
    author: 'Kabir Nair',
    reviewedBy: 'Sneha Gowda',
    scheduleDate: '2026-11-07',
    scheduleTime: '18:00',
    version: 1,
    scriptText:
      'Hook: "Cashews at two prices. One of them is broken pieces."\n\nShow a pack of whole cashews against a bag of splits on a plate. Premium Whole Cashew Nuts 200g is ₹336, Jumbo is ₹361. Whole ones roast better, look better in a gift box, and do not turn to powder in your sabzi.\n\nEnd: "Check the grade on the pack, not just the price."',
    comments: [],
    history: [
      { status: 'approved', by: 'Sneha Gowda', time: '6 Nov, 5:00 pm', note: '' },
      { status: 'live', by: 'Auto-post', time: '7 Nov, 6:00 pm', note: 'Published' },
    ],
  },
];
