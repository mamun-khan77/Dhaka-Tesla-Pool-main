import { Response } from 'express';
import { db } from '../db/store.ts';
import { AuthenticatedRequest } from '../middleware/auth.ts';

export async function getAdminStats(_req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const stats = await db.getSystemStatistics();
    res.json({ success: true, statistics: stats });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error fetching stats' });
  }
}

export async function getAdminUsers(_req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const users = await db.getAllUsers();
    const sanitized = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      createdAt: u.createdAt,
    }));
    res.json({ success: true, users: sanitized });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error fetching users' });
  }
}

export async function getAdminRides(_req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const rides = await db.getAllRides();
    const enriched = await Promise.all(
      rides.map(async (r) => {
        const passenger = await db.findUserById(r.passengerId);
        const poolMember = await db.getPoolMemberByRideId(r.id);
        let vehicle = null;
        if (poolMember) {
          const pool = await db.findPoolById(poolMember.poolId);
          if (pool) {
            vehicle = await db.findVehicleById(pool.vehicleId);
          }
        }
        return {
          ...r,
          formattedFare: `৳${(r.fare / 100).toFixed(2)}`,
          passengerName: passenger?.name || 'Unknown',
          vehicleName: vehicle?.name || 'None',
        };
      })
    );
    res.json({ success: true, rides: enriched });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error fetching rides' });
  }
}

export async function getAdminVehicles(_req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const vehicles = await db.getAllVehicles();
    const enriched = await Promise.all(
      vehicles.map(async (v) => {
        const driver = await db.findUserById(v.driverId);
        return {
          ...v,
          driverName: driver?.name || 'Unknown',
        };
      })
    );
    res.json({ success: true, vehicles: enriched });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error fetching vehicles' });
  }
}

export async function resetDatabase(_req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    db.resetToSeed();
    res.json({ success: true, message: 'Database reset to initial seed state successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error resetting database' });
  }
}
