export type ClientStatus = 'Active' | 'Suspended';
export type SubscriptionStatus = 'Trialing' | 'Active' | 'Past due' | 'Cancelled';
export type PlanName = 'Starter' | 'Growth' | 'Scale';

export type PlatformClient = {
  id: string;
  name: string;
  slug: string;
  owner: string;
  email: string;
  outlets: number;
  plan: PlanName;
  subscription: SubscriptionStatus;
  period: string;
  status: ClientStatus;
};

export const platformClients: PlatformClient[] = [
  { id: 'saffron', name: 'Saffron House', slug: 'saffron-house', owner: 'Suresh Pillai', email: 'suresh@saffronhouse.in', outlets: 2, plan: 'Growth', subscription: 'Trialing', period: 'Trial ends 26 Oct 2026', status: 'Active' },
  { id: 'marine', name: 'Marine Spice', slug: 'marine-spice', owner: 'Anita George', email: 'anita@marinespice.in', outlets: 1, plan: 'Starter', subscription: 'Active', period: 'Period ends 12 Nov 2026', status: 'Active' },
  { id: 'lulu', name: 'Lulu Kitchen', slug: 'lulu-kitchen', owner: 'Imran Sheikh', email: 'imran@lulukitchen.in', outlets: 3, plan: 'Scale', subscription: 'Past due', period: 'Period ended 1 Oct 2026', status: 'Active' },
  { id: 'old-town', name: 'Old Town Café', slug: 'old-town-cafe', owner: 'Thomas Varghese', email: 'thomas@oldtowncafe.in', outlets: 1, plan: 'Starter', subscription: 'Cancelled', period: 'Ended 30 Sep 2026', status: 'Suspended' },
  { id: 'coastal', name: 'Coastal Curry', slug: 'coastal-curry', owner: 'Kavita Nair', email: 'kavita@coastalcurry.in', outlets: 2, plan: 'Growth', subscription: 'Active', period: 'Period ends 5 Nov 2026', status: 'Active' },
  { id: 'biryani', name: 'Biryani Junction', slug: 'biryani-junction', owner: 'Mohammed Faizal', email: 'faizal@biryanijunction.in', outlets: 4, plan: 'Scale', subscription: 'Active', period: 'Period ends 18 Nov 2026', status: 'Active' },
  { id: 'pepper', name: 'Pepper Trail', slug: 'pepper-trail', owner: 'Rachel Cherian', email: 'rachel@peppertrail.in', outlets: 1, plan: 'Starter', subscription: 'Trialing', period: 'Trial ends 28 Oct 2026', status: 'Active' },
  { id: 'malabar', name: 'Malabar Spices', slug: 'malabar-spices', owner: 'Rajesh K.', email: 'rajesh@malabarspices.in', outlets: 1, plan: 'Starter', subscription: 'Cancelled', period: 'Ended 15 Sep 2026', status: 'Suspended' },
  { id: 'fort', name: 'Fort Kochi Grill', slug: 'fort-kochi-grill', owner: 'Anil Mathew', email: 'anil@fortkochigrill.in', outlets: 2, plan: 'Growth', subscription: 'Active', period: 'Period ends 2 Dec 2026', status: 'Active' },
  { id: 'thekkady', name: 'Thekkady Spice', slug: 'thekkady-spice', owner: 'Priya Thomas', email: 'priya@thekkadyspice.in', outlets: 1, plan: 'Starter', subscription: 'Active', period: 'Period ends 30 Oct 2026', status: 'Active' },
  { id: 'alleppey', name: 'Alleppey Backwaters', slug: 'alleppey-backwaters', owner: 'John Varghese', email: 'john@alleppeybackwaters.in', outlets: 3, plan: 'Scale', subscription: 'Active', period: 'Period ends 20 Nov 2026', status: 'Active' },
  { id: 'munnar', name: 'Munnar Tea House', slug: 'munnar-tea-house', owner: 'Deepa Iyer', email: 'deepa@munnarteahouse.in', outlets: 1, plan: 'Starter', subscription: 'Active', period: 'Period ends 8 Dec 2026', status: 'Active' },
  { id: 'calicut', name: 'Calicut Moplah', slug: 'calicut-moplah', owner: 'Faisal Rahman', email: 'faisal@calicutmoplah.in', outlets: 2, plan: 'Growth', subscription: 'Active', period: 'Period ends 14 Nov 2026', status: 'Active' },
  { id: 'trivandrum', name: 'Trivandrum Mess', slug: 'trivandrum-mess', owner: 'Sreeja Nair', email: 'sreeja@trivandrummess.in', outlets: 1, plan: 'Starter', subscription: 'Active', period: 'Period ends 18 Nov 2026', status: 'Active' },
  { id: 'kottayam', name: 'Kottayam Kitchen', slug: 'kottayam-kitchen', owner: 'Mathew George', email: 'mathew@kottayamkitchen.in', outlets: 2, plan: 'Growth', subscription: 'Active', period: 'Period ends 9 Dec 2026', status: 'Active' },
  { id: 'kannur', name: 'Kannur Theyyam', slug: 'kannur-theyyam', owner: 'Ravi Kumar', email: 'ravi@kannurtheyyam.in', outlets: 1, plan: 'Starter', subscription: 'Active', period: 'Period ends 22 Nov 2026', status: 'Active' },
  { id: 'wayanad', name: 'Wayanad Wild', slug: 'wayanad-wild', owner: 'Neha Menon', email: 'neha@wayanadwild.in', outlets: 2, plan: 'Scale', subscription: 'Active', period: 'Period ends 1 Dec 2026', status: 'Active' },
  { id: 'palakkad', name: 'Palakkad Palate', slug: 'palakkad-palate', owner: 'Arun Das', email: 'arun@palakkadpalate.in', outlets: 1, plan: 'Starter', subscription: 'Active', period: 'Period ends 4 Nov 2026', status: 'Active' },
  { id: 'thrissur', name: 'Thrissur Sadya', slug: 'thrissur-sadya', owner: 'Lakshmi Warrier', email: 'lakshmi@thrissursadya.in', outlets: 2, plan: 'Growth', subscription: 'Active', period: 'Period ends 16 Nov 2026', status: 'Active' },
  { id: 'kollam', name: 'Kollam Catch', slug: 'kollam-catch', owner: 'Joseph Antony', email: 'joseph@kollamcatch.in', outlets: 3, plan: 'Scale', subscription: 'Active', period: 'Period ends 28 Nov 2026', status: 'Active' },
  { id: 'ernakulam', name: 'Ernakulam Eats', slug: 'ernakulam-eats', owner: 'Nithin Paul', email: 'nithin@ernakulameats.in', outlets: 1, plan: 'Starter', subscription: 'Active', period: 'Period ends 2 Dec 2026', status: 'Active' },
  { id: 'kozhikode', name: 'Kozhikode Court', slug: 'kozhikode-court', owner: 'Aisha Banu', email: 'aisha@kozhikodecourt.in', outlets: 2, plan: 'Growth', subscription: 'Active', period: 'Period ends 11 Dec 2026', status: 'Active' },
  { id: 'varkala', name: 'Varkala Cliff', slug: 'varkala-cliff', owner: 'Rohan Shah', email: 'rohan@varkalacliff.in', outlets: 1, plan: 'Starter', subscription: 'Active', period: 'Period ends 6 Nov 2026', status: 'Active' },
  { id: 'pondicherry', name: 'Pondicherry Bay', slug: 'pondicherry-bay', owner: "Claire D'Souza", email: 'claire@pondicherrybay.in', outlets: 2, plan: 'Growth', subscription: 'Active', period: 'Period ends 10 Dec 2026', status: 'Active' },
];

export function findPlatformClient(id: string) {
  return platformClients.find((client) => client.id === id);
}
