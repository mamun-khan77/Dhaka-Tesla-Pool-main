import { Response } from 'express';
import { db } from '../db/store.ts';
import { AuthenticatedRequest } from '../middleware/auth.ts';
import { PoolRecord, RideRecord, VehicleRecord } from '../types/index.ts';

export async function getDriverDashboard(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    let vehicle = await db.findVehicleByDriverId(req.user.id);
    if (!vehicle) {
      // Auto create vehicle for demo driver if none
      vehicle = await db.createVehicle({
        driverId: req.user.id,
        name: req.user.name === 'Jashim' ? 'Bullet' : `${req.user.name}'s Tesla`,
        model: 'Tesla Model 3 Long Range',
        plateNumber: 'DHAKA-METRO-GA-11-2026',
        capacity: 3,
        status: 'ACTIVE',
      });
    }

    // Find active pool for this vehicle
    const activePool = await db.getActivePoolForVehicle(vehicle.id);
    let poolMembersWithDetails: any[] = [];
    let occupiedSeats = 0;

    if (activePool) {
      const members = await db.getPoolMembers(activePool.id);
      poolMembersWithDetails = await Promise.all(
        members.map(async (m) => {
          const passenger = await db.findUserById(m.passengerId);
          const ride = await db.findRideById(m.rideId);
          return {
            memberId: m.id,
            seats: m.seats,
            individualFarePoisha: m.individualFare,
            formattedFare: `৳${(m.individualFare / 100).toFixed(2)}`,
            passenger: passenger ? { id: passenger.id, name: passenger.name, phone: passenger.phone } : null,
            ride: ride ? {
              id: ride.id,
              pickupArea: ride.pickupArea,
              destinationArea: ride.destinationArea,
              status: ride.status,
            } : null,
          };
        })
      );
      occupiedSeats = members.reduce((sum, m) => sum + m.seats, 0);
    }

    const availableSeats = Math.max(0, vehicle.capacity - occupiedSeats);

    // Get pending requests waiting for a ride in Dhaka
    const pendingRequests = await db.getPendingRequests();
    const enrichedPending = await Promise.all(
      pendingRequests.map(async (r) => {
        const passenger = await db.findUserById(r.passengerId);
        return {
          ...r,
          formattedFare: `৳${(r.fare / 100).toFixed(2)}`,
          passenger: passenger ? { name: passenger.name, phone: passenger.phone } : null,
        };
      })
    );

    // Get completed driver rides history
    const allRides = await db.getAllRides();
    const completedRides = allRides.filter((r) => r.status === 'COMPLETED');

    res.json({
      success: true,
      driver: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
      },
      vehicle: {
        id: vehicle.id,
        name: vehicle.name,
        model: vehicle.model,
        plateNumber: vehicle.plateNumber,
        capacity: vehicle.capacity,
        status: vehicle.status,
      },
      seatStats: {
        capacity: vehicle.capacity,
        occupied: occupiedSeats,
        available: availableSeats,
        isFull: occupiedSeats >= vehicle.capacity,
      },
      activePool: activePool
        ? {
            id: activePool.id,
            status: activePool.status,
            routeSummary: activePool.routeSummary,
            members: poolMembersWithDetails,
          }
        : null,
      pendingRequests: enrichedPending,
      historyCount: completedRides.length,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error fetching driver dashboard' });
  }
}

export async function toggleVehicleStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const vehicle = await db.findVehicleByDriverId(req.user.id);
    if (!vehicle) {
      res.status(404).json({ success: false, error: 'No vehicle registered for driver' });
      return;
    }

    const nextStatus = vehicle.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const updated = await db.updateVehicle(vehicle.id, { status: nextStatus });

    res.json({
      success: true,
      message: `Vehicle is now ${nextStatus === 'ACTIVE' ? 'ONLINE and accepting rides' : 'OFFLINE'}`,
      vehicle: updated,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to update vehicle status' });
  }
}

export async function acceptRide(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { id: rideId } = req.params;
    const ride = await db.findRideById(rideId);
    if (!ride) {
      res.status(404).json({ success: false, error: 'Ride request not found' });
      return;
    }

    if (ride.status !== 'REQUESTED') {
      res.status(400).json({ success: false, error: `Ride is not in REQUESTED status (currently ${ride.status})` });
      return;
    }

    const vehicle = await db.findVehicleByDriverId(req.user.id);
    if (!vehicle) {
      res.status(400).json({ success: false, error: 'Driver has no vehicle assigned' });
      return;
    }

    // Find or create active pool
    let activePool = await db.getActivePoolForVehicle(vehicle.id);
    if (!activePool) {
      activePool = await db.createPool(
        vehicle.id,
        `${ride.pickupArea} -> ${ride.destinationArea}`
      );
    }

    // Atomic addition to prevent overbooking
    const joinResult = await db.addMemberToPoolAtomic(
      activePool.id,
      ride.id,
      ride.passengerId,
      ride.seatsRequested,
      ride.fare
    );

    if (!joinResult.success) {
      res.status(409).json({ success: false, error: joinResult.error });
      return;
    }

    res.json({
      success: true,
      message: `Accepted ride! Added passenger to pool in "${vehicle.name}".`,
      pool: joinResult.pool,
      poolMember: joinResult.poolMember,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to accept ride' });
  }
}

export async function markDriverArrived(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id: rideId } = req.params;
    const updateResult = await db.updateRideStatus(
      rideId,
      'DRIVER_ARRIVED',
      'Driver has arrived at the pickup location in Dhaka'
    );

    if (!updateResult.success) {
      res.status(400).json({ success: false, error: updateResult.error });
      return;
    }

    res.json({
      success: true,
      message: 'Status updated: Driver Arrived',
      ride: updateResult.ride,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to update status' });
  }
}

export async function startRide(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id: rideId } = req.params;
    const updateResult = await db.updateRideStatus(
      rideId,
      'STARTED',
      'Ride has started. Navigating Dhaka traffic.'
    );

    if (!updateResult.success) {
      res.status(400).json({ success: false, error: updateResult.error });
      return;
    }

    // Update pool status to IN_TRANSIT
    const member = await db.getPoolMemberByRideId(rideId);
    if (member) {
      const pool = await db.findPoolById(member.poolId);
      if (pool && pool.status !== 'IN_TRANSIT') {
        pool.status = 'IN_TRANSIT';
        db.save();
      }
    }

    res.json({
      success: true,
      message: 'Ride started successfully',
      ride: updateResult.ride,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to start ride' });
  }
}

export async function completeRide(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id: rideId } = req.params;
    const updateResult = await db.updateRideStatus(
      rideId,
      'COMPLETED',
      'Ride safely completed at destination.'
    );

    if (!updateResult.success) {
      res.status(400).json({ success: false, error: updateResult.error });
      return;
    }

    // Check if all members in pool are completed
    const member = await db.getPoolMemberByRideId(rideId);
    if (member) {
      const pool = await db.findPoolById(member.poolId);
      if (pool) {
        const poolMembers = await db.getPoolMembers(pool.id);
        const memberRides = await Promise.all(poolMembers.map((m) => db.findRideById(m.rideId)));
        const allCompleted = memberRides.every((r) => r && (r.status === 'COMPLETED' || r.status === 'CANCELLED'));
        if (allCompleted) {
          pool.status = 'COMPLETED';
          db.save();
        }
      }
    }

    res.json({
      success: true,
      message: 'Ride completed successfully! Fare recorded.',
      ride: updateResult.ride,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to complete ride' });
  }
}
