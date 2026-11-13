/** Happilo B2B leads summary used by the executive board (sample data). */

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  location: string;
  website: string;
  stage: string;
  notes: string;
}

export const INITIAL_B2B_LEADS: Lead[] = [
  { id: 'lead-1', name: 'Gupta Dry Fruit Emporium', phone: '+91 98711 22334', email: 'manoj.gupta@guptadryfruits.in', location: 'Karol Bagh, Delhi', website: 'guptadryfruits.in', stage: 'Interested', notes: 'Wants the B2B rate card for cashews, pistachios and walnuts. Asked for 15 days credit.' },
  { id: 'lead-2', name: 'Anand Gifting Studio', phone: '+91 99010 88880', email: 'meenal@anandgifting.com', location: 'Indiranagar, Bengaluru', website: 'anandgifting.com', stage: 'Sample Sent', notes: 'Sample box delivered. One client wants 150 boxes with a branded sleeve.' },
  { id: 'lead-3', name: 'Hotel Grand Orchid', phone: '+91 98123 45690', email: 'purchase@grandorchid.in', location: 'Bandra West, Mumbai', website: 'grandorchid.in', stage: 'Interested', notes: '120-room hotel redoing in-room snack baskets for December. Sent FSSAI copy and quote.' },
  { id: 'lead-4', name: 'Venkatesh FMCG Distributors', phone: '+91 95555 44444', email: 'finance@venkateshfmcg.com', location: 'Secunderabad, Hyderabad', website: 'venkateshfmcg.com', stage: 'Negotiation', notes: 'Negotiating margin and credit days for a Telangana distributorship. First PO around Rs 6 lakh.' },
  { id: 'lead-5', name: 'Kothari Corporate Gifts', phone: '+91 98888 77777', email: 'rajesh@kotharigifts.com', location: 'Andheri East, Mumbai', website: 'kotharigifts.com', stage: 'Won', notes: 'Closed Rs 7.5 lakh Diwali corporate hamper order, about 640 boxes.' },
  { id: 'lead-6', name: 'Nexus Corporate Hampers', phone: '+91 98450 33221', email: 'sidharth@nexushampers.com', location: 'Koramangala, Bengaluru', website: 'nexushampers.com', stage: 'Negotiation', notes: '1,200 boxes for a software client before 20 Dec. Quoted Rs 859 per box.' },
  { id: 'lead-7', name: 'Meridian Software Pvt Ltd', phone: '+91 98220 41907', email: 'shilpa.narang@meridiansoft.in', location: 'Hinjewadi, Pune', website: 'meridiansoft.in', stage: 'Interested', notes: 'New Year gifts for 680 people across three cities. Waiting for VP approval.' },
  { id: 'lead-8', name: 'Bharat Hampers & Co.', phone: '+91 94440 27183', email: 'harish@bharathampers.in', location: 'T. Nagar, Chennai', website: 'bharathampers.in', stage: 'Demo Booked', notes: 'Shop visit on Tuesday. Wants price for 2,000 small boxes for weddings.' },
];
