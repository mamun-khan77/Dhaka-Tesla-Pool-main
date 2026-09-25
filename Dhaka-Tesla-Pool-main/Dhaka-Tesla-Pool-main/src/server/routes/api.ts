import { Router } from 'express';
import {
  register,
  login,
  logout,
  getMe,
  firebaseSync,
} from '../controllers/authController.ts';
import {
  chatWithGemini,
  mapsGroundingSearch,
} from '../controllers/geminiController.ts';
import {
  createRide,
  getRides,
  getRideById,
  cancelRide,
  payRide,
  estimateFare,
} from '../controllers/rideController.ts';
import {
  getDriverDashboard,
  toggleVehicleStatus,
  acceptRide,
  markDriverArrived,
  startRide,
  completeRide,
} from '../controllers/driverController.ts';
import {
  getAllPools,
  getPoolById,
  joinPool,
} from '../controllers/poolController.ts';
import {
  getAdminStats,
  getAdminUsers,
  getAdminRides,
  getAdminVehicles,
  resetDatabase,
} from '../controllers/adminController.ts';
import { authMiddleware, requireRole } from '../middleware/auth.ts';
import { DHAKA_LOCATIONS } from '../services/dhakaRouting.ts';

export const apiRouter = Router();

// Public / Utility Routes
apiRouter.get('/dhaka/locations', (_req, res) => {
  res.json({
    success: true,
    locations: Object.values(DHAKA_LOCATIONS),
  });
});

// Auth Routes
apiRouter.post('/auth/register', register);
apiRouter.post('/auth/login', login);
apiRouter.post('/auth/logout', logout);
apiRouter.get('/auth/me', authMiddleware, getMe);
apiRouter.post('/auth/firebase-sync', firebaseSync);

// Gemini AI & Maps Grounding Routes
apiRouter.post('/gemini/chat', chatWithGemini);
apiRouter.post('/gemini/maps-grounding', mapsGroundingSearch);

// Passenger / Ride Routes
apiRouter.post('/rides/estimate', authMiddleware, estimateFare);
apiRouter.post('/rides', authMiddleware, requireRole('PASSENGER', 'ADMIN'), createRide);
apiRouter.get('/rides', authMiddleware, getRides);
apiRouter.get('/rides/:id', authMiddleware, getRideById);
apiRouter.patch('/rides/:id/cancel', authMiddleware, cancelRide);
apiRouter.post('/rides/:id/pay', authMiddleware, payRide);

// Driver Routes
apiRouter.get('/driver/dashboard', authMiddleware, requireRole('DRIVER', 'ADMIN'), getDriverDashboard);
apiRouter.patch('/driver/status', authMiddleware, requireRole('DRIVER', 'ADMIN'), toggleVehicleStatus);
apiRouter.post('/driver/rides/:id/accept', authMiddleware, requireRole('DRIVER', 'ADMIN'), acceptRide);
apiRouter.patch('/driver/rides/:id/arrived', authMiddleware, requireRole('DRIVER', 'ADMIN'), markDriverArrived);
apiRouter.patch('/driver/rides/:id/start', authMiddleware, requireRole('DRIVER', 'ADMIN'), startRide);
apiRouter.patch('/driver/rides/:id/complete', authMiddleware, requireRole('DRIVER', 'ADMIN'), completeRide);

// Pool Routes
apiRouter.get('/pools', getAllPools);
apiRouter.get('/pools/:id', getPoolById);
apiRouter.post('/pools/:id/join', authMiddleware, joinPool);

// Admin Routes
apiRouter.get('/admin/statistics', authMiddleware, requireRole('ADMIN'), getAdminStats);
apiRouter.get('/admin/users', authMiddleware, requireRole('ADMIN'), getAdminUsers);
apiRouter.get('/admin/rides', authMiddleware, requireRole('ADMIN'), getAdminRides);
apiRouter.get('/admin/vehicles', authMiddleware, requireRole('ADMIN'), getAdminVehicles);
apiRouter.post('/admin/reset', authMiddleware, requireRole('ADMIN'), resetDatabase);
