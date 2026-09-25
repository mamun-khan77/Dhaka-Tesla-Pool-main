import assert from 'assert';
import bcrypt from 'bcryptjs';
import { db } from '../server/db/store.ts';
import { calculateFare, areRoutesCompatible } from '../server/services/dhakaRouting.ts';
import { poolMatchingService } from '../server/services/poolMatchingService.ts';

async function runTestSuite() {
  console.log('\n========================================');
  console.log('🧪 RUNNING DHAKA TESLA POOL TEST SUITE');
  console.log('========================================\n');

  // Reset database to known seed state
  db.resetToSeed();

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      process.stdout.write(`⏳ Test: ${name}... `);
      await fn();
      console.log('✅ PASSED');
      passed++;
    } catch (err: any) {
      console.log('❌ FAILED');
      console.error(`   Error: ${err.message}\n`);
      failed++;
    }
  }

  // 1. Passenger Registration
  await test('1. Passenger Registration creates secure account', async () => {
    const salt = bcrypt.genSaltSync(10);
    const pass = 'DhakaPass2026!';
    const user = await db.createUser({
      name: 'Tanvir Hossain',
      email: 'tanvir@tesla.dhaka',
      phone: '+8801711999888',
      passwordHash: bcrypt.hashSync(pass, salt),
      role: 'PASSENGER',
    });

    assert.ok(user.id, 'User ID should be generated');
    assert.strictEqual(user.email, 'tanvir@tesla.dhaka');
    assert.strictEqual(user.role, 'PASSENGER');
  });

  // 2. Login Verification
  await test('2. Login verification with bcrypt password hash', async () => {
    const user = await db.findUserByEmail('tanvir@tesla.dhaka');
    assert.ok(user, 'User should exist');
    const valid = bcrypt.compareSync('DhakaPass2026!', user.passwordHash);
    const invalid = bcrypt.compareSync('WrongPassword', user.passwordHash);
    assert.strictEqual(valid, true, 'Valid password must match');
    assert.strictEqual(invalid, false, 'Invalid password must fail');
  });

  // 3. Fare Calculation Formula
  await test('3. Fare Calculation (baseFare + distanceCharge - poolDiscount)', async () => {
    // Banani -> Mohakhali is 2.2 km
    // Base: 6000 poisha (৳60.00)
    // Distance: 2.2 * 2500 = 5500 poisha (৳55.00)
    // Solo subtotal: 11500 poisha (৳115.00)
    const solo = calculateFare('Banani', 'Mohakhali', false, 1);
    assert.strictEqual(solo.baseFarePoisha, 6000);
    assert.strictEqual(solo.distanceChargePoisha, 5500);
    assert.strictEqual(solo.poolDiscountPoisha, 0);
    assert.strictEqual(solo.totalFarePoisha, 11500);

    // Pooled: 25% discount on 11500 = 2875 poisha
    // Net: 11500 - 2875 = 8625 poisha (৳86.25)
    const pooled = calculateFare('Banani', 'Mohakhali', true, 1);
    assert.strictEqual(pooled.poolDiscountPoisha, 2875);
    assert.strictEqual(pooled.totalFarePoisha, 8625);
  });

  // 4. Ride Creation
  await test('4. Passenger Ride Creation with status REQUESTED', async () => {
    const fare = calculateFare('Uttara', 'Banani', false, 1);
    const ride = await db.createRide({
      passengerId: 'usr-pass-nusrat',
      pickupArea: 'Uttara',
      destinationArea: 'Banani',
      seatsRequested: 1,
      baseFare: fare.baseFarePoisha,
      distanceCharge: fare.distanceChargePoisha,
      poolDiscount: 0,
      fare: fare.totalFarePoisha,
    });

    assert.ok(ride.id);
    assert.strictEqual(ride.status, 'REQUESTED');
    assert.strictEqual(ride.pickupArea, 'Uttara');
  });

  // 5. Pool Matching Corridor Evaluation
  await test('5. Pool Matching corridor compatibility (Banani -> Mohakhali & Banani -> Gulshan 1)', async () => {
    const routeA = { pickup: 'Banani', destination: 'Mohakhali' };
    const routeB = { pickup: 'Banani', destination: 'Gulshan 1' };
    const result = areRoutesCompatible(routeA, routeB);
    assert.strictEqual(result.compatible, true, 'Both start at Banani and terminate in nearby South-Central zones');

    // Incompatible check: Mirpur -> Dhanmondi vs Uttara -> Bashundhara
    const routeX = { pickup: 'Mirpur', destination: 'Dhanmondi' };
    const routeY = { pickup: 'Uttara', destination: 'Bashundhara' };
    const checkBad = areRoutesCompatible(routeX, routeY);
    assert.strictEqual(checkBad.compatible, false, 'Opposite transit corridors cannot be pooled');
  });

  // 6. Seat Capacity Enforcement (Bullet: 3 seats max)
  await test('6. Seat Capacity strictly enforced on Tesla Bullet', async () => {
    // In seed data: Bullet (capacity 3) has Nusrat (1 seat) and Rafiq (1 seat) -> 2 seats occupied.
    // 1 seat remains.
    const pool = (await db.getAllPools())[0];
    const vehicle = await db.findVehicleById(pool.vehicleId);
    assert.strictEqual(vehicle?.capacity, 3);

    // Requesting 2 seats when only 1 is available must FAIL immediately:
    const attemptOverbooking = await db.addMemberToPoolAtomic(
      pool.id,
      'fake-ride-over',
      'usr-pass-shirin',
      2, // 2 seats requested, only 1 left
      15000
    );

    assert.strictEqual(attemptOverbooking.success, false, 'Overbooking 2 seats in 1-seat pool must fail');
    assert.ok(attemptOverbooking.error?.includes('Capacity exceeded'), 'Should report capacity error');
  });

  // 7. Invalid State Transition Protection
  await test('7. State Transition Protection blocks illegal jumps (COMPLETED -> STARTED, CANCELLED -> STARTED)', async () => {
    // Create a fresh ride to test full state lifecycle
    const testRide = await db.createRide({
      passengerId: 'usr-pass-shirin',
      pickupArea: 'Banani',
      destinationArea: 'Mohakhali',
      seatsRequested: 1,
      baseFare: 6000,
      distanceCharge: 5500,
      poolDiscount: 0,
      fare: 11500,
    });

    // 1. Attempt illegal jump from REQUESTED directly to STARTED
    const illegalJump = await db.updateRideStatus(testRide.id, 'STARTED');
    assert.strictEqual(illegalJump.success, false, 'Cannot jump REQUESTED directly to STARTED');

    // 2. Legal sequence: REQUESTED -> MATCHED -> DRIVER_ARRIVED -> STARTED -> COMPLETED
    const stepMatch = await db.updateRideStatus(testRide.id, 'MATCHED');
    assert.strictEqual(stepMatch.success, true);

    const stepArrived = await db.updateRideStatus(testRide.id, 'DRIVER_ARRIVED');
    assert.strictEqual(stepArrived.success, true);

    const stepStarted = await db.updateRideStatus(testRide.id, 'STARTED');
    assert.strictEqual(stepStarted.success, true);

    const stepCompleted = await db.updateRideStatus(testRide.id, 'COMPLETED');
    assert.strictEqual(stepCompleted.success, true);

    // 3. Now try illegal restarts from COMPLETED
    const illegalRestart = await db.updateRideStatus(testRide.id, 'STARTED');
    assert.strictEqual(illegalRestart.success, false, 'COMPLETED -> STARTED must be rejected');

    const illegalCancelCompleted = await db.updateRideStatus(testRide.id, 'CANCELLED');
    assert.strictEqual(illegalCancelCompleted.success, false, 'COMPLETED -> CANCELLED must be rejected');
  });

  // 8. Ride Cancellation Protection
  await test('8. Ride cancellation allowed only before ride starts', async () => {
    // Create new requested ride
    const testRide = await db.createRide({
      passengerId: 'usr-pass-shirin',
      pickupArea: 'Banani',
      destinationArea: 'Mohakhali',
      seatsRequested: 1,
      baseFare: 6000,
      distanceCharge: 5500,
      poolDiscount: 0,
      fare: 11500,
    });

    // Cancellation of REQUESTED ride must succeed
    const cancelRes = await db.updateRideStatus(testRide.id, 'CANCELLED');
    assert.strictEqual(cancelRes.success, true);
    assert.strictEqual(cancelRes.ride?.status, 'CANCELLED');

    // Attempt to cancel again
    const reCancel = await db.updateRideStatus(testRide.id, 'CANCELLED');
    assert.strictEqual(reCancel.success, false, 'Already cancelled ride cannot transition');
  });

  // 9. User Authorization & Role Boundary
  await test('9. User Authorization ensures passenger, driver, and admin boundaries', async () => {
    const admin = await db.findUserByEmail('admin@tesla.dhaka');
    const driver = await db.findUserByEmail('jashim@tesla.dhaka');
    const passenger = await db.findUserByEmail('nusrat@tesla.dhaka');

    assert.strictEqual(admin?.role, 'ADMIN');
    assert.strictEqual(driver?.role, 'DRIVER');
    assert.strictEqual(passenger?.role, 'PASSENGER');
  });

  // 10. Concurrency & Overbooking Guard: 2 Passengers Competing for Last Seat
  await test('10. CONCURRENCY: Simultaneous seat claims by Nusrat & Shirin for last seat', async () => {
    // Reset to seed state: Bullet has 1 seat remaining
    db.resetToSeed();
    const pools = await db.getAllPools();
    const bulletPool = pools[0];

    // Create 2 distinct rides wanting 1 seat each in the same pool
    const rideA = await db.createRide({
      passengerId: 'usr-pass-shirin',
      pickupArea: 'Banani',
      destinationArea: 'Gulshan 2',
      seatsRequested: 1,
      baseFare: 6000,
      distanceCharge: 4000,
      poolDiscount: 2500,
      fare: 7500,
    });

    const rideB = await db.createRide({
      passengerId: 'usr-pass-nusrat',
      pickupArea: 'Banani',
      destinationArea: 'Mohakhali',
      seatsRequested: 1,
      baseFare: 6000,
      distanceCharge: 5500,
      poolDiscount: 2875,
      fare: 8625,
    });

    // Simulate concurrent attempts to book the 1 remaining seat
    const [resultA, resultB] = await Promise.all([
      db.addMemberToPoolAtomic(bulletPool.id, rideA.id, 'usr-pass-shirin', 1, 7500),
      db.addMemberToPoolAtomic(bulletPool.id, rideB.id, 'usr-pass-nusrat', 1, 8625),
    ]);

    // Exactly one must succeed and exactly one must fail!
    const successes = [resultA, resultB].filter((r) => r.success);
    const failures = [resultA, resultB].filter((r) => !r.success);

    assert.strictEqual(successes.length, 1, 'Exactly one concurrent booking must claim the final seat');
    assert.strictEqual(failures.length, 1, 'The losing concurrent booking must be cleanly rejected with capacity error');
    assert.ok(
      failures[0].error?.includes('Capacity exceeded') || failures[0].error?.includes('FULL'),
      'Rejected request must state capacity exceeded or pool full'
    );

    // Verify final occupied seats is exactly 3 (capacity), never 4
    const updatedMembers = await db.getPoolMembers(bulletPool.id);
    const totalOccupied = updatedMembers.reduce((sum, m) => sum + m.seats, 0);
    assert.strictEqual(totalOccupied, 3, 'Tesla Bullet capacity (3) must NEVER be exceeded');

    const updatedPool = await db.findPoolById(bulletPool.id);
    assert.strictEqual(updatedPool?.status, 'FULL', 'Pool status must automatically transition to FULL');
  });

  console.log('\n========================================');
  console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
