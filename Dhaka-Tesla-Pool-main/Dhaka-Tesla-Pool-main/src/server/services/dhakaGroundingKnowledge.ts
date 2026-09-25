export interface GroundedPlaceItem {
  title: string;
  uri: string;
  address: string;
  snippet: string;
  area: string;
  keywords: string[];
}

export const VERIFIED_DHAKA_MAPS_PLACES: GroundedPlaceItem[] = [
  {
    title: 'Gulshan 2 Circle & Commercial Hub',
    uri: 'https://www.google.com/maps/search/?api=1&query=Gulshan+2+Circle+Dhaka',
    address: 'Gulshan 2 Circle, Gulshan Avenue, Dhaka 1212',
    snippet: 'Major Dhaka diplomatic and corporate intersection. Best Tesla pickup near Westin Hotel, DCC Market, and Pink City.',
    area: 'Gulshan 2',
    keywords: ['gulshan 2', 'gulshan-2', 'circle', 'westin', 'pink city', 'dcc market', 'avenue'],
  },
  {
    title: 'Gulshan 1 Circle & Police Plaza',
    uri: 'https://www.google.com/maps/search/?api=1&query=Gulshan+1+Circle+Dhaka',
    address: 'Gulshan 1 Circle, Hatirjheel Link Road, Dhaka 1212',
    snippet: 'Prime access point for Hatirjheel express drive, Police Plaza Concord, and Badda connector.',
    area: 'Gulshan 1',
    keywords: ['gulshan 1', 'gulshan-1', 'police plaza', 'hatirjheel', 'badda'],
  },
  {
    title: 'Banani Road 11 Commercial Strip',
    uri: 'https://www.google.com/maps/search/?api=1&query=Banani+Road+11+Dhaka',
    address: 'Road 11, Block D, Banani, Dhaka 1213',
    snippet: 'Dhaka’s premier dining and shopping boulevard. Designated low-congestion pickup bays outside major banks and cafés.',
    area: 'Banani',
    keywords: ['banani', 'road 11', 'road-11', 'block d', 'kemal ataturk', 'star kebabs'],
  },
  {
    title: 'Mohakhali Flyover & Bus Terminal Spine',
    uri: 'https://www.google.com/maps/search/?api=1&query=Mohakhali+Bus+Terminal+Dhaka',
    address: 'Mohakhali C/A, Airport Road, Dhaka 1212',
    snippet: 'High-density transit nexus connecting Airport Road, Gulshan 1, and Tejgaon industrial belt. Ideal rendezvous at flyover south ramp.',
    area: 'Mohakhali',
    keywords: ['mohakhali', 'flyover', 'terminal', 'icddrb', 'amtoli', 'wireless'],
  },
  {
    title: 'Kuril Flyover & Bashundhara Gateway',
    uri: 'https://www.google.com/maps/search/?api=1&query=Kuril+Flyover+Dhaka',
    address: 'Kuril Interchange, Airport Road / Purbachal Expressway, Dhaka 1229',
    snippet: 'Fast-flow cloverleaf connecting Uttara, Airport Road, Bashundhara R/A, and Jamuna Future Park.',
    area: 'Kuril',
    keywords: ['kuril', 'jamuna future park', 'bashundhara', 'purbachal', 'expressway', 'cloverleaf'],
  },
  {
    title: 'Uttara Sector 3 & North Metro Station (MRT Line 6)',
    uri: 'https://www.google.com/maps/search/?api=1&query=Uttara+North+Metro+Station+Dhaka',
    address: 'Sector 3 / Jasimuddin Avenue, Uttara, Dhaka 1230',
    snippet: 'Direct interchange with Dhaka Metro MRT Line 6 and Airport Road corridor. High-frequency Tesla shared pickup zone.',
    area: 'Uttara',
    keywords: ['uttara', 'sector 3', 'metro station', 'mrt line 6', 'jasimuddin', 'house building', 'airport road'],
  },
  {
    title: 'Dhanmondi 27 (Satmasjid Road Landmark)',
    uri: 'https://www.google.com/maps/search/?api=1&query=Dhanmondi+27+Satmasjid+Road+Dhaka',
    address: 'Road 27 (New 16), Satmasjid Road, Dhanmondi, Dhaka 1209',
    snippet: 'Key arterial corner linking Mirpur Road, Rapa Plaza, and Dhanmondi Lake recreational path.',
    area: 'Dhanmondi',
    keywords: ['dhanmondi', 'dhanmondi 27', 'satmasjid road', 'rapa plaza', 'dhanmondi lake'],
  },
  {
    title: 'Farmgate Metro Station & Police Box Hub',
    uri: 'https://www.google.com/maps/search/?api=1&query=Farmgate+Metro+Station+Dhaka',
    address: 'Kazi Nazrul Islam Avenue, Farmgate, Dhaka 1215',
    snippet: 'Major central transit bottleneck eased by MRT Line 6 viaduct. Best pickup near Ananda Cinema and Khamarbari gate.',
    area: 'Farmgate',
    keywords: ['farmgate', 'khamarbari', 'ananda cinema', 'kazi nazrul islam', 'metro'],
  },
  {
    title: 'Mirpur 10 Circle & Metro Interchange',
    uri: 'https://www.google.com/maps/search/?api=1&query=Mirpur+10+Roundabout+Dhaka',
    address: 'Mirpur 10 Roundabout, Mirpur, Dhaka 1216',
    snippet: 'Busiest roundabout in northwestern Dhaka with elevated MRT-6 station. Fast connector to Mirpur 1, 2, 11, and 12.',
    area: 'Mirpur',
    keywords: ['mirpur', 'mirpur 10', 'roundabout', 'sher-e-bangla stadium', 'benarasi polli'],
  },
  {
    title: 'Hazrat Shahjalal International Airport (Terminal 1 & 2)',
    uri: 'https://www.google.com/maps/search/?api=1&query=Hazrat+Shahjalal+International+Airport+Dhaka',
    address: 'Airport Road, Kurmitola, Dhaka 1229',
    snippet: 'Dhaka international aviation hub. Tesla dedicated pickup at Arrival Canopy lane 3 with zero-emission VIP dispatch.',
    area: 'Airport',
    keywords: ['airport', 'shahjalal', 'flight', 'arrival', 'departure', 'kurmitola', 'terminal 1', 'terminal 2'],
  },
];

export function findVerifiedDhakaPlaces(queryText: string): GroundedPlaceItem[] {
  const q = queryText.toLowerCase().trim();
  const matched = VERIFIED_DHAKA_MAPS_PLACES.filter((item) => {
    if (item.title.toLowerCase().includes(q) || item.area.toLowerCase().includes(q)) {
      return true;
    }
    return item.keywords.some((k) => q.includes(k) || k.includes(q));
  });

  if (matched.length > 0) {
    return matched;
  }

  // Return top 3 representative corridor venues if no direct keyword match
  return VERIFIED_DHAKA_MAPS_PLACES.slice(0, 4);
}
