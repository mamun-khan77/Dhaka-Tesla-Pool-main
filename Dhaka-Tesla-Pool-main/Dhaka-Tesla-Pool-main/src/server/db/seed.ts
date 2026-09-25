import { db } from './store.ts';

async function seed() {
  console.log('Seeding Dhaka Tesla Pool database with realistic seed data...');
  db.resetToSeed();
  console.log('Seed completed successfully!');
  console.log('--- Characters Seeded ---');
  console.log('Driver: Jashim (Bullet - 3 seats)');
  console.log('Passengers: Nusrat, Rafiq, Shirin');
  console.log('Admin: Mamun Khan (admin@tesla.dhaka)');
  console.log('Default Password for all: DhakaTesla2026!');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
