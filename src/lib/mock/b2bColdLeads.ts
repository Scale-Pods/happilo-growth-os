/**
 * Prospects that have been through the standard outreach cadence but have not
 * replied yet. Their touches are generated in b2bJourney.ts from this list.
 */
import type { Cat } from './b2bSeeds';

export interface ColdLead {
  co: string;
  who: string;
  cat: Cat;
  region: string;
  place: string;
  src: 'google_maps' | 'referral' | 'inbound' | 'trade_show' | 'csv_upload';
  /** days since the lead was added */
  age: number;
  /** WhatsApp number is not on WhatsApp */
  noWa?: boolean;
  note: string;
}

export const COLD_LEADS: ColdLead[] = [
  { co: 'Annapoorna Provision Mart', who: 'Krishnamurthy Iyer', cat: 'retail_store', region: 'Bengaluru', place: 'Malleshwaram', src: 'google_maps', age: 22, note: 'Old neighbourhood store with a good dry fruit counter. Owner is at the shop mornings only.' },
  { co: 'Metro Fresh Supermarket', who: 'Anil Shetty', cat: 'retail_store', region: 'Bengaluru', place: 'JP Nagar', src: 'google_maps', age: 19, note: 'Single supermarket, packaged snacks on two aisles.' },
  { co: 'Lakshmi Narasimha Stores', who: 'Narasimha Reddy', cat: 'retail_store', region: 'Bengaluru', place: 'Rajajinagar', src: 'google_maps', age: 15, note: 'Family kirana, mostly loose dry fruits.' },
  { co: 'The Daily Bowl Cafe', who: 'Meghana Kulkarni', cat: 'hotel_cafe', region: 'Bengaluru', place: 'Koramangala', src: 'google_maps', age: 13, note: 'Healthy bowls and smoothies, might use trail mix as toppings.' },
  { co: 'Sapphire Inn Business Hotel', who: 'Rajesh Hegde', cat: 'hotel_cafe', region: 'Bengaluru', place: 'Electronic City', src: 'google_maps', age: 20, note: '90-room business hotel, buffet breakfast.' },
  { co: 'PowerHouse Gym & Nutrition', who: 'Arjun Prabhu', cat: 'gym_wellness', region: 'Bengaluru', place: 'Marathahalli', src: 'google_maps', age: 17, note: 'Gym with a small nutrition counter, about 600 members.' },
  { co: 'Zenith Tech Solutions', who: 'Pallavi Joshi', cat: 'corporate_gifting', region: 'Bengaluru', place: 'Bellandur', src: 'inbound', age: 14, note: 'HR filled the website bulk form for year-end gifts, 220 employees.' },
  { co: 'Bhagyalakshmi Traders', who: 'Chandrashekar B', cat: 'distributor', region: 'Bengaluru', place: 'Yeshwanthpur', src: 'csv_upload', age: 24, note: 'Sub-distributor for kirana in north Bengaluru.' },
  { co: 'Sunshine Kids Academy', who: 'Mrs. Rekha Menon', cat: 'institutional', region: 'Bengaluru', place: 'Hennur', src: 'referral', age: 12, note: 'Tuck shop and annual-day goody bags for about 900 students.' },
  { co: 'Mumbai Masala & Dry Fruits', who: 'Hemant Shah', cat: 'retail_store', region: 'Mumbai', place: 'Ghatkopar', src: 'google_maps', age: 21, note: 'Busy shop near the station, loose dry fruits and masala.' },
  { co: 'Sai Darshan Super Shoppe', who: 'Prakash Naik', cat: 'retail_store', region: 'Mumbai', place: 'Borivali West', src: 'google_maps', age: 16, note: 'Supermarket with a growing health aisle.' },
  { co: 'Marine Drive Cafe & Bakery', who: 'Farah Contractor', cat: 'hotel_cafe', region: 'Mumbai', place: 'Churchgate', src: 'google_maps', age: 11, note: 'Old Irani-style cafe, sells packed biscuits and nuts at the counter.' },
  { co: 'Bluewave Logistics Pvt Ltd', who: 'Sanjana Pillai', cat: 'corporate_gifting', region: 'Mumbai', place: 'Goregaon East', src: 'inbound', age: 13, note: 'Admin team looking for year-end client hampers, about 150 boxes.' },
  { co: 'Gaurav Trading Co.', who: 'Gaurav Doshi', cat: 'distributor', region: 'Mumbai', place: 'Masjid Bunder', src: 'trade_show', age: 23, noWa: true, note: 'Met at a trade show, wholesaler of dry fruits to Mumbai retailers.' },
  { co: 'FlexZone Fitness Studio', who: 'Karan Malhotra', cat: 'gym_wellness', region: 'Mumbai', place: 'Andheri West', src: 'google_maps', age: 18, note: 'Boutique fitness studio with a snack bar.' },
  { co: 'Pune Dry Fruit Centre', who: 'Sachin Deshpande', cat: 'retail_store', region: 'Pune', place: 'Camp', src: 'google_maps', age: 20, note: 'Shop in Camp area, sells to families and gift shoppers.' },
  { co: 'Hadapsar Fresh Mart', who: 'Santosh Jagtap', cat: 'retail_store', region: 'Pune', place: 'Hadapsar', src: 'google_maps', age: 14, note: 'Small supermarket in a residential belt.' },
  { co: 'Maple Leaf Resort', who: 'Joseph Fernandes', cat: 'hotel_cafe', region: 'Pune', place: 'Mulshi', src: 'google_maps', age: 19, note: 'Weekend resort, welcome baskets for guests.' },
  { co: 'Infosphere Systems', who: 'Ankita Phadke', cat: 'corporate_gifting', region: 'Pune', place: 'Kharadi', src: 'inbound', age: 10, note: 'Wants new-year gifts for 300 employees.' },
  { co: 'Shivneri Distributors', who: 'Dattatray Pawar', cat: 'distributor', region: 'Pune', place: 'Pimpri', src: 'google_maps', age: 24, note: 'FMCG distributor serving Pimpri-Chinchwad kiranas.' },
  { co: 'Delhi Darbar Dry Fruits', who: 'Rakesh Arora', cat: 'retail_store', region: 'Delhi NCR', place: 'Chandni Chowk', src: 'google_maps', age: 21, note: 'Traditional shop, strong loose cashew and almond business.' },
  { co: 'Fresh Choice Supermart', who: 'Pankaj Sethi', cat: 'retail_store', region: 'Delhi NCR', place: 'Rohini', src: 'google_maps', age: 17, note: 'Two supermarkets in Rohini.' },
  { co: 'The Brew Lounge', who: 'Ishita Bansal', cat: 'hotel_cafe', region: 'Delhi NCR', place: 'Hauz Khas Village', src: 'google_maps', age: 12, note: 'Cafe with a snack menu, three outlets planned.' },
  { co: 'Quantum Fin Services', who: 'Mohit Gulati', cat: 'corporate_gifting', region: 'Delhi NCR', place: 'Nehru Place', src: 'inbound', age: 15, note: 'Client gifts for 120 customers at year-end.' },
  { co: 'Rajdhani Wholesale Hub', who: 'Sunil Gupta', cat: 'distributor', region: 'Delhi NCR', place: 'Azadpur', src: 'csv_upload', age: 22, note: 'Azadpur mandi wholesaler looking to add branded lines.' },
  { co: 'Ironclad Fitness Club', who: 'Vishal Chauhan', cat: 'gym_wellness', region: 'Delhi NCR', place: 'Gurugram Sector 29', src: 'google_maps', age: 16, note: 'Big gym chain outlet, protein and snack counter.' },
  { co: 'Hyderabad Nuts & Spices', who: 'Mohammed Irfan', cat: 'retail_store', region: 'Hyderabad', place: 'Charminar', src: 'google_maps', age: 20, note: 'Old city shop, big in dates and dry fruits for Ramzan.' },
  { co: 'Heritage Fresh Mart', who: 'Ramakrishna Rao', cat: 'retail_store', region: 'Hyderabad', place: 'Kukatpally', src: 'google_maps', age: 15, note: 'Supermarket chain outlet, 2,500 sq ft.' },
  { co: 'Lotus Bay Cafe', who: 'Sravani Reddy', cat: 'hotel_cafe', region: 'Hyderabad', place: 'Jubilee Hills', src: 'google_maps', age: 13, note: 'Boutique cafe with gifting corner.' },
  { co: 'Axis Point Infotech', who: 'Naveen Kumar', cat: 'corporate_gifting', region: 'Hyderabad', place: 'HITEC City', src: 'inbound', age: 11, noWa: true, note: 'Admin team enquired about 400 gift boxes.' },
  { co: 'Venu Gopal Enterprises', who: 'Venu Gopal', cat: 'distributor', region: 'Hyderabad', place: 'LB Nagar', src: 'referral', age: 23, note: 'Sub-distributor for south Hyderabad kiranas.' },
  { co: 'Marina Fresh Foods', who: 'Selvakumar R', cat: 'retail_store', region: 'Chennai', place: 'Velachery', src: 'google_maps', age: 18, note: 'Supermarket with a dry fruit gifting section.' },
  { co: 'Murugan Stores', who: 'Murugan S', cat: 'retail_store', region: 'Chennai', place: 'Mylapore', src: 'google_maps', age: 22, note: 'Traditional provision store, steady local customers.' },
  { co: 'Coastal Breeze Hotel', who: 'Ananthi Raman', cat: 'hotel_cafe', region: 'Chennai', place: 'ECR', src: 'google_maps', age: 14, note: '70-room beach hotel, buffet and room baskets.' },
  { co: 'Vertex Software Chennai', who: 'Divya Subramanian', cat: 'corporate_gifting', region: 'Chennai', place: 'OMR', src: 'inbound', age: 12, note: 'Year-end gifts for about 260 staff.' },
  { co: 'Southern Star Traders', who: 'Gopinath K', cat: 'distributor', region: 'Chennai', place: 'Perungudi', src: 'trade_show', age: 24, note: 'Trade show contact, distributes snacks to IT park canteens.' },
  { co: 'Kolkata Kaju Corner', who: 'Subhash Ghosh', cat: 'retail_store', region: 'Kolkata', place: 'Gariahat', src: 'google_maps', age: 19, note: 'Popular dry fruit shop near Gariahat market.' },
  { co: 'Bengal Basket Supermart', who: 'Arindam Sen', cat: 'retail_store', region: 'Kolkata', place: 'New Town', src: 'google_maps', age: 13, note: 'Newer supermarket serving apartment complexes.' },
  { co: 'Park Street Pastry House', who: 'Rina Dutta', cat: 'hotel_cafe', region: 'Kolkata', place: 'Park Street', src: 'google_maps', age: 16, note: 'Bakery cafe, Christmas cake and gift box season.' },
  { co: 'Eastern Hampers Pvt Ltd', who: 'Debashis Roy', cat: 'corporate_gifting', region: 'Kolkata', place: 'Salt Lake', src: 'google_maps', age: 21, note: 'Hamper maker, mostly Durga Puja and Christmas.' },
  { co: 'Gujarat Mahila Traders', who: 'Hetal Parekh', cat: 'distributor', region: 'Ahmedabad', place: 'Naranpura', src: 'csv_upload', age: 20, note: 'Distributor for sweet marts and kirana shops.' },
  { co: 'Shree Krishna Kirana', who: 'Mitesh Soni', cat: 'retail_store', region: 'Ahmedabad', place: 'Vastrapur', src: 'google_maps', age: 15, note: 'Kirana near an apartment cluster.' },
  { co: 'Swaad Sagar Restaurant', who: 'Paresh Trivedi', cat: 'hotel_cafe', region: 'Ahmedabad', place: 'CG Road', src: 'google_maps', age: 17, note: 'Restaurant with a dessert counter.' },
  { co: 'Rangoli Gifts & Hampers', who: 'Nirali Desai', cat: 'corporate_gifting', region: 'Ahmedabad', place: 'Ellis Bridge', src: 'google_maps', age: 23, note: 'Wedding and festive gift maker.' },
  { co: 'Pink City Dry Fruits', who: 'Lalit Agarwal', cat: 'retail_store', region: 'Jaipur', place: 'Bapu Bazaar', src: 'google_maps', age: 18, note: 'Shop in the walled city, tourist and local footfall.' },
  { co: 'Amber Fort Hospitality', who: 'Devendra Rathore', cat: 'hotel_cafe', region: 'Jaipur', place: 'Amer Road', src: 'google_maps', age: 21, note: 'Heritage hotel with 40 rooms.' },
  { co: 'Marwar Super Store', who: 'Kishan Lal', cat: 'retail_store', region: 'Jaipur', place: 'Mansarovar', src: 'google_maps', age: 14, noWa: true, note: 'Supermarket in Mansarovar, strong festive sales.' },
  { co: 'Malabar Spice Mart', who: 'Thomas Mathew', cat: 'retail_store', region: 'Kochi', place: 'MG Road', src: 'google_maps', age: 20, note: 'Spice and dry fruit shop, tourists buy gift packs.' },
  { co: 'Backwater Bites Cafe', who: 'Anjali Nair', cat: 'hotel_cafe', region: 'Kochi', place: 'Fort Kochi', src: 'google_maps', age: 13, note: 'Cafe with a small snack shelf for travellers.' },
  { co: 'Cochin Hampers & Gifts', who: 'Biju George', cat: 'corporate_gifting', region: 'Kochi', place: 'Kakkanad', src: 'google_maps', age: 22, note: 'Gift shop near the Infopark, corporate and Christmas orders.' },
  { co: 'Kerala Choice Distributors', who: 'Rajan Pillai', cat: 'distributor', region: 'Kochi', place: 'Aluva', src: 'csv_upload', age: 24, note: 'Distributor for central Kerala supermarkets.' },
  { co: 'Greenleaf Canteen Services', who: 'Sheela Narayan', cat: 'institutional', region: 'Chennai', place: 'Guindy', src: 'google_maps', age: 19, note: 'Runs canteens in two factories.' },
  { co: 'Little Scholars School', who: 'Ms. Farida Khan', cat: 'institutional', region: 'Mumbai', place: 'Mulund', src: 'referral', age: 11, note: 'School looking for sports-day snack packs.' },
  { co: 'QuickBasket Online', who: 'Rahul Verma', cat: 'ecommerce_reseller', region: 'Bengaluru', place: 'HSR Layout', src: 'inbound', age: 16, note: 'Small online grocery, wants to list makhana and seeds.' },
  { co: 'HealthNest Store', who: 'Priya Rajan', cat: 'ecommerce_reseller', region: 'Hyderabad', place: 'Kondapur', src: 'inbound', age: 21, note: 'Online health store on its own site.' },
  { co: 'Nutrimart Retail', who: 'Aakash Jain', cat: 'ecommerce_reseller', region: 'Delhi NCR', place: 'Noida Sector 18', src: 'inbound', age: 18, note: 'Marketplace seller asking about bulk prices.' },
  { co: 'Glow Fit Wellness Club', who: 'Namrata Shetty', cat: 'gym_wellness', region: 'Pune', place: 'Baner', src: 'google_maps', age: 12, note: 'Wellness club with a juice and snack bar.' },
  { co: 'Mount View Hostel & Mess', who: 'Gurmeet Singh', cat: 'institutional', region: 'Pune', place: 'Wakad', src: 'google_maps', age: 20, note: 'Student hostel mess for 450 residents.' },
];
