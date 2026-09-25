import { DhakaLocation } from '../types/index.ts';

export const DHAKA_LOCATIONS: Record<string, DhakaLocation> = {
  'Banani': {
    id: 'Banani',
    name: 'Banani',
    zone: 'CENTRAL',
    lat: 23.7937,
    lng: 90.4066,
    corridorGroup: ['AIRPORT_ROAD', 'GULSHAN_CORRIDOR'],
  },
  'Gulshan 1': {
    id: 'Gulshan 1',
    name: 'Gulshan 1',
    zone: 'EAST',
    lat: 23.7785,
    lng: 90.4182,
    corridorGroup: ['GULSHAN_CORRIDOR', 'HATIRJHEEL_CONNECT'],
  },
  'Gulshan 2': {
    id: 'Gulshan 2',
    name: 'Gulshan 2',
    zone: 'EAST',
    lat: 23.7925,
    lng: 90.4152,
    corridorGroup: ['GULSHAN_CORRIDOR', 'NORTH_CORRIDOR'],
  },
  'Mohakhali': {
    id: 'Mohakhali',
    name: 'Mohakhali',
    zone: 'CENTRAL',
    lat: 23.7776,
    lng: 90.4054,
    corridorGroup: ['AIRPORT_ROAD', 'HATIRJHEEL_CONNECT', 'CENTRAL_SPINE'],
  },
  'Dhanmondi': {
    id: 'Dhanmondi',
    name: 'Dhanmondi',
    zone: 'SOUTH_WEST',
    lat: 23.7461,
    lng: 90.3742,
    corridorGroup: ['MIRPUR_ROAD', 'SOUTH_SPINE'],
  },
  'Mirpur': {
    id: 'Mirpur',
    name: 'Mirpur',
    zone: 'NORTH',
    lat: 23.8223,
    lng: 90.3654,
    corridorGroup: ['MIRPUR_ROAD', 'METRO_CORRIDOR'],
  },
  'Uttara': {
    id: 'Uttara',
    name: 'Uttara',
    zone: 'NORTH',
    lat: 23.8759,
    lng: 90.3795,
    corridorGroup: ['AIRPORT_ROAD', 'METRO_CORRIDOR'],
  },
  'Farmgate': {
    id: 'Farmgate',
    name: 'Farmgate',
    zone: 'CENTRAL',
    lat: 23.7570,
    lng: 90.3900,
    corridorGroup: ['AIRPORT_ROAD', 'CENTRAL_SPINE', 'MIRPUR_ROAD'],
  },
  'Bashundhara': {
    id: 'Bashundhara',
    name: 'Bashundhara',
    zone: 'EAST',
    lat: 23.8191,
    lng: 90.4326,
    corridorGroup: ['NORTH_CORRIDOR', 'KURIL_CORRIDOR'],
  },
};

// Distance matrix in Kilometers between supported areas
const DISTANCE_MATRIX_KM: Record<string, Record<string, number>> = {
  'Banani': {
    'Banani': 0,
    'Gulshan 1': 2.8,
    'Gulshan 2': 1.6,
    'Mohakhali': 2.2,
    'Dhanmondi': 7.5,
    'Mirpur': 6.8,
    'Uttara': 9.2,
    'Farmgate': 4.6,
    'Bashundhara': 4.1,
  },
  'Gulshan 1': {
    'Banani': 2.8,
    'Gulshan 1': 0,
    'Gulshan 2': 1.8,
    'Mohakhali': 2.0,
    'Dhanmondi': 8.0,
    'Mirpur': 8.5,
    'Uttara': 10.5,
    'Farmgate': 4.8,
    'Bashundhara': 5.2,
  },
  'Gulshan 2': {
    'Banani': 1.6,
    'Gulshan 1': 1.8,
    'Gulshan 2': 0,
    'Mohakhali': 3.1,
    'Dhanmondi': 8.7,
    'Mirpur': 7.9,
    'Uttara': 8.8,
    'Farmgate': 5.5,
    'Bashundhara': 3.5,
  },
  'Mohakhali': {
    'Banani': 2.2,
    'Gulshan 1': 2.0,
    'Gulshan 2': 3.1,
    'Mohakhali': 0,
    'Dhanmondi': 6.2,
    'Mirpur': 7.2,
    'Uttara': 11.0,
    'Farmgate': 2.8,
    'Bashundhara': 6.0,
  },
  'Dhanmondi': {
    'Banani': 7.5,
    'Gulshan 1': 8.0,
    'Gulshan 2': 8.7,
    'Mohakhali': 6.2,
    'Dhanmondi': 0,
    'Mirpur': 6.5,
    'Uttara': 15.2,
    'Farmgate': 3.8,
    'Bashundhara': 12.0,
  },
  'Mirpur': {
    'Banani': 6.8,
    'Gulshan 1': 8.5,
    'Gulshan 2': 7.9,
    'Mohakhali': 7.2,
    'Dhanmondi': 6.5,
    'Mirpur': 0,
    'Uttara': 9.5,
    'Farmgate': 6.1,
    'Bashundhara': 9.8,
  },
  'Uttara': {
    'Banani': 9.2,
    'Gulshan 1': 10.5,
    'Gulshan 2': 8.8,
    'Mohakhali': 11.0,
    'Dhanmondi': 15.2,
    'Mirpur': 9.5,
    'Uttara': 0,
    'Farmgate': 13.0,
    'Bashundhara': 7.8,
  },
  'Farmgate': {
    'Banani': 4.6,
    'Gulshan 1': 4.8,
    'Gulshan 2': 5.5,
    'Mohakhali': 2.8,
    'Dhanmondi': 3.8,
    'Mirpur': 6.1,
    'Uttara': 13.0,
    'Farmgate': 0,
    'Bashundhara': 8.2,
  },
  'Bashundhara': {
    'Banani': 4.1,
    'Gulshan 1': 5.2,
    'Gulshan 2': 3.5,
    'Mohakhali': 6.0,
    'Dhanmondi': 12.0,
    'Mirpur': 9.8,
    'Uttara': 7.8,
    'Farmgate': 8.2,
    'Bashundhara': 0,
  },
};

export function getDistanceKm(pickup: string, destination: string): number {
  if (pickup === destination) return 1.0;
  const from = DISTANCE_MATRIX_KM[pickup];
  if (from && typeof from[destination] === 'number') {
    return from[destination];
  }
  // Fallback default Dhaka commute estimate
  return 5.0;
}

/**
 * Transparent Fare Calculation Formula:
 * passengerFare = baseFare + distanceCharge - poolDiscount
 *
 * Values stored in Poisha (100 poisha = 1 BDT):
 * - Base Fare: 60 BDT = 6,000 Poisha
 * - Distance Charge: 25 BDT / km = 2,500 Poisha / km
 * - Pool Discount: 25% discount if pooled with other riders
 */
export const FARE_CONFIG = {
  BASE_FARE_POISHA: 6000,          // ৳60.00
  RATE_PER_KM_POISHA: 2500,        // ৳25.00 per km
  POOL_DISCOUNT_PERCENTAGE: 0.25,  // 25% off when pooled
};

export interface FareCalculationResult {
  baseFarePoisha: number;
  distanceChargePoisha: number;
  poolDiscountPoisha: number;
  totalFarePoisha: number;
  distanceKm: number;
  formatted: {
    baseFare: string;
    distanceCharge: string;
    poolDiscount: string;
    totalFare: string;
  };
}

export function calculateFare(
  pickup: string,
  destination: string,
  isPooled: boolean = false,
  seats: number = 1
): FareCalculationResult {
  const distanceKm = getDistanceKm(pickup, destination);
  const baseFarePoisha = FARE_CONFIG.BASE_FARE_POISHA * seats;
  const distanceChargePoisha = Math.round(distanceKm * FARE_CONFIG.RATE_PER_KM_POISHA * seats);
  
  const subtotal = baseFarePoisha + distanceChargePoisha;
  const poolDiscountPoisha = isPooled ? Math.round(subtotal * FARE_CONFIG.POOL_DISCOUNT_PERCENTAGE) : 0;
  const totalFarePoisha = subtotal - poolDiscountPoisha;

  return {
    baseFarePoisha,
    distanceChargePoisha,
    poolDiscountPoisha,
    totalFarePoisha,
    distanceKm,
    formatted: {
      baseFare: `৳${(baseFarePoisha / 100).toFixed(2)}`,
      distanceCharge: `৳${(distanceChargePoisha / 100).toFixed(2)}`,
      poolDiscount: `৳${(poolDiscountPoisha / 100).toFixed(2)}`,
      totalFare: `৳${(totalFarePoisha / 100).toFixed(2)}`,
    },
  };
}

/**
 * Route Compatibility Evaluation
 * Checks if two ride requests can share a Tesla without creating impractical detours.
 *
 * Example:
 * Passenger 1: Banani -> Mohakhali
 * Passenger 2: Banani -> Gulshan 1
 * Both start at Banani hub and terminate in the adjacent South-Central/Hatirjheel cluster (< 2.5km apart).
 * Compatible!
 */
export function areRoutesCompatible(
  routeA: { pickup: string; destination: string },
  routeB: { pickup: string; destination: string }
): { compatible: boolean; reason: string } {
  // 1. Exact route match
  if (routeA.pickup === routeB.pickup && routeA.destination === routeB.destination) {
    return { compatible: true, reason: 'Identical pickup and destination' };
  }

  // 2. Same pickup, compatible destinations
  // Destinations must be close to each other (<= 3.5 km)
  if (routeA.pickup === routeB.pickup) {
    const destDistance = getDistanceKm(routeA.destination, routeB.destination);
    if (destDistance <= 3.5) {
      return { 
        compatible: true, 
        reason: `Shared pickup (${routeA.pickup}) with nearby dropoffs (${routeA.destination} and ${routeB.destination}, ${destDistance} km apart)` 
      };
    }
  }

  // 3. Same destination, compatible pickups
  if (routeA.destination === routeB.destination) {
    const pickupDistance = getDistanceKm(routeA.pickup, routeB.pickup);
    if (pickupDistance <= 3.5) {
      return { 
        compatible: true, 
        reason: `Shared destination (${routeA.destination}) with nearby pickups (${routeA.pickup} and ${routeB.pickup}, ${pickupDistance} km apart)` 
      };
    }
  }

  // 4. En-route stop:
  // e.g. Route A: Uttara -> Mohakhali; Route B: Banani -> Mohakhali
  // Banani is directly along the Airport Road corridor between Uttara and Mohakhali
  const distA = getDistanceKm(routeA.pickup, routeA.destination);
  const distB = getDistanceKm(routeB.pickup, routeB.destination);
  
  // Check if pickupB is an intermediate waypoint on Route A
  const detourA = getDistanceKm(routeA.pickup, routeB.pickup) + getDistanceKm(routeB.pickup, routeA.destination);
  if (detourA <= distA * 1.25 && routeA.destination === routeB.destination) {
    return {
      compatible: true,
      reason: `Pickup ${routeB.pickup} is directly along the route from ${routeA.pickup} to ${routeA.destination}`,
    };
  }

  // Check cluster corridor overlap
  const locPickupA = DHAKA_LOCATIONS[routeA.pickup];
  const locDestA = DHAKA_LOCATIONS[routeA.destination];
  const locPickupB = DHAKA_LOCATIONS[routeB.pickup];
  const locDestB = DHAKA_LOCATIONS[routeB.destination];

  if (locPickupA && locDestA && locPickupB && locDestB) {
    const sharedOrigin = locPickupA.corridorGroup.some(c => locPickupB.corridorGroup.includes(c));
    const sharedDest = locDestA.corridorGroup.some(c => locDestB.corridorGroup.includes(c));
    if (sharedOrigin && sharedDest) {
      return {
        compatible: true,
        reason: `Both routes navigate the same Dhaka transit corridor (${locPickupA.corridorGroup[0]})`,
      };
    }
  }

  return {
    compatible: false,
    reason: `Incompatible transit vectors: [${routeA.pickup} -> ${routeA.destination}] vs [${routeB.pickup} -> ${routeB.destination}]`,
  };
}
