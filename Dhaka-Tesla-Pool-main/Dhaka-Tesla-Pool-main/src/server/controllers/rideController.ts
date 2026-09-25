import { Response } from 'express';
import { z } from 'zod';
import { db } from '../db/store.ts';
import { AuthenticatedRequest } from '../middleware/auth.ts';
import { calculateFare, DHAKA_LOCATIONS } from '../services/dhakaRouting.ts';
import { poolMatchingService } from '../services/poolMatchingService.ts';

const createRideSchema = z.object({
  pickupArea: z.string().refine((val) => !!DHAKA_LOCATIONS[val], {
    message: `Invalid pickup area. Supported areas: ${Object.keys(DHAKA_LOCATIONS).join(', ')}`,
  }),
  destinationArea: z.string().refine((val) => !!DHAKA_LOCATIONS[val], {
    message: `Invalid destination area. Supported areas: ${Object.keys(DHAKA_LOCATIONS).join(', ')}`,
  }),
  seatsRequested: z.number().int().min(1).max(3).default(1),
  paymentMethod: z.enum(['CASH', 'TESLAPAY']).default('CASH'),
});

const estimateSchema = z.object({
  pickupArea: z.string().refine((val) => !!DHAKA_LOCATIONS[val]),
  destinationArea: z.string().refine((val) => !!DHAKA_LOCATIONS[val]),
  seatsRequested: z.number().int().min(1).max(3).default(1),
});

export async function estimateFare(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const parse = estimateSchema.safeParse(req.body);
    if (!parse.success) {
      const issues = (parse.error as any).issues || (parse.error as any).errors || [];
      res.status(400).json({ success: false, error: issues[0]?.message || 'Invalid parameters' });
      return;
    }

    const { pickupArea, destinationArea, seatsRequested } = parse.data;

    if (pickupArea === destinationArea) {
      res.status(400).json({ success: false, error: 'Pickup and destination cannot be identical.' });
      return;
    }

    const soloEstimate = calculateFare(pickupArea, destinationArea, false, seatsRequested);
    const poolEstimate = calculateFare(pickupArea, destinationArea, true, seatsRequested);

    // Also check current active pools for compatibility
    const candidates = await poolMatchingService.findCompatiblePools(
      pickupArea,
      destinationArea,
      seatsRequested
    );

    res.json({
      success: true,
      pickupArea,
      destinationArea,
      seatsRequested,
      distanceKm: soloEstimate.distanceKm,
      soloEstimate,
      poolEstimate,
      availablePoolsCount: candidates.length,
      bestCandidate: candidates[0] || null,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error calculating fare estimate' });
  }
}

export async function createRide(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const parse = createRideSchema.safeParse(req.body);
    if (!parse.success) {
      const issues = (parse.error as any).issues || (parse.error as any).errors || [];
      res.status(400).json({ success: false, error: issues[0]?.message || 'Invalid parameters' });
      return;
    }

    const { pickupArea, destinationArea, seatsRequested, paymentMethod } = parse.data;

    if (pickupArea === destinationArea) {
      res.status(400).json({ success: false, error: 'Pickup and destination cannot be the same area.' });
      return;
    }

    // Initial solo fare calculation
    const fareDetails = calculateFare(pickupArea, destinationArea, false, seatsRequested);

    // Create the ride record in database
    const newRide = await db.createRide({
      passengerId: req.user.id,
      pickupArea,
      destinationArea,
      seatsRequested,
      baseFare: fareDetails.baseFarePoisha,
      distanceCharge: fareDetails.distanceChargePoisha,
      poolDiscount: 0,
      fare: fareDetails.totalFarePoisha,
    });

    // Create initial payment record
    await db.createPayment({
      rideId: newRide.id,
      passengerId: req.user.id,
      amount: newRide.fare,
      method: paymentMethod,
      status: paymentMethod === 'TESLAPAY' ? 'PAID' : 'PENDING',
      transactionRef: paymentMethod === 'TESLAPAY' ? `TESLA-PAY-${Date.now().toString(36).toUpperCase()}` : undefined,
    });

    // Run Pool Matching Service to find or create a compatible pool
    const matchResult = await poolMatchingService.autoMatchRide(newRide);

    // Fetch updated ride details
    const updatedRide = await db.findRideById(newRide.id);

    res.status(201).json({
      success: true,
      message: matchResult.message,
      matched: matchResult.matched,
      ride: updatedRide,
      poolId: matchResult.poolId,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to create ride' });
  }
}

export async function getRides(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    let rides;
    if (req.user.role === 'ADMIN') {
      rides = await db.getAllRides();
    } else {
      // Passenger strictly sees only their own rides
      rides = await db.getRidesByPassengerId(req.user.id);
    }

    // Enrich rides with pool and driver details
    const enrichedRides = await Promise.all(
      rides.map(async (ride) => {
        const poolMember = await db.getPoolMemberByRideId(ride.id);
        let pool = null;
        let vehicle = null;
        let driver = null;

        if (poolMember) {
          pool = await db.findPoolById(poolMember.poolId);
          if (pool) {
            vehicle = await db.findVehicleById(pool.vehicleId);
            if (vehicle) {
              driver = await db.findUserById(vehicle.driverId);
            }
          }
        }

        return {
          ...ride,
          formattedFare: `৳${(ride.fare / 100).toFixed(2)}`,
          pool,
          vehicle: vehicle ? { name: vehicle.name, model: vehicle.model, plateNumber: vehicle.plateNumber } : null,
          driver: driver ? { name: driver.name, phone: driver.phone } : null,
        };
      })
    );

    res.json({ success: true, rides: enrichedRides });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to fetch rides' });
  }
}

export async function getRideById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    const ride = await db.findRideById(id);

    if (!ride) {
      res.status(404).json({ success: false, error: 'Ride not found' });
      return;
    }

    // Role-based privacy: passenger can ONLY access their own ride unless admin or assigned driver
    const poolMember = await db.getPoolMemberByRideId(ride.id);
    let pool = null;
    let vehicle = null;
    let driver = null;
    let coPassengers: Array<{ name: string; pickup: string; destination: string; seats: number }> = [];

    if (poolMember) {
      pool = await db.findPoolById(poolMember.poolId);
      if (pool) {
        vehicle = await db.findVehicleById(pool.vehicleId);
        if (vehicle) {
          driver = await db.findUserById(vehicle.driverId);
        }

        // Get fellow pool members (co-passengers) with sanitized info
        const allMembers = await db.getPoolMembers(pool.id);
        for (const m of allMembers) {
          if (m.passengerId !== req.user.id) {
            const memberUser = await db.findUserById(m.passengerId);
            const memberRide = await db.findRideById(m.rideId);
            if (memberUser && memberRide) {
              coPassengers.push({
                name: memberUser.name,
                pickup: memberRide.pickupArea,
                destination: memberRide.destinationArea,
                seats: m.seats,
              });
            }
          }
        }
      }
    }

    const isDriverOfRide = driver && driver.id === req.user.id;
    if (req.user.role !== 'ADMIN' && ride.passengerId !== req.user.id && !isDriverOfRide) {
      res.status(403).json({
        success: false,
        error: 'Forbidden. You do not have authorization to view this ride.',
      });
      return;
    }

    const history = await db.getRideStatusHistory(ride.id);
    const payments = await db.getPaymentsByRideId(ride.id);

    res.json({
      success: true,
      ride: {
        ...ride,
        formattedFare: `৳${(ride.fare / 100).toFixed(2)}`,
        formattedBaseFare: `৳${(ride.baseFare / 100).toFixed(2)}`,
        formattedDistanceCharge: `৳${(ride.distanceCharge / 100).toFixed(2)}`,
        formattedPoolDiscount: `৳${(ride.poolDiscount / 100).toFixed(2)}`,
      },
      pool,
      vehicle: vehicle ? { name: vehicle.name, model: vehicle.model, plateNumber: vehicle.plateNumber, capacity: vehicle.capacity } : null,
      driver: driver ? { name: driver.name, phone: driver.phone } : null,
      coPassengers,
      history,
      payments,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error fetching ride' });
  }
}

export async function cancelRide(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    const ride = await db.findRideById(id);

    if (!ride) {
      res.status(404).json({ success: false, error: 'Ride not found' });
      return;
    }

    if (req.user.role !== 'ADMIN' && ride.passengerId !== req.user.id) {
      res.status(403).json({ success: false, error: 'Forbidden. You can only cancel your own rides.' });
      return;
    }

    if (ride.status === 'CANCELLED') {
      res.status(400).json({ success: false, error: 'Ride is already cancelled.' });
      return;
    }

    if (ride.status === 'STARTED' || ride.status === 'COMPLETED') {
      res.status(400).json({
        success: false,
        error: `Cannot cancel a ride that is already ${ride.status.toLowerCase()}.`,
      });
      return;
    }

    const updateResult = await db.updateRideStatus(
      ride.id,
      'CANCELLED',
      `Cancelled by passenger (${req.user.name})`
    );

    if (!updateResult.success) {
      res.status(400).json({ success: false, error: updateResult.error });
      return;
    }

    res.json({
      success: true,
      message: 'Ride cancelled successfully.',
      ride: updateResult.ride,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to cancel ride' });
  }
}

export async function payRide(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    const { method } = req.body;

    const ride = await db.findRideById(id);
    if (!ride) {
      res.status(404).json({ success: false, error: 'Ride not found' });
      return;
    }

    if (ride.passengerId !== req.user.id && req.user.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    const payment = await db.createPayment({
      rideId: ride.id,
      passengerId: req.user.id,
      amount: ride.fare,
      method: method === 'TESLAPAY' ? 'TESLAPAY' : 'CASH',
      status: 'PAID',
      transactionRef: `TXN-${method || 'PAY'}-${Date.now().toString(36).toUpperCase()}`,
    });

    res.json({
      success: true,
      message: `Payment of ৳${(payment.amount / 100).toFixed(2)} completed successfully via ${payment.method}.`,
      payment,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Payment failed' });
  }
}
