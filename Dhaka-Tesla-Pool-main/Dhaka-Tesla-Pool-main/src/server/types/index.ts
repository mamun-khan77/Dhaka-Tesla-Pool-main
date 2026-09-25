export type Role = 'PASSENGER' | 'DRIVER' | 'ADMIN';

export type VehicleStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';

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

export type PaymentMethod = 'CASH' | 'TESLAPAY';

export type PaymentStatus = 'PENDING' | 'PAID' | 'REFUNDED' | 'FAILED';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleRecord {
  id: string;
  driverId: string;
  name: string; // e.g. "Bullet"
  model: string;
  plateNumber: string;
  capacity: number; // e.g. 3
  status: VehicleStatus;
  createdAt: string;
  updatedAt: string;
}

export interface RideRecord {
  id: string;
  passengerId: string;
  pickupArea: string;
  destinationArea: string;
  seatsRequested: number;
  baseFare: number; // In Poisha
  distanceCharge: number; // In Poisha
  poolDiscount: number; // In Poisha
  fare: number; // Final charged fare in Poisha
  status: RideStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PoolRecord {
  id: string;
  vehicleId: string;
  status: PoolStatus;
  routeSummary?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PoolMemberRecord {
  id: string;
  poolId: string;
  rideId: string;
  passengerId: string;
  seats: number;
  individualFare: number; // In Poisha
  joinedAt: string;
}

export interface RideStatusHistoryRecord {
  id: string;
  rideId: string;
  status: RideStatus;
  note?: string;
  timestamp: string;
}

export interface PaymentRecord {
  id: string;
  rideId: string;
  passengerId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionRef?: string;
  createdAt: string;
}

export interface DhakaLocation {
  id: string;
  name: string;
  zone: 'NORTH' | 'CENTRAL' | 'EAST' | 'SOUTH_WEST';
  lat: number;
  lng: number;
  corridorGroup: string[];
}
