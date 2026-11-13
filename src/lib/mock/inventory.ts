/**
 * Happilo inventory master — one row per catalogue SKU with stock held in the
 * Bengaluru warehouse and in each sales-channel bucket (units / packs).
 * Prices and pack sizes come from the live catalogue; stock positions, sales
 * rates and sourcing details are working figures for the planning team.
 */
import { CATALOG } from './catalog';

export interface Product {
  id: string;
  name: string;
  sku: string;
  warehouse: number;
  amazon: number;
  blinkit: number;
  zepto: number;
  flipkart: number;
  instamart: number;
  bigbasket: number;
  shopify: number; // happilo.com own store
  avgMonthlySales: number; // units / month
  cost: number; // landed cost, INR per unit
  price: number; // selling price, INR
  leadTime: number; // days, order to dock
  // Extended fields (optional so older consumers keep working)
  category?: string;
  pack?: string;
  mrp?: number;
  image?: string | null;
  ean?: string | null;
  origin?: string;
  supplier?: string;
  shelfLifeDays?: number;
  reorderPoint?: number;
  safetyStock?: number;
  moq?: number;
}

export interface Supplier {
  key: string;
  name: string;
  city: string;
  country: string;
}

export const SUPPLIERS: Record<string, Supplier> = {
  CA_ALM: { key: 'CA_ALM', name: 'Sierra Valley Almond Packers', city: 'Modesto', country: 'USA' },
  CA_PIS: { key: 'CA_PIS', name: 'Central Valley Pistachio Co.', city: 'Fresno', country: 'USA' },
  CA_WAL: { key: 'CA_WAL', name: 'Golden State Walnut Growers', city: 'Stockton', country: 'USA' },
  CA_PRN: { key: 'CA_PRN', name: 'Sutter Orchards Dried Fruit', city: 'Yuba City', country: 'USA' },
  US_BRY: { key: 'US_BRY', name: 'Cape Cod Berry Ingredients', city: 'Wareham', country: 'USA' },
  TX_PEC: { key: 'TX_PEC', name: 'Lone Star Pecan Exporters', city: 'San Saba', country: 'USA' },
  BO_BRZ: { key: 'BO_BRZ', name: 'Amazonia Castanha Ltda', city: 'Riberalta', country: 'Bolivia' },
  AF_DRY: { key: 'AF_DRY', name: 'Kabul Dry Fruit Traders', city: 'Kabul', country: 'Afghanistan' },
  AF_RSN: { key: 'AF_RSN', name: 'Herat Raisin House', city: 'Herat', country: 'Afghanistan' },
  TR_APR: { key: 'TR_APR', name: 'Ege Kuru Meyve Ihracat A.S.', city: 'Malatya', country: 'Turkey' },
  KL_CSH: { key: 'KL_CSH', name: 'Kollam Cashew Processors Pvt Ltd', city: 'Kollam', country: 'India' },
  GA_CSH: { key: 'GA_CSH', name: 'Bicholim Cashew Industries', city: 'Bicholim', country: 'India' },
  KS_WAL: { key: 'KS_WAL', name: 'Pulwama Walnut Traders', city: 'Pulwama', country: 'India' },
  SA_AJW: { key: 'SA_AJW', name: 'Madinah Palm Dates Co.', city: 'Madinah', country: 'Saudi Arabia' },
  JO_MED: { key: 'JO_MED', name: 'Jordan Valley Medjoul Growers', city: 'Aqaba', country: 'Jordan' },
  IR_DAT: { key: 'IR_DAT', name: 'Bam Palm Exports', city: 'Bandar Abbas', country: 'Iran' },
  OM_DAT: { key: 'OM_DAT', name: 'Sohar Dates Trading LLC', city: 'Sohar', country: 'Oman' },
  AE_DAT: { key: 'AE_DAT', name: 'Al Barari Dates Trading LLC', city: 'Dubai', country: 'UAE' },
  TN_DAT: { key: 'TN_DAT', name: 'Tozeur Deglet Exporters', city: 'Tozeur', country: 'Tunisia' },
  BR_MAK: { key: 'BR_MAK', name: 'Darbhanga Makhana Processors', city: 'Darbhanga', country: 'India' },
  BR_MK2: { key: 'BR_MK2', name: 'Mithila Foxnut Producers Co.', city: 'Madhubani', country: 'India' },
  MP_SEED: { key: 'MP_SEED', name: 'Neemuch Seeds & Spices Pvt Ltd', city: 'Neemuch', country: 'India' },
  SG_RSN: { key: 'SG_RSN', name: 'Sangli Raisin Growers Co-op', city: 'Tasgaon', country: 'India' },
  OWN: { key: 'OWN', name: 'Happilo Packing Unit', city: 'Hoskote', country: 'India' },
};

// Per-SKU working parameters, in catalogue order.
// [avg monthly units, days of cover, lead time (d), origin, supplier, shelf life (months), landed cost / price]
type Row = [number, number, number, string, string, number, number];

const PARAMS: Row[] = [
  [6240, 82, 50, 'California, USA', 'CA_ALM', 12, 0.66], // Almonds 200g
  [4110, 70, 50, 'California, USA', 'CA_ALM', 12, 0.67], // Almonds 400g
  [2310, 66, 14, 'California, USA', 'CA_ALM', 9, 0.64], // Roasted almonds
  [386, 58, 55, 'Afghanistan', 'AF_DRY', 10, 0.7], // Mamra
  [8420, 34, 10, 'Kollam, Kerala', 'KL_CSH', 12, 0.64], // Cashew whole
  [3880, 9, 10, 'Bicholim, Goa', 'GA_CSH', 12, 0.65], // Jumbo cashew
  [2930, 38, 12, 'Kollam, Kerala', 'KL_CSH', 9, 0.63], // Roast salt cashew
  [1490, 44, 20, 'Kashmir, India', 'KS_WAL', 9, 0.66], // Kashmiri walnut kernels
  [1890, 72, 50, 'California, USA', 'CA_WAL', 9, 0.67], // Cal walnut kernels
  [3120, 140, 50, 'California, USA', 'CA_WAL', 12, 0.6], // Inshell walnuts
  [3310, 56, 50, 'California, USA', 'CA_PIS', 9, 0.68], // Jumbo pistachios
  [1730, 54, 50, 'California, USA', 'CA_PIS', 9, 0.67], // Oven pistachios
  [902, 54, 50, 'California, USA', 'CA_PIS', 9, 0.69], // Unsalted pistachio
  [212, 135, 60, 'Bolivia', 'BO_BRZ', 9, 0.7], // Brazil nuts
  [178, 96, 60, 'Texas, USA', 'TX_PEC', 9, 0.71], // Pecan
  [1310, 17, 40, 'Afghanistan', 'AF_DRY', 12, 0.68], // Anjeer
  [2140, 52, 38, 'Malatya, Turkey', 'TR_APR', 12, 0.64], // Apricots
  [2720, 48, 32, 'Afghanistan', 'AF_RSN', 12, 0.62], // Black raisins
  [1090, 55, 32, 'Afghanistan', 'AF_RSN', 12, 0.63], // Green raisin afghani
  [1480, 45, 14, 'Sangli, Maharashtra', 'SG_RSN', 12, 0.6], // Green raisins 500g
  [776, 76, 55, 'California, USA', 'CA_PRN', 12, 0.66], // Prunes
  [648, 150, 55, 'Massachusetts, USA', 'US_BRY', 12, 0.69], // Blueberries
  [1260, 58, 55, 'Massachusetts, USA', 'US_BRY', 12, 0.65], // Cranberries
  [524, 38, 35, 'Madinah, Saudi Arabia', 'SA_AJW', 12, 0.7], // Ajwa
  [1410, 46, 38, 'Jordan Valley', 'JO_MED', 8, 0.67], // Medjoul
  [902, 56, 30, 'Bam, Iran', 'IR_DAT', 10, 0.63], // Kalmi
  [2390, 44, 28, 'Sohar, Oman', 'OM_DAT', 10, 0.6], // Omani
  [1720, 40, 28, 'Sohar, Oman', 'OM_DAT', 10, 0.62], // Fard
  [1980, 46, 30, 'UAE', 'AE_DAT', 10, 0.61], // Arabian
  [1104, 42, 32, 'Bam, Iran', 'IR_DAT', 8, 0.66], // Kimia
  [7080, 28, 12, 'Own packed, Hoskote', 'OWN', 9, 0.6], // Trail mix
  [2810, 33, 12, 'Own packed, Hoskote', 'OWN', 9, 0.62], // Super Mom
  [1690, 36, 12, 'Own packed, Hoskote', 'OWN', 9, 0.63], // Sports mix
  [2190, 40, 12, 'Own packed, Hoskote', 'OWN', 9, 0.61], // Daily health mix
  [2640, 45, 11, 'Own packed, Hoskote', 'OWN', 9, 0.58], // 6 in 1 seeds
  [803, 120, 14, 'Own packed, Hoskote', 'OWN', 9, 0.66], // Blueberry cranberry duet
  [1910, 38, 12, 'Own packed, Hoskote', 'OWN', 9, 0.63], // Nuts and berries
  [1120, 52, 12, 'Own packed, Hoskote', 'OWN', 9, 0.62], // Party mix
  [1390, 44, 12, 'Own packed, Hoskote', 'OWN', 9, 0.61], // Panchmewa
  [1510, 50, 24, 'Neemuch, Madhya Pradesh', 'MP_SEED', 12, 0.62], // Pumpkin seeds
  [1880, 55, 32, 'Neemuch, Madhya Pradesh', 'MP_SEED', 12, 0.64], // Chia
  [2290, 55, 20, 'Neemuch, Madhya Pradesh', 'MP_SEED', 12, 0.58], // Sunflower
  [1790, 60, 12, 'Neemuch, Madhya Pradesh', 'MP_SEED', 12, 0.57], // Flax
  [3310, 36, 10, 'Darbhanga, Bihar', 'BR_MAK', 8, 0.65], // Makhana 100g
  [4620, 30, 14, 'Darbhanga, Bihar', 'BR_MAK', 6, 0.6], // Peri peri
  [3890, 19, 14, 'Madhubani, Bihar', 'BR_MK2', 6, 0.6], // Cream onion
  [2980, 12, 14, 'Madhubani, Bihar', 'BR_MK2', 6, 0.61], // Salt pepper
  [318, 45, 10, 'Own packed, Hoskote', 'OWN', 9, 0.7], // Monthly combo
  [764, 40, 14, 'Own packed, Hoskote', 'OWN', 9, 0.69], // Popular nuts combo
  [541, 43, 12, 'Own packed, Hoskote', 'OWN', 9, 0.68], // Dry fruits combo 850
];

function hash01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

const BASE_SHARE: Record<string, number> = {
  warehouse: 0.625,
  amazon: 0.105,
  shopify: 0.075,
  flipkart: 0.05,
  bigbasket: 0.035,
  blinkit: 0.04,
  zepto: 0.03,
  instamart: 0.035,
};

function tilt(category: string, ch: string): number {
  if (category === 'Makhana' || category === 'Trail Mixes' || category === 'Seeds') {
    if (ch === 'blinkit' || ch === 'zepto' || ch === 'instamart') return 1.55;
  }
  if (category === 'Dates' && ch === 'bigbasket') return 1.6;
  if (category === 'Combos') {
    if (ch === 'shopify') return 2.2;
    if (ch === 'amazon') return 1.4;
    if (ch === 'blinkit' || ch === 'zepto' || ch === 'instamart') return 0.25;
  }
  if (category === 'Nuts' && ch === 'amazon') return 1.15;
  return 1;
}

function build(): Product[] {
  return CATALOG.map((c, i) => {
    const [monthly, cover, lead, origin, supplier, shelf, costPct] = PARAMS[i];
    const jitter = 0.94 + hash01(c.sku + 'tot') * 0.14;
    const total = Math.round(((monthly * cover) / 30) * jitter);

    const keys = Object.keys(BASE_SHARE);
    const w: Record<string, number> = {};
    keys.forEach((k) => {
      const j = 0.74 + hash01(c.sku + k) * 0.52;
      w[k] = BASE_SHARE[k] * j * tilt(c.category, k);
    });
    // Nearly sold-through at the warehouse, stock sits in channels
    if (cover <= 12) w.warehouse *= 0.22;
    // Overstocked items sit mostly in the warehouse
    if (cover >= 120) w.warehouse *= 1.35;
    const sum = keys.reduce((a, k) => a + w[k], 0);
    const qty: Record<string, number> = {};
    keys.forEach((k) => (qty[k] = Math.round((total * w[k]) / sum)));

    const daily = monthly / 30;
    const safety = Math.round(daily * 7);
    return {
      id: `inv-${i + 1}`,
      name: c.name,
      sku: c.sku,
      warehouse: qty.warehouse,
      amazon: qty.amazon,
      blinkit: qty.blinkit,
      zepto: qty.zepto,
      flipkart: qty.flipkart,
      instamart: qty.instamart,
      bigbasket: qty.bigbasket,
      shopify: qty.shopify,
      avgMonthlySales: monthly,
      cost: Math.round(c.price * costPct * (0.985 + hash01(c.sku + 'c') * 0.03) * 100) / 100,
      price: c.price,
      leadTime: lead,
      category: c.category,
      pack: c.pack || 'Gift combo',
      mrp: c.mrp,
      image: c.image,
      ean: c.ean,
      origin,
      supplier: SUPPLIERS[supplier].name,
      shelfLifeDays: Math.round(shelf * 30.4),
      safetyStock: safety,
      reorderPoint: Math.round(daily * (lead + 7)),
      moq: lead >= 40 ? Math.max(500, Math.round((monthly * 1.5) / 100) * 100) : Math.max(200, Math.round(monthly / 200) * 100),
    };
  });
}

export const INITIAL_INVENTORY: Product[] = build();
