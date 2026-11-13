/**
 * UGC video library for the Content OS.
 *
 * Videos live in /public/ugc. To swap a video, drop a new .mp4 into that folder
 * using the same file name (ugc-1.mp4 ... ugc-6.mp4) - no code change needed.
 * Slots without a file are hidden automatically. Edit the titles / creators /
 * products below to describe the footage you add.
 */
export interface UgcVideo {
  id: string;
  file: string;
  title: string;
  creator: string;
  handle: string;
  product: string;
  platform: string;
  status: 'Raw footage' | 'In edit' | 'Approved' | 'Live';
  uploaded: string; // ISO date
}

export const UGC_VIDEOS: UgcVideo[] = [
  { id: 'ugc-1', file: '/ugc/ugc-1.mp4', title: 'Unboxing and first taste', creator: 'Riya Shetty', handle: '@riyaeatsbangalore', product: 'Premium Whole Cashew Nuts', platform: 'Instagram Reels', status: 'Approved', uploaded: '2026-11-04' },
  { id: 'ugc-2', file: '/ugc/ugc-2.mp4', title: 'Desk snack drawer', creator: 'Kabir Nair', handle: '@kabirnair.daily', product: 'Premium Nutritious Nutty Trail Mix', platform: 'YouTube Shorts', status: 'In edit', uploaded: '2026-11-09' },
  { id: 'ugc-3', file: '/ugc/ugc-3.mp4', title: 'Gift box reveal', creator: 'Sneha Gowda', handle: '@snehagowda', product: 'Monthly Dry Fruits Combo', platform: 'Meta Ads', status: 'Raw footage', uploaded: '2026-11-11' },
  { id: 'ugc-4', file: '/ugc/ugc-4.mp4', title: 'Walnut crack, nut cracker in the box', creator: 'Arjun Bhat', handle: '@arjunbhat.cooks', product: 'California Inshell Walnuts with Free Nut Cracker', platform: 'Instagram Reels', status: 'Raw footage', uploaded: '2026-11-12' },
  { id: 'ugc-5', file: '/ugc/ugc-5.mp4', title: 'Makhana flavours, honest ranking', creator: 'Meghna Rao', handle: '@meghna.munches', product: 'Peri Peri Makhana', platform: 'YouTube Shorts', status: 'Raw footage', uploaded: '2026-11-12' },
  { id: 'ugc-6', file: '/ugc/ugc-6.mp4', title: 'Dates for winter evenings', creator: 'Farah Siddiqui', handle: '@farah.in.the.kitchen', product: 'International Ajwa Dates', platform: 'Instagram Reels', status: 'Raw footage', uploaded: '2026-11-13' },
];
