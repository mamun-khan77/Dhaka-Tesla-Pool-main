import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  UserRecord,
  VehicleRecord,
  RideRecord,
  PoolRecord,
  PoolMemberRecord,
  RideStatusHistoryRecord,
  PaymentRecord,
  Role,
  RideStatus,
  PoolStatus,
  PaymentMethod,
  PaymentStatus,
} from '../types/index.ts';

interface DatabaseData {
  users: UserRecord[];
  vehicles: VehicleRecord[];
  rides: RideRecord[];
  pools: PoolRecord[];
  poolMembers: PoolMemberRecord[];
  rideStatusHistory: RideStatusHistoryRecord[];
  payments: PaymentRecord[];
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'dhaka_tesla.json');

class DatabaseStore {
  private data: DatabaseData = {
    users: [],
    vehicles: [],
    rides: [],
    pools: [],
    poolMembers: [],
    rideStatusHistory: [],
    payments: [],
  };

  // Transaction mutex lock to guarantee strict serialized access for pool claims
  private lockPromise: Promise<void> = Promise.resolve();

  constructor() {
    this.ensureInitialized();
  }

  private async acquireLock<T>(action: () => Promise<T> | T): Promise<T> {
    let release: () => void = () => {};
    const currentLock = this.lockPromise;
    this.lockPromise = new Promise<void>((resolve) => {
      release = resolve;
    });

    try {
      await currentLock;
      return await action();
    } finally {
      release();
    }
  }

  private ensureInitialized() {
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch (err) {
        console.warn('Could not create .data directory, running with memory store', err);
      }
    }

    if (fs.existsSync(DATA_FILE)) {
      try {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        console.log('Loaded database from persistent disk file.');
        return;
      } catch (err) {
        console.warn('Error reading persistent database, seeding fresh data.', err);
      }
    }

    this.seedDefaultData();
    this.save();
  }

  public save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.warn('Warning: Could not save database to disk (memory mode active)', err);
    }
  }

  public seedDefaultData() {
    const salt = bcrypt.genSaltSync(10);
    const standardHash = bcrypt.hashSync('DhakaTesla2026!', salt);
    const now = new Date().toISOString();
    const earlier = new Date(Date.now() - 3600000 * 2).toISOString();

    // 1. Users
    const adminUser: UserRecord = {
      id: 'usr-admin-001',
      name: 'Mamun Khan',
      email: 'admin@tesla.dhaka',
      phone: '+8801711000000',
      passwordHash: standardHash,
      role: 'ADMIN',
      createdAt: earlier,
      updatedAt: earlier,
    };

    const jashimDriver: UserRecord = {
      id: 'usr-driver-jashim',
      name: 'Jashim',
      email: 'jashim@tesla.dhaka',
      phone: '+8801711000001',
      passwordHash: standardHash,
      role: 'DRIVER',
      createdAt: earlier,
      updatedAt: earlier,
    };

    const nusratPassenger: UserRecord = {
      id: 'usr-pass-nusrat',
      name: 'Nusrat',
      email: 'nusrat@tesla.dhaka',
      phone: '+8801711000002',
      passwordHash: standardHash,
      role: 'PASSENGER',
      createdAt: earlier,
      updatedAt: earlier,
    };

    const rafiqPassenger: UserRecord = {
      id: 'usr-pass-rafiq',
      name: 'Rafiq',
      email: 'rafiq@tesla.dhaka',
      phone: '+8801711000003',
      passwordHash: standardHash,
      role: 'PASSENGER',
      createdAt: earlier,
      updatedAt: earlier,
    };

    const shirinPassenger: UserRecord = {
      id: 'usr-pass-shirin',
      name: 'Shirin',
      email: 'shirin@tesla.dhaka',
      phone: '+8801711000004',
      passwordHash: standardHash,
      role: 'PASSENGER',
      createdAt: earlier,
      updatedAt: earlier,
    };

    this.data.users = [
      adminUser,
      jashimDriver,
      nusratPassenger,
      rafiqPassenger,
      shirinPassenger,
    ];

    // 2. Vehicle: Bullet (Capacity: 3)
    const bulletVehicle: VehicleRecord = {
      id: 'veh-bullet-001',
      driverId: jashimDriver.id,
      name: 'Bullet',
      model: 'Tesla Model 3 Long Range',
      plateNumber: 'DHAKA-METRO-GA-11-2026',
      capacity: 3, // Exactly 3 seats as requested
      status: 'ACTIVE',
      createdAt: earlier,
      updatedAt: earlier,
    };

    this.data.vehicles = [bulletVehicle];

    // 3. Pool for Bullet
    const demoPool: PoolRecord = {
      id: 'pool-demo-001',
      vehicleId: bulletVehicle.id,
      status: 'OPEN',
      routeSummary: 'Banani -> Mohakhali -> Gulshan 1',
      createdAt: earlier,
      updatedAt: earlier,
    };

    this.data.pools = [demoPool];

    // 4. Initial Rides
    // Ride 1: Nusrat (Banani -> Mohakhali) - matched in demoPool (Occupies 1 seat)
    // Fare: Base 6000 + (2.2 * 2500 = 5500) = 11500; Pool discount (25%) = 2875; Final = 8625 Poisha (৳86.25)
    const nusratRide: RideRecord = {
      id: 'ride-nusrat-001',
      passengerId: nusratPassenger.id,
      pickupArea: 'Banani',
      destinationArea: 'Mohakhali',
      seatsRequested: 1,
      baseFare: 6000,
      distanceCharge: 5500,
      poolDiscount: 2875,
      fare: 8625,
      status: 'MATCHED',
      createdAt: earlier,
      updatedAt: earlier,
    };

    // Ride 2: Rafiq (Banani -> Gulshan 1) - matched in demoPool (Occupies 1 seat)
    // Fare: Base 6000 + (2.8 * 2500 = 7000) = 13000; Pool discount (25%) = 3250; Final = 9750 Poisha (৳97.50)
    const rafiqRide: RideRecord = {
      id: 'ride-rafiq-001',
      passengerId: rafiqPassenger.id,
      pickupArea: 'Banani',
      destinationArea: 'Gulshan 1',
      seatsRequested: 1,
      baseFare: 6000,
      distanceCharge: 7000,
      poolDiscount: 3250,
      fare: 9750,
      status: 'MATCHED',
      createdAt: earlier,
      updatedAt: earlier,
    };

    // At this point, Bullet has 2 occupied seats out of 3. Exactly 1 seat remaining!
    // Shirin is poised to request a ride from Banani -> Gulshan 2 or Mohakhali!

    this.data.rides = [nusratRide, rafiqRide];

    this.data.poolMembers = [
      {
        id: 'pm-001',
        poolId: demoPool.id,
        rideId: nusratRide.id,
        passengerId: nusratPassenger.id,
        seats: 1,
        individualFare: 8625,
        joinedAt: earlier,
      },
      {
        id: 'pm-002',
        poolId: demoPool.id,
        rideId: rafiqRide.id,
        passengerId: rafiqPassenger.id,
        seats: 1,
        individualFare: 9750,
        joinedAt: earlier,
      },
    ];

    this.data.rideStatusHistory = [
      {
        id: 'rsh-001',
        rideId: nusratRide.id,
        status: 'REQUESTED',
        note: 'Ride requested by Nusrat at Banani hub',
        timestamp: earlier,
      },
      {
        id: 'rsh-002',
        rideId: nusratRide.id,
        status: 'MATCHED',
        note: 'Matched to Tesla "Bullet" operated by Jashim',
        timestamp: earlier,
      },
      {
        id: 'rsh-003',
        rideId: rafiqRide.id,
        status: 'REQUESTED',
        note: 'Ride requested by Rafiq at Banani hub',
        timestamp: earlier,
      },
      {
        id: 'rsh-004',
        rideId: rafiqRide.id,
        status: 'MATCHED',
        note: 'Pooled with Nusrat in Tesla "Bullet"',
        timestamp: earlier,
      },
    ];

    this.data.payments = [
      {
        id: 'pay-001',
        rideId: nusratRide.id,
        passengerId: nusratPassenger.id,
        amount: 8625,
        method: 'TESLAPAY',
        status: 'PAID',
        transactionRef: 'TXN-TESLA-882109',
        createdAt: earlier,
      },
      {
        id: 'pay-002',
        rideId: rafiqRide.id,
        passengerId: rafiqPassenger.id,
        amount: 9750,
        method: 'CASH',
        status: 'PENDING',
        createdAt: earlier,
      },
    ];

    console.log('Seeded initial Dhaka Tesla Pool records successfully.');
  }

  // User Operations
  public async findUserByEmail(email: string): Promise<UserRecord | null> {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  public async findUserById(id: string): Promise<UserRecord | null> {
    return this.data.users.find((u) => u.id === id) || null;
  }

  public async getAllUsers(): Promise<UserRecord[]> {
    return [...this.data.users];
  }

  public async createUser(data: Omit<UserRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserRecord> {
    const id = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const newUser: UserRecord = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.data.users.push(newUser);
    this.save();
    return newUser;
  }

  public async updateUser(id: string, updates: Partial<Pick<UserRecord, 'name' | 'phone'>>): Promise<UserRecord | null> {
    const user = this.data.users.find((u) => u.id === id);
    if (!user) return null;
    if (updates.name) user.name = updates.name;
    if (updates.phone) user.phone = updates.phone;
    user.updatedAt = new Date().toISOString();
    this.save();
    return user;
  }

  // Vehicle Operations
  public async findVehicleByDriverId(driverId: string): Promise<VehicleRecord | null> {
    return this.data.vehicles.find((v) => v.driverId === driverId) || null;
  }

  public async findVehicleById(id: string): Promise<VehicleRecord | null> {
    return this.data.vehicles.find((v) => v.id === id) || null;
  }

  public async getAllVehicles(): Promise<VehicleRecord[]> {
    return [...this.data.vehicles];
  }

  public async createVehicle(data: Omit<VehicleRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<VehicleRecord> {
    const id = `veh-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const newVehicle: VehicleRecord = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.data.vehicles.push(newVehicle);
    this.save();
    return newVehicle;
  }

  public async updateVehicle(id: string, updates: Partial<VehicleRecord>): Promise<VehicleRecord | null> {
    const vehicle = this.data.vehicles.find((v) => v.id === id);
    if (!vehicle) return null;
    Object.assign(vehicle, updates, { updatedAt: new Date().toISOString() });
    this.save();
    return vehicle;
  }

  // Ride Operations
  public async findRideById(id: string): Promise<RideRecord | null> {
    return this.data.rides.find((r) => r.id === id) || null;
  }

  public async getRidesByPassengerId(passengerId: string): Promise<RideRecord[]> {
    return this.data.rides.filter((r) => r.passengerId === passengerId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async getAllRides(): Promise<RideRecord[]> {
    return [...this.data.rides].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async getPendingRequests(): Promise<RideRecord[]> {
    return this.data.rides.filter((r) => r.status === 'REQUESTED');
  }

  public async createRide(data: Omit<RideRecord, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<RideRecord> {
    const id = `ride-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const newRide: RideRecord = {
      ...data,
      id,
      status: 'REQUESTED',
      createdAt: now,
      updatedAt: now,
    };
    this.data.rides.push(newRide);
    this.data.rideStatusHistory.push({
      id: `rsh-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      rideId: id,
      status: 'REQUESTED',
      note: 'Ride requested by passenger',
      timestamp: now,
    });
    this.save();
    return newRide;
  }

  public async updateRideStatus(
    rideId: string,
    newStatus: RideStatus,
    note?: string
  ): Promise<{ success: boolean; error?: string; ride?: RideRecord }> {
    const ride = this.data.rides.find((r) => r.id === rideId);
    if (!ride) {
      return { success: false, error: 'Ride not found' };
    }

    // Finite State Machine (FSM) validation:
    // REQUESTED -> MATCHED -> DRIVER_ARRIVED -> STARTED -> COMPLETED
    // Cancellation allowed from REQUESTED or MATCHED only.
    const allowedTransitions: Record<RideStatus, RideStatus[]> = {
      REQUESTED: ['MATCHED', 'CANCELLED'],
      MATCHED: ['DRIVER_ARRIVED', 'CANCELLED'],
      DRIVER_ARRIVED: ['STARTED', 'CANCELLED'],
      STARTED: ['COMPLETED'],
      COMPLETED: [],
      CANCELLED: [],
    };

    const allowed = allowedTransitions[ride.status];
    if (!allowed || !allowed.includes(newStatus)) {
      return {
        success: false,
        error: `Invalid ride state transition from ${ride.status} to ${newStatus}. Permitted next states: [${(allowed || []).join(', ')}]`,
      };
    }

    ride.status = newStatus;
    ride.updatedAt = new Date().toISOString();

    this.data.rideStatusHistory.push({
      id: `rsh-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      rideId,
      status: newStatus,
      note: note || `State transitioned to ${newStatus}`,
      timestamp: new Date().toISOString(),
    });

    // If ride completed, auto mark payment if pending
    if (newStatus === 'COMPLETED') {
      const payment = this.data.payments.find((p) => p.rideId === rideId);
      if (payment && payment.status === 'PENDING') {
        payment.status = 'PAID';
        payment.transactionRef = `TXN-COMP-${Date.now()}`;
      }
    }

    this.save();
    return { success: true, ride };
  }

  // Pool Operations & Concurrency Protection
  public async getAllPools(): Promise<PoolRecord[]> {
    return [...this.data.pools];
  }

  public async findPoolById(id: string): Promise<PoolRecord | null> {
    return this.data.pools.find((p) => p.id === id) || null;
  }

  public async getActivePoolForVehicle(vehicleId: string): Promise<PoolRecord | null> {
    return (
      this.data.pools.find(
        (p) => p.vehicleId === vehicleId && (p.status === 'OPEN' || p.status === 'FULL' || p.status === 'IN_TRANSIT')
      ) || null
    );
  }

  public async getPoolMembers(poolId: string): Promise<PoolMemberRecord[]> {
    return this.data.poolMembers.filter((pm) => pm.poolId === poolId);
  }

  public async getPoolMemberByRideId(rideId: string): Promise<PoolMemberRecord | null> {
    return this.data.poolMembers.find((pm) => pm.rideId === rideId) || null;
  }

  public async getRideStatusHistory(rideId: string): Promise<RideStatusHistoryRecord[]> {
    return this.data.rideStatusHistory.filter((h) => h.rideId === rideId).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  public async createPool(vehicleId: string, initialRouteSummary?: string): Promise<PoolRecord> {
    const id = `pool-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const newPool: PoolRecord = {
      id,
      vehicleId,
      status: 'OPEN',
      routeSummary: initialRouteSummary,
      createdAt: now,
      updatedAt: now,
    };
    this.data.pools.push(newPool);
    this.save();
    return newPool;
  }

  /**
   * CRITICAL CONCURRENCY & SEAT CAPACITY METHOD:
   * Adds a passenger/ride to an existing pool with a mutex lock to guarantee that
   * two near-simultaneous seat claims (e.g. Nusrat and Shirin fighting for the 3rd seat)
   * can NEVER overbook the vehicle!
   */
  public async addMemberToPoolAtomic(
    poolId: string,
    rideId: string,
    passengerId: string,
    seatsRequested: number,
    individualFare: number
  ): Promise<{ success: boolean; error?: string; poolMember?: PoolMemberRecord; pool?: PoolRecord }> {
    return this.acquireLock(async () => {
      const pool = this.data.pools.find((p) => p.id === poolId);
      if (!pool) {
        return { success: false, error: 'Target pool not found' };
      }

      if (pool.status !== 'OPEN') {
        return { success: false, error: `Pool is currently ${pool.status} and cannot accept new passengers.` };
      }

      const vehicle = this.data.vehicles.find((v) => v.id === pool.vehicleId);
      if (!vehicle) {
        return { success: false, error: 'Vehicle associated with pool not found' };
      }

      // Calculate current occupied seats
      const currentMembers = this.data.poolMembers.filter((pm) => pm.poolId === poolId);
      const occupiedSeats = currentMembers.reduce((sum, member) => sum + member.seats, 0);
      const availableSeats = vehicle.capacity - occupiedSeats;

      if (seatsRequested > availableSeats) {
        return {
          success: false,
          error: `Capacity exceeded! Vehicle "${vehicle.name}" has only ${availableSeats} seat(s) remaining out of ${vehicle.capacity}. Requested: ${seatsRequested}. Overbooking strictly prevented.`,
        };
      }

      // Check if ride is already in a pool
      const existingMember = this.data.poolMembers.find((pm) => pm.rideId === rideId);
      if (existingMember) {
        return { success: false, error: 'This ride has already been assigned to a pool' };
      }

      // Create pool member
      const memberId = `pm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const now = new Date().toISOString();
      const newMember: PoolMemberRecord = {
        id: memberId,
        poolId,
        rideId,
        passengerId,
        seats: seatsRequested,
        individualFare,
        joinedAt: now,
      };

      this.data.poolMembers.push(newMember);

      // Check if pool is now full
      const newOccupied = occupiedSeats + seatsRequested;
      if (newOccupied >= vehicle.capacity) {
        pool.status = 'FULL';
      }
      pool.updatedAt = now;

      // Update ride status to MATCHED and apply pool discount
      const ride = this.data.rides.find((r) => r.id === rideId);
      if (ride) {
        ride.status = 'MATCHED';
        ride.fare = individualFare;
        ride.updatedAt = now;
        this.data.rideStatusHistory.push({
          id: `rsh-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          rideId,
          status: 'MATCHED',
          note: `Matched to pool ${poolId} in vehicle "${vehicle.name}" (${newOccupied}/${vehicle.capacity} seats occupied)`,
          timestamp: now,
        });
      }

      this.save();
      return { success: true, poolMember: newMember, pool };
    });
  }

  // Payment Operations
  public async createPayment(data: Omit<PaymentRecord, 'id' | 'createdAt'>): Promise<PaymentRecord> {
    const id = `pay-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newPayment: PaymentRecord = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
    };
    this.data.payments.push(newPayment);
    this.save();
    return newPayment;
  }

  public async getPaymentsByRideId(rideId: string): Promise<PaymentRecord[]> {
    return this.data.payments.filter((p) => p.rideId === rideId);
  }

  public async getAllPayments(): Promise<PaymentRecord[]> {
    return [...this.data.payments];
  }

  // System Stats for Admin
  public async getSystemStatistics() {
    const totalUsers = this.data.users.length;
    const totalPassengers = this.data.users.filter((u) => u.role === 'PASSENGER').length;
    const totalDrivers = this.data.users.filter((u) => u.role === 'DRIVER').length;
    const totalVehicles = this.data.vehicles.length;
    const totalRides = this.data.rides.length;
    const activePools = this.data.pools.filter((p) => p.status === 'OPEN' || p.status === 'FULL' || p.status === 'IN_TRANSIT').length;
    const completedRides = this.data.rides.filter((r) => r.status === 'COMPLETED').length;
    const cancelledRides = this.data.rides.filter((r) => r.status === 'CANCELLED').length;
    const totalRevenuePoisha = this.data.rides
      .filter((r) => r.status === 'COMPLETED')
      .reduce((sum, r) => sum + r.fare, 0);

    return {
      totalUsers,
      totalPassengers,
      totalDrivers,
      totalVehicles,
      totalRides,
      activePools,
      completedRides,
      cancelledRides,
      totalRevenuePoisha,
      totalRevenueFormatted: `৳${(totalRevenuePoisha / 100).toFixed(2)}`,
    };
  }

  // Reset database for tests
  public resetToSeed() {
    this.data = {
      users: [],
      vehicles: [],
      rides: [],
      pools: [],
      poolMembers: [],
      rideStatusHistory: [],
      payments: [],
    };
    this.seedDefaultData();
    this.save();
  }
}

export const db = new DatabaseStore();
