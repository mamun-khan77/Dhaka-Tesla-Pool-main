import { Request, Response } from 'express';
import { db } from '../db/store.ts';
import { AuthenticatedRequest } from '../middleware/auth.ts';

export async function getAllPools(_req: Request, res: Response): Promise<void> {
  try {
    const pools = await db.getAllPools();
    const enriched = await Promise.all(
      pools.map(async (pool) => {
        const vehicle = await db.findVehicleById(pool.vehicleId);
        const members = await db.getPoolMembers(pool.id);
        const occupiedSeats = members.reduce((sum, m) => sum + m.seats, 0);

        const memberDetails = await Promise.all(
          members.map(async (m) => {
            const passenger = await db.findUserById(m.passengerId);
            const ride = await db.findRideById(m.rideId);
            return {
              id: m.id,
              passengerName: passenger?.name || 'Commuter',
              pickup: ride?.pickupArea,
              destination: ride?.destinationArea,
              seats: m.seats,
              individualFare: m.individualFare,
              formattedFare: `৳${(m.individualFare / 100).toFixed(2)}`,
            };
          })
        );

        let driver = null;
        if (vehicle) {
          driver = await db.findUserById(vehicle.driverId);
        }

        return {
          id: pool.id,
          status: pool.status,
          routeSummary: pool.routeSummary,
          vehicle: vehicle ? {
            name: vehicle.name,
            model: vehicle.model,
            plateNumber: vehicle.plateNumber,
            capacity: vehicle.capacity,
          } : null,
          driver: driver ? { name: driver.name } : null,
          occupiedSeats,
          capacity: vehicle?.capacity || 3,
          availableSeats: Math.max(0, (vehicle?.capacity || 3) - occupiedSeats),
          members: memberDetails,
          createdAt: pool.createdAt,
        };
      })
    );

    res.json({ success: true, pools: enriched });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error fetching pools' });
  }
}

export async function getPoolById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const pool = await db.findPoolById(id);
    if (!pool) {
      res.status(404).json({ success: false, error: 'Pool not found' });
      return;
    }

    const vehicle = await db.findVehicleById(pool.vehicleId);
    const members = await db.getPoolMembers(pool.id);
    const occupiedSeats = members.reduce((sum, m) => sum + m.seats, 0);

    const memberDetails = await Promise.all(
      members.map(async (m) => {
        const passenger = await db.findUserById(m.passengerId);
        const ride = await db.findRideById(m.rideId);
        return {
          id: m.id,
          passengerName: passenger?.name || 'Commuter',
          pickup: ride?.pickupArea,
          destination: ride?.destinationArea,
          seats: m.seats,
          individualFare: m.individualFare,
        };
      })
    );

    res.json({
      success: true,
      pool: {
        ...pool,
        vehicle,
        occupiedSeats,
        capacity: vehicle?.capacity || 3,
        availableSeats: Math.max(0, (vehicle?.capacity || 3) - occupiedSeats),
        members: memberDetails,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error fetching pool' });
  }
}

export async function joinPool(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { id: poolId } = req.params;
    const { rideId, seatsRequested, individualFare } = req.body;

    if (!rideId) {
      res.status(400).json({ success: false, error: 'rideId is required' });
      return;
    }

    const joinResult = await db.addMemberToPoolAtomic(
      poolId,
      rideId,
      req.user.id,
      seatsRequested || 1,
      individualFare || 8625
    );

    if (!joinResult.success) {
      res.status(409).json({ success: false, error: joinResult.error });
      return;
    }

    res.json({
      success: true,
      message: 'Successfully joined pool! Seat reserved.',
      poolMember: joinResult.poolMember,
      pool: joinResult.pool,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to join pool' });
  }
}
