/** Happilo founder WhatsApp alerts (dummy data). */

export interface WhatsappAlert {
  id: string;
  type: string;
  message: string;
  time: string;
  active: boolean;
}

export const INITIAL_WHATSAPP_ALERTS: WhatsappAlert[] = [
  { id: 'wa-1', type: 'Low Stock', message: 'Exotic Brazil Nuts are down to about 3 days of cover and the import lead time is 60 days. A PO needs to go out today.', time: '10m ago', active: true },
  { id: 'wa-2', type: 'Payment Overdue', message: 'Venkatesh FMCG Distributors is 49 days late on invoice HP-INV-2605 (₹6,25,000). Reminders have not worked, a call is needed.', time: '1h ago', active: true },
  { id: 'wa-3', type: 'Overstock', message: 'Seedless Afghani Black Raisins have more than 90 days of cover at the Bengaluru warehouse. Hold further purchases.', time: '2h ago', active: true },
  { id: 'wa-4', type: 'Support', message: 'Meera Sen has asked for a refund on order #HP-48210, shown delivered but not received. Courier is not responding.', time: '3h ago', active: false },
];
