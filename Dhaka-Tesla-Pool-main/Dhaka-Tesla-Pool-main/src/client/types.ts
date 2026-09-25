export type Role = 'PASSENGER' | 'DRIVER' | 'ADMIN';

export type RideStatus = 
  | 'REQUESTED' 
  | 'MATCHED' 
  | 'DRIVER_ARRIVED' 
  | 'STARTED' 
  | 'COMPLETED' 
  | 'CANCELLED';

export type PoolStatus = 
  | 'OPEN' 
  | 'FULL' 
  | 'IN_TRANSIT' 
  | 'COMPLETED' 
  | 'CANCELLED';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  createdAt?: string;
}

export interface Vehicle {
  id: string;
  name: string;
  model: string;
  plateNumber: string;
  capacity: number;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  driverId?: string;
  driverName?: string;
}

export interface Ride {
  id: string;
  passengerId: string;
  passengerName?: string;
  vehicleName?: string;
  pickupArea: string;
  destinationArea: string;
  seatsRequested: number;
  baseFare: number;
  distanceCharge: number;
  poolDiscount: number;
  fare: number;
  formattedFare: string;
  formattedBaseFare?: string;
  formattedDistanceCharge?: string;
  formattedPoolDiscount?: string;
  status: RideStatus;
  createdAt: string;
  updatedAt: string;
  vehicle?: { name: string; model: string; plateNumber: string; capacity?: number } | null;
  driver?: { name: string; phone: string } | null;
  pool?: { id: string; status: PoolStatus; routeSummary?: string } | null;
  coPassengers?: Array<{ name: string; pickup: string; destination: string; seats: number }>;
  history?: Array<{ id: string; status: RideStatus; note?: string; timestamp: string }>;
  payments?: Array<{ id: string; amount: number; method: string; status: string; transactionRef?: string }>;
}

export interface Pool {
  id: string;
  status: PoolStatus;
  routeSummary?: string;
  occupiedSeats: number;
  capacity: number;
  availableSeats: number;
  vehicle: {
    name: string;
    model: string;
    plateNumber: string;
    capacity: number;
  } | null;
  driver?: { name: string } | null;
  members: Array<{
    id: string;
    passengerName: string;
    pickup: string;
    destination: string;
    seats: number;
    individualFare: number;
    formattedFare: string;
  }>;
  createdAt: string;
}

export interface SystemStats {
  totalUsers: number;
  totalPassengers: number;
  totalDrivers: number;
  totalVehicles: number;
  totalRides: number;
  activePools: number;
  completedRides: number;
  cancelledRides: number;
  totalRevenuePoisha: number;
  totalRevenueFormatted: string;
}

export interface FareEstimate {
  pickupArea: string;
  destinationArea: string;
  seatsRequested: number;
  distanceKm: number;
  soloEstimate: {
    baseFarePoisha: number;
    distanceChargePoisha: number;
    poolDiscountPoisha: number;
    totalFarePoisha: number;
    formatted: {
      baseFare: string;
      distanceCharge: string;
      poolDiscount: string;
      totalFare: string;
    };
  };
  poolEstimate: {
    baseFarePoisha: number;
    distanceChargePoisha: number;
    poolDiscountPoisha: number;
    totalFarePoisha: number;
    formatted: {
      baseFare: string;
      distanceCharge: string;
      poolDiscount: string;
      totalFare: string;
    };
  };
  availablePoolsCount: number;
}
