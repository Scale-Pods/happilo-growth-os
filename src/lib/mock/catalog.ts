/**
 * Happilo product catalogue — curated from the live happilo.com storefront
 * (real product names, SKUs, pack sizes, MRP and selling prices).
 */
export type CatalogCategory = 'Nuts' | 'Dry Fruits' | 'Dates' | 'Trail Mixes' | 'Seeds' | 'Makhana' | 'Combos';

export interface CatalogItem {
  sku: string;
  name: string;
  handle: string;
  category: CatalogCategory;
  pack: string;
  mrp: number;
  price: number;
  image: string | null;
  ean: string | null;
}

export const CATALOG: CatalogItem[] = [
  {
    "sku": "Happilo_Californian_Almonds_200g_1PK",
    "name": "Premium Californian Almonds",
    "handle": "natural-premium-california-almonds",
    "category": "Nuts",
    "pack": "200g",
    "mrp": 299,
    "price": 299,
    "image": "/products/natural-premium-california-almonds.jpg",
    "ean": null
  },
  {
    "sku": "Happilo_Californian_Almonds_400g_1PK",
    "name": "Jumbo Californian Almonds",
    "handle": "happilo-100-natural-popular-californian-almonds",
    "category": "Nuts",
    "pack": "400g",
    "mrp": 560,
    "price": 476,
    "image": "/products/happilo-100-natural-popular-californian-almonds.jpg",
    "ean": null
  },
  {
    "sku": "Happilo_Roasted-Salted_Almonds_200g_1PK",
    "name": "Roasted & Lightly Salted Californian Almonds",
    "handle": "happilo-premium-californian-almonds-roasted-salted",
    "category": "Nuts",
    "pack": "200g",
    "mrp": 370,
    "price": 314,
    "image": "/products/happilo-premium-californian-almonds-roasted-salted.jpg",
    "ean": null
  },
  {
    "sku": "Happilo_Authentic_Mamra_Almonds_250g_1PK",
    "name": "Raw Mamra Almonds",
    "handle": "happilo-premium-international-authentic-mamra-almond",
    "category": "Nuts",
    "pack": "250g",
    "mrp": 1215,
    "price": 1033,
    "image": "/products/happilo-premium-international-authentic-mamra-almond.jpg",
    "ean": null
  },
  {
    "sku": "Happilo_Whole_Cashews_200g_1PK",
    "name": "Premium Whole Cashew Nuts",
    "handle": "premium-whole-cashew-nuts-online",
    "category": "Nuts",
    "pack": "200g",
    "mrp": 395,
    "price": 336,
    "image": "/products/premium-whole-cashew-nuts-online.jpg",
    "ean": null
  },
  {
    "sku": "Happilo_Jmbo_Whole_Cashews_200g_1PK",
    "name": "Jumbo Premium Whole Cashew Nuts",
    "handle": "happilo-100-premium-king-size-whole-cashew-nuts",
    "category": "Nuts",
    "pack": "200g",
    "mrp": 425,
    "price": 361,
    "image": "/products/happilo-100-premium-king-size-whole-cashew-nuts.jpg",
    "ean": null
  },
  {
    "sku": "Happilo_Roast_Salt_Cashews_200g_1PK",
    "name": "Roasted & Salted Cashew Nuts",
    "handle": "happilo-rosted-salted-pre-cashew-nuts",
    "category": "Nuts",
    "pack": "200g",
    "mrp": 435,
    "price": 370,
    "image": "/products/happilo-rosted-salted-pre-cashew-nuts.jpg",
    "ean": null
  },
  {
    "sku": "Happilo_Kashmiri_Walnut_Kernels_200g_1PK",
    "name": "Kashmiri Walnut Kernels",
    "handle": "natural-kashmiri-walnut-kernels",
    "category": "Nuts",
    "pack": "200g",
    "mrp": 455,
    "price": 387,
    "image": "/products/natural-kashmiri-walnut-kernels.jpg",
    "ean": null
  },
  {
    "sku": "Happilo_Californian_Walnut_200g_1PK",
    "name": "Californian Walnut Kernels",
    "handle": "natural-californian-walnut-kernels",
    "category": "Nuts",
    "pack": "200g",
    "mrp": 495,
    "price": 421,
    "image": "/products/natural-californian-walnut-kernels.png",
    "ean": null
  },
  {
    "sku": "Happilo_Californian_walnuts_200g_1PK",
    "name": "California Inshell Walnuts with Free Nut Cracker",
    "handle": "happilo-100-natural-premium-california-inshell-walnut",
    "category": "Nuts",
    "pack": "200g",
    "mrp": 235,
    "price": 200,
    "image": "/products/happilo-100-natural-premium-california-inshell-walnut.jpg",
    "ean": null
  },
  {
    "sku": "Happilo_Californian_Pistachios_200g_1PK",
    "name": "Jumbo Roasted & Salted Californian Pistachios",
    "handle": "california-roasted-salted-pistachios",
    "category": "Nuts",
    "pack": "200g",
    "mrp": 415,
    "price": 353,
    "image": "/products/california-roasted-salted-pistachios.jpg",
    "ean": null
  },
  {
    "sku": "Happilo_Oven_Salted_Pistachios_200g_1PK",
    "name": "Oven Roasted & Salted Pistachios",
    "handle": "roasted-salted-pistachios",
    "category": "Nuts",
    "pack": "200g",
    "mrp": 415,
    "price": 353,
    "image": "/products/roasted-salted-pistachios.png",
    "ean": null
  },
  {
    "sku": "Happilo_Unsalted_Pistachio_150g_1PK",
    "name": "Unsalted Pistachio Kernels",
    "handle": "premium-unsalted-pistachio-kernels-happilo",
    "category": "Nuts",
    "pack": "150g",
    "mrp": 515,
    "price": 438,
    "image": "/products/premium-unsalted-pistachio-kernels-happilo.png",
    "ean": null
  },
  {
    "sku": "Happilo_Exotic_Dried_Brazil_Nut_150g_1PK",
    "name": "Exotic Brazil Nuts",
    "handle": "happilo-premium-international-exotic-brazil-nuts",
    "category": "Nuts",
    "pack": "150g",
    "mrp": 650,
    "price": 552,
    "image": "/products/happilo-premium-international-exotic-brazil-nuts.png",
    "ean": null
  },
  {
    "sku": "8906081120380",
    "name": "Exotic Pecan Nut Kernels",
    "handle": "happilo-premium-international-exotic-pecannut-kernels",
    "category": "Nuts",
    "pack": "150g",
    "mrp": 540,
    "price": 459,
    "image": "/products/happilo-premium-international-exotic-pecannut-kernels.png",
    "ean": "8906081120380"
  },
  {
    "sku": "Happilo_Dried_Afghani_Anjeer_200g_1PK",
    "name": "Dried Afghani Anjeer",
    "handle": "happilo-premium-dried-afghani-anjeer",
    "category": "Dry Fruits",
    "pack": "200g",
    "mrp": 465,
    "price": 395,
    "image": "/products/happilo-premium-dried-afghani-anjeer.jpg",
    "ean": null
  },
  {
    "sku": "Happilo_Jmbo_Turkish_Apricots_200g_1PK",
    "name": "Dried Turkish Apricots",
    "handle": "premium-turkish-apricots",
    "category": "Dry Fruits",
    "pack": "200g",
    "mrp": 340,
    "price": 289,
    "image": "/products/premium-turkish-apricots.jpg",
    "ean": null
  },
  {
    "sku": "Happilo_Seedless_Black_Raisins_250g_1PK",
    "name": "Seedless Afghani Black Raisins",
    "handle": "happilo-premium-seedless-afghani-black-raisins",
    "category": "Dry Fruits",
    "pack": "250g",
    "mrp": 315,
    "price": 268,
    "image": "/products/happilo-premium-seedless-afghani-black-raisins.jpg",
    "ean": null
  },
  {
    "sku": "Happilo_Afghani_Seedless_Raisin_200g_1PK",
    "name": "Seedless Afghani Green Raisins",
    "handle": "happilo-premium-seedless-afghani-green-raisins",
    "category": "Dry Fruits",
    "pack": "200g",
    "mrp": 295,
    "price": 251,
    "image": "/products/happilo-premium-seedless-afghani-green-raisins.png",
    "ean": null
  },
  {
    "sku": "Happilo_Seedless_Green_Raisins_500g_1PK",
    "name": "Seedless Green Raisins",
    "handle": "happilo-premium-seedless-green-raisins",
    "category": "Dry Fruits",
    "pack": "500g",
    "mrp": 450,
    "price": 382,
    "image": "/products/happilo-premium-seedless-green-raisins.jpg",
    "ean": null
  },
  {
    "sku": "Happilo_Californian_Prunes_200g_1PK",
    "name": "Dried Californian Pitted Prunes",
    "handle": "happilo-premium-dried-californian-pitted-prunes",
    "category": "Dry Fruits",
    "pack": "200g",
    "mrp": 350,
    "price": 298,
    "image": "/products/happilo-premium-dried-californian-pitted-prunes.jpg",
    "ean": null
  },
  {
    "sku": "Happilo_Californian_Blueberrie_150g _1PK",
    "name": "Dried Californian Blueberries",
    "handle": "happilo-premium-dried-californian-blueberries",
    "category": "Dry Fruits",
    "pack": "150g",
    "mrp": 455,
    "price": 387,
    "image": "/products/happilo-premium-dried-californian-blueberries.png",
    "ean": null
  },
  {
    "sku": "Happilo_Californian_Cranberries_200g_1PK",
    "name": "Dried Californian Whole Cranberries",
    "handle": "californian-whole-cranberries-dried-fruit-sweet",
    "category": "Dry Fruits",
    "pack": "200g",
    "mrp": 275,
    "price": 234,
    "image": "/products/californian-whole-cranberries-dried-fruit-sweet.jpg",
    "ean": null
  },
  {
    "sku": "Happilo_Ajwa_Dates_500g_1PK",
    "name": "International Ajwa Dates",
    "handle": "happilo-premium-international-ajwa-dates",
    "category": "Dates",
    "pack": "500g",
    "mrp": 935,
    "price": 795,
    "image": "/products/happilo-premium-international-ajwa-dates.jpg",
    "ean": null
  },
  {
    "sku": "Happilo_King_Medjoul_Dates_200g_1PK",
    "name": "International King Medjoul Dates",
    "handle": "happilo-premium-international-king-medjoul-dates",
    "category": "Dates",
    "pack": "200g",
    "mrp": 465,
    "price": 395,
    "image": "/products/happilo-premium-international-king-medjoul-dates.jpg",
    "ean": null
  },
  {
    "sku": "Happilo_Queen_Kalmi_Dates_200gm_1PK",
    "name": "International Queen Kalmi Dates",
    "handle": "premium-international-queen-kalmi-dates",
    "category": "Dates",
    "pack": "200g",
    "mrp": 315,
    "price": 268,
    "image": "/products/premium-international-queen-kalmi-dates.jpg",
    "ean": null
  },
  {
    "sku": "Happilo_Omani_Dates_250g_1PK",
    "name": "International Omani Dates",
    "handle": "happilo-premium-international-omani-dates",
    "category": "Dates",
    "pack": "250g",
    "mrp": 205,
    "price": 174,
    "image": "/products/happilo-premium-international-omani-dates.jpg",
    "ean": null
  },
  {
    "sku": "Happilo_Fard_Dates_500g_1PK",
    "name": "Premium Fard Dates",
    "handle": "happilo-premium-fard-dates-500g",
    "category": "Dates",
    "pack": "500g",
    "mrp": 395,
    "price": 336,
    "image": "/products/happilo-premium-fard-dates-500g.jpg",
    "ean": null
  },
  {
    "sku": "Happilo_Arabian_Dates_500g_1PK",
    "name": "Premium Arabian Dates",
    "handle": "happilo-premium-arabian-dates",
    "category": "Dates",
    "pack": "500g",
    "mrp": 210,
    "price": 178,
    "image": "/products/happilo-premium-arabian-dates.jpg",
    "ean": null
  },
  {
    "sku": "Happilo_Soft_Kimia_Dates_500g_1PK",
    "name": "Super Soft Kimia Dates",
    "handle": "happilo-premium-super-soft-kimia-dates",
    "category": "Dates",
    "pack": "500g",
    "mrp": 465,
    "price": 395,
    "image": "/products/happilo-premium-super-soft-kimia-dates.jpg",
    "ean": null
  },
  {
    "sku": "Happilo_Trail_Mix_200g_1PK",
    "name": "Premium Nutritious Nutty Trail Mix",
    "handle": "happilo-premium-international-nutty-trail-mix",
    "category": "Trail Mixes",
    "pack": "200g",
    "mrp": 340,
    "price": 289,
    "image": "/products/happilo-premium-international-nutty-trail-mix.jpg",
    "ean": null
  },
  {
    "sku": "Happilo_Supermom_Trail_Mix_325g_1PK",
    "name": "Super Mom's Trail Mix",
    "handle": "super-mom-trial-mix",
    "category": "Trail Mixes",
    "pack": "325g",
    "mrp": 465,
    "price": 395,
    "image": "/products/super-mom-trial-mix.png",
    "ean": null
  },
  {
    "sku": "Happilo_Sports_Mix_350g_1PK",
    "name": "Premium International Sports Mix",
    "handle": "happilo-premium-international-champion-mix",
    "category": "Trail Mixes",
    "pack": "350g",
    "mrp": 515,
    "price": 438,
    "image": "/products/happilo-premium-international-champion-mix.jpg",
    "ean": null
  },
  {
    "sku": "Happilo_Daily_Super_Health_Mix_160g_1PK",
    "name": "Daily Super Health Mix",
    "handle": "happilo-premium-international-daily-super-health-mix",
    "category": "Trail Mixes",
    "pack": "160g",
    "mrp": 280,
    "price": 238,
    "image": "/products/happilo-premium-international-daily-super-health-mix.png",
    "ean": null
  },
  {
    "sku": "Happilo_SuperSeeds_Nuts_Mix_250g_1PK",
    "name": "6 in 1 Super Seeds & Nuts Mix",
    "handle": "super-seeds-and-nuts-mix",
    "category": "Trail Mixes",
    "pack": "250g",
    "mrp": 280,
    "price": 238,
    "image": "/products/super-seeds-and-nuts-mix.jpg",
    "ean": null
  },
  {
    "sku": "Happilo_Blueberry_Cranberry_Mix_200g_1PK",
    "name": "Dried Blueberry Cranberry Duet",
    "handle": "happilo-premium-american-dried-whole-blueberry-cranberry-duet",
    "category": "Trail Mixes",
    "pack": "200g",
    "mrp": 355,
    "price": 302,
    "image": "/products/happilo-premium-american-dried-whole-blueberry-cranberry-due.jpg",
    "ean": null
  },
  {
    "sku": "Happilo_Nuts-Berries_200g_1PK",
    "name": "Nuts and Berries Mix",
    "handle": "happilo-premium-international-nuts-berries",
    "category": "Trail Mixes",
    "pack": "200g",
    "mrp": 340,
    "price": 289,
    "image": "/products/happilo-premium-international-nuts-berries.jpg",
    "ean": null
  },
  {
    "sku": "Happilo_Roasted_Party_Mix_200g_1PK",
    "name": "Oven Roasted & Lightly Salted Party Mix",
    "handle": "happilo-premium-international-roasted-party-mix",
    "category": "Trail Mixes",
    "pack": "200g",
    "mrp": 370,
    "price": 314,
    "image": "/products/happilo-premium-international-roasted-party-mix.jpg",
    "ean": null
  },
  {
    "sku": "Happilo_Panchmewa_DryFruit_Mix_450g_1PK",
    "name": "Classic Panchmewa Dry Fruit Mix",
    "handle": "classic-panchmewa-mix-450g",
    "category": "Trail Mixes",
    "pack": "450g",
    "mrp": 560,
    "price": 476,
    "image": "/products/classic-panchmewa-mix-450g.png",
    "ean": null
  },
  {
    "sku": "Happilo_Raw_Pumpkin_Seeds_200g_1PK",
    "name": "Raw Pumpkin Seeds",
    "handle": "happilo-premium-pumpkin-seeds-raw-authentic-all-natural",
    "category": "Seeds",
    "pack": "200g",
    "mrp": 275,
    "price": 234,
    "image": "/products/happilo-premium-pumpkin-seeds-raw-authentic-all-natural.png",
    "ean": null
  },
  {
    "sku": "Happilo_Raw_Chia_Seeds_250g_1PK",
    "name": "Raw Black Chia Seeds",
    "handle": "happilo-premium-raw-organic-authentic-chia-seeds-250g",
    "category": "Seeds",
    "pack": "250g",
    "mrp": 275,
    "price": 234,
    "image": "/products/happilo-premium-raw-organic-authentic-chia-seeds-250g.jpg",
    "ean": null
  },
  {
    "sku": "Happilo_Sunflower_Seeds_250g_1PK",
    "name": "Raw Sunflower Seeds",
    "handle": "happilo-premium-raw-sunflower-seeds-no-shells",
    "category": "Seeds",
    "pack": "250g",
    "mrp": 155,
    "price": 132,
    "image": "/products/happilo-premium-raw-sunflower-seeds-no-shells.jpg",
    "ean": null
  },
  {
    "sku": "Happilo_Flax_Seeds_Roasted_250g_1PK",
    "name": "Roasted Flax Seeds",
    "handle": "happilo-premium-authentic-flax-seeds-roasted-250g",
    "category": "Seeds",
    "pack": "250g",
    "mrp": 125,
    "price": 106,
    "image": "/products/happilo-premium-authentic-flax-seeds-roasted-250g.jpg",
    "ean": null
  },
  {
    "sku": "Happilo_Premium_Makhana_100g_1PK",
    "name": "Premium Fox Nuts (Phool Makhana)",
    "handle": "happilo-premium-all-natural-fox-nuts-phool-makhana-100g",
    "category": "Makhana",
    "pack": "100g",
    "mrp": 285,
    "price": 242,
    "image": "/products/happilo-premium-all-natural-fox-nuts-phool-makhana-100g.jpg",
    "ean": null
  },
  {
    "sku": "Happilo_Makhana_Peri_Peri_55g_1PK",
    "name": "Peri Peri Makhana",
    "handle": "peri-peri-makhana-60g",
    "category": "Makhana",
    "pack": "55g",
    "mrp": 120,
    "price": 102,
    "image": "/products/peri-peri-makhana-60g.png",
    "ean": null
  },
  {
    "sku": "Happilo_Makhana_Cream-Onion_55g_1PK",
    "name": "Cream & Onion Makhana",
    "handle": "cream-onion-makhana-60g",
    "category": "Makhana",
    "pack": "55g",
    "mrp": 120,
    "price": 102,
    "image": "/products/cream-onion-makhana-60g.png",
    "ean": null
  },
  {
    "sku": "Happilo_Makhana_Salt-Pepper_55g_1PK",
    "name": "Himalayan Salt & Pepper Makhana",
    "handle": "himalayan-salt-pepper-makhana-60g",
    "category": "Makhana",
    "pack": "55g",
    "mrp": 120,
    "price": 102,
    "image": "/products/himalayan-salt-pepper-makhana-60g.png",
    "ean": null
  },
  {
    "sku": "8906081125880",
    "name": "Monthly Dry Fruits Combo",
    "handle": "monthly-dry-fruits-combo",
    "category": "Combos",
    "pack": "",
    "mrp": 1735,
    "price": 1475,
    "image": "/products/monthly-dry-fruits-combo.png",
    "ean": "8906081125880"
  },
  {
    "sku": "Happilo_Cali-Almnd_whol-Cashws_400gEach",
    "name": "Popular Nuts Combo (Almonds 400g & Cashews 400g)",
    "handle": "happilo-popular-nuts-combo-800g-california-almond-400g-who",
    "category": "Combos",
    "pack": "800g",
    "mrp": 1505,
    "price": 1279,
    "image": "/products/happilo-popular-nuts-combo-800g-california-almond-400g-who.jpg",
    "ean": null
  },
  {
    "sku": "Happilo_DryFruits_Combo_PO4_850g_1PK",
    "name": "Dry Fruits Combo 850g",
    "handle": "happilo-premium-dry-fruits-combo-4california-almonds-rais",
    "category": "Combos",
    "pack": "850g",
    "mrp": 1310,
    "price": 1114,
    "image": "/products/happilo-premium-dry-fruits-combo-4california-almonds-rais.png",
    "ean": null
  }
];

export const CATALOG_BY_SKU: Record<string, CatalogItem> = Object.fromEntries(CATALOG.map((c) => [c.sku, c]));
