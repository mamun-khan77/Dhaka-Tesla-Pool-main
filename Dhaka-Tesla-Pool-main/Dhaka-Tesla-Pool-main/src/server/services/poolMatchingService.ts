import { db } from '../db/store.ts';
import { areRoutesCompatible, calculateFare } from './dhakaRouting.ts';
import { PoolRecord, RideRecord, VehicleRecord } from '../types/index.ts';

export interface PoolMatchCandidate {
  pool: PoolRecord;
  vehicle: VehicleRecord;
  availableSeats: number;
  compatibilityReason: string;
  discountedFarePoisha: number;
}

export class PoolMatchingService {
  /**
   * Find compatible open pools for an incoming ride request or existing requested ride
   */
  public async findCompatiblePools(
    pickupArea: string,
    destinationArea: string,
    seatsRequested: number
  ): Promise<PoolMatchCandidate[]> {
    const allPools = await db.getAllPools();
    const openPools = allPools.filter((p) => p.status === 'OPEN');
    const candidates: PoolMatchCandidate[] = [];

    for (const pool of openPools) {
      const vehicle = await db.findVehicleById(pool.vehicleId);
      if (!vehicle || vehicle.status !== 'ACTIVE') continue;

      const members = await db.getPoolMembers(pool.id);
      const occupiedSeats = members.reduce((sum, m) => sum + m.seats, 0);
      const availableSeats = vehicle.capacity - occupiedSeats;

      // Must have enough seats
      if (availableSeats < seatsRequested) continue;

      // If pool is empty, it's open for any route
      if (members.length === 0) {
        const fare = calculateFare(pickupArea, destinationArea, false, seatsRequested);
        candidates.push({
          pool,
          vehicle,
          availableSeats,
          compatibilityReason: 'Fresh available Tesla pool ready for route assignment',
          discountedFarePoisha: fare.totalFarePoisha,
        });
        continue;
      }

      // Check route compatibility against existing pool members
      let allMembersCompatible = true;
      let reason = '';

      for (const member of members) {
        const existingRide = await db.findRideById(member.rideId);
        if (!existingRide) continue;

        const check = areRoutesCompatible(
          { pickup: existingRide.pickupArea, destination: existingRide.destinationArea },
          { pickup: pickupArea, destination: destinationArea }
        );

        if (!check.compatible) {
          allMembersCompatible = false;
          break;
        }
        reason = check.reason;
      }

      if (allMembersCompatible) {
        const fare = calculateFare(pickupArea, destinationArea, true, seatsRequested);
        candidates.push({
          pool,
          vehicle,
          availableSeats,
          compatibilityReason: reason || 'Compatible corridor routing with existing co-riders',
          discountedFarePoisha: fare.totalFarePoisha,
        });
      }
    }

    return candidates;
  }

  /**
   * Automatically attempts to match a ride to an existing open compatible pool,
   * or matches to an available driver's vehicle.
   */
  public async autoMatchRide(ride: RideRecord): Promise<{
    matched: boolean;
    poolId?: string;
    vehicleName?: string;
    message: string;
  }> {
    const candidates = await this.findCompatiblePools(
      ride.pickupArea,
      ride.destinationArea,
      ride.seatsRequested
    );

    if (candidates.length > 0) {
      // Pick the best pool (e.g. one with most shared corridor or highest occupancy to maximize pooling efficiency)
      const best = candidates[0];

      const joinResult = await db.addMemberToPoolAtomic(
        best.pool.id,
        ride.id,
        ride.passengerId,
        ride.seatsRequested,
        best.discountedFarePoisha
      );

      if (joinResult.success) {
        return {
          matched: true,
          poolId: best.pool.id,
          vehicleName: best.vehicle.name,
          message: `Successfully matched to Tesla "${best.vehicle.name}". ${best.compatibilityReason}. Pool discount applied!`,
        };
      }
    }

    // Check if an active vehicle without a pool is available
    const vehicles = await db.getAllVehicles();
    const activeVehicles = vehicles.filter((v) => v.status === 'ACTIVE');

    for (const vehicle of activeVehicles) {
      const activePool = await db.getActivePoolForVehicle(vehicle.id);
      if (!activePool) {
        // Create new pool for this vehicle
        const newPool = await db.createPool(
          vehicle.id,
          `${ride.pickupArea} -> ${ride.destinationArea}`
        );

        const fare = calculateFare(ride.pickupArea, ride.destinationArea, false, ride.seatsRequested);

        const joinResult = await db.addMemberToPoolAtomic(
          newPool.id,
          ride.id,
          ride.passengerId,
          ride.seatsRequested,
          fare.totalFarePoisha
        );

        if (joinResult.success) {
          return {
            matched: true,
            poolId: newPool.id,
            vehicleName: vehicle.name,
            message: `Created new pool in Tesla "${vehicle.name}". Waiting for co-riders to split the fare!`,
          };
        }
      }
    }

    return {
      matched: false,
      message: 'No immediate Tesla pool available. Your ride request is queued for incoming vehicles.',
    };
  }
}

export const poolMatchingService = new PoolMatchingService();
