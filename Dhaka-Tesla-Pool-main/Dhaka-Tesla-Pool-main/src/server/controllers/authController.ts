import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '../db/store.ts';
import { generateToken, AuthenticatedRequest } from '../middleware/auth.ts';
import { Role } from '../types/index.ts';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email address is required'),
  phone: z.string().min(8, 'Phone number must be at least 8 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['PASSENGER', 'DRIVER']).default('PASSENGER'),
});

const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issues = (parseResult.error as any).issues || (parseResult.error as any).errors || [];
      res.status(400).json({
        success: false,
        error: issues.map((e: any) => e.message).join(', ') || 'Validation failed',
      });
      return;
    }

    const { name, email, phone, password, role } = parseResult.data;

    const existingUser = await db.findUserByEmail(email);
    if (existingUser) {
      res.status(409).json({
        success: false,
        error: 'An account with this email address already exists.',
      });
      return;
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const newUser = await db.createUser({
      name,
      email,
      phone,
      passwordHash,
      role: role as Role,
    });

    // If driver, register a default vehicle if none exists
    if (role === 'DRIVER') {
      await db.createVehicle({
        driverId: newUser.id,
        name: `${newUser.name}'s Tesla`,
        model: 'Tesla Model 3 Long Range',
        plateNumber: `DHAKA-METRO-GA-${Math.floor(10 + Math.random() * 89)}-2026`,
        capacity: 3,
        status: 'ACTIVE',
      });
    }

    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Registration failed due to a server error.' });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issues = (parseResult.error as any).issues || (parseResult.error as any).errors || [];
      res.status(400).json({
        success: false,
        error: issues.map((e: any) => e.message).join(', ') || 'Validation failed',
      });
      return;
    }

    const { email, password } = parseResult.data;

    const user = await db.findUserByEmail(email);
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
      });
      return;
    }

    const validPassword = bcrypt.compareSync(password, user.passwordHash);
    if (!validPassword) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
      });
      return;
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Login failed due to a server error.' });
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  // Get associated vehicle if driver
  let vehicle = null;
  if (req.user.role === 'DRIVER') {
    vehicle = await db.findVehicleByDriverId(req.user.id);
  }

  res.json({
    success: true,
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      role: req.user.role,
    },
    vehicle,
  });
}

export async function logout(_req: Request, res: Response): Promise<void> {
  res.json({ success: true, message: 'Logged out successfully' });
}

export async function firebaseSync(req: Request, res: Response): Promise<void> {
  try {
    const { email, name, role = 'PASSENGER', phone = '+880 1700-000000' } = req.body;

    if (!email) {
      res.status(400).json({ success: false, error: 'Email is required for Firebase sync.' });
      return;
    }

    let user = await db.findUserByEmail(email);

    if (!user) {
      // Create new user for this Firebase Google Sign-In user
      const dummyPasswordHash = await bcrypt.hash(`Firebase_${email}_${Date.now()}`, 10);
      user = await db.createUser({
        name: name || email.split('@')[0],
        email,
        phone,
        passwordHash: dummyPasswordHash,
        role: role === 'DRIVER' || role === 'ADMIN' ? role : 'PASSENGER',
      });
    }

    const token = generateToken(user);

    let vehicle = null;
    if (user.role === 'DRIVER') {
      vehicle = await db.findVehicleByDriverId(user.id);
    }

    res.json({
      success: true,
      message: 'Firebase user synced successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      vehicle,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Firebase sync failed.' });
  }
}

