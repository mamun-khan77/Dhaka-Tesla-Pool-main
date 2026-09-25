# 🚕 Dhaka Tesla Pool

> **“Share a seat. Split the fare. Survive Dhaka traffic.”**
>
> A production-grade electric ride-pooling platform connecting Dhaka's high-density commercial corridors with strict seat capacity enforcement, transparent formula-based pricing, and real-time transit pooling.

[![Tests](https://img.shields.io/badge/Tests-10%2F10%20Passing-emerald)](https://github.com)
[![Capacity](https://img.shields.io/badge/Seat%20Capacity-Strict%203%20Max-cyan)](https://github.com)
[![Status](https://img.shields.io/badge/Full--Stack-Node.js%20%7C%20React%2019%20%7C%20Prisma%20%7C%20Docker-blue)](https://github.com)
[![License](https://img.shields.io/badge/Credit-Mamun%20Khan-purple)](https://aamkhan.vercel.app/)

---

## 1. Project Overview & Problem Statement

Dhaka suffers from some of the most grueling traffic congestion in the world. Solo commuters frequently hire entire vehicles or fight for single rideshares, paying excessive surge multipliers while adding single-occupant cars to congested corridors like **Airport Road, Kemal Ataturk Avenue, Gulshan Avenue, and Mirpur Road**.

**Dhaka Tesla Pool** solves this with an electric corridor-pooling paradigm:
1. **Shared Corridors**: Commuters heading along parallel paths (e.g., Banani to Mohakhali, Banani to Gulshan 1) are matched into the same silent, zero-emission Tesla.
2. **Strict Capacity Protection**: A strict 3-passenger maximum is enforced at the database level with atomic locks. Overbooking is physically impossible.
3. **Transparent Pricing**: Fares are mathematically computed without surge pricing:
   $$\text{passengerFare} = \text{baseFare} + \text{distanceCharge} - \text{poolDiscount}$$
   Pooled riders automatically receive a **25% discount**.
4. **Three Independent Portals**: Passenger booking & history, Driver ("Jashim") console with Tesla "Bullet", and Admin ("Mamun Khan") metrics console.

---

## 2. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Client Layer (Browser)                        │
│  - React 19 SPA + TypeScript + Tailwind CSS                             │
│  - Interactive Dhaka Corridor Map (SVG Node Graph)                      │
│  - Passenger Booking & Real-Time Stepper UI                             │
│  - Driver Portal ("Bullet" 3-Seat Occupancy Visualizer)                │
│  - Admin Metrics & Database Inspection Console                          │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTP / REST / JWT Bearer
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      Backend API Layer (Node.js & Express)              │
│  - Express.js REST Router (/api/auth, /api/rides, /api/driver, /pools)  │
│  - JWT Authentication & Bcrypt Password Hashing                         │
│  - Role-Based Access Control (PASSENGER, DRIVER, ADMIN)                 │
│  - Route Vector Compatibility Service (Dhaka Corridor Rules)            │
│  - Transparent Fare Engine (Poisha Integer Math)                        │
│  - Atomic Concurrency Mutex (Simultaneous Overbooking Prevention)       │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    Data & Persistence Layer (Prisma ORM)                │
│  - PostgreSQL (Docker Compose Production)                               │
│  - Unified Transactional Repository with Atomic Row Locks               │
│  - Relations: User, Vehicle, Ride, Pool, PoolMember, StatusHistory, Pay │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Entity-Relationship Diagram (ERD)

```
   ┌──────────────────┐               1:N             ┌──────────────────┐
   │       User       ├──────────────────────────────►│     Vehicle      │
   │──────────────────│                               │──────────────────│
   │ id (PK)          │                               │ id (PK)          │
   │ name             │                               │ driverId (FK)    │
   │ email (Unique)   │                               │ name ("Bullet")  │
   │ phone            │                               │ capacity (3 Max) │
   │ passwordHash     │                               │ status (ACTIVE)  │
   │ role (ENUM)      │                               └────────┬─────────┘
   └────────┬─────────┘                                        │
            │                                                  │ 1:N
            │ 1:N                                              ▼
            │                                         ┌──────────────────┐
            ▼                                         │       Pool       │
   ┌──────────────────┐                               │──────────────────│
   │       Ride       │                               │ id (PK)          │
   │──────────────────│                               │ vehicleId (FK)   │
   │ id (PK)          │                               │ status (OPEN)    │
   │ passengerId (FK) │                               │ routeSummary     │
   │ pickupArea       │                               └────────┬─────────┘
   │ destinationArea  │                                        │
   │ seatsRequested   │                                        │ 1:N
   │ baseFare         │                                        │
   │ distanceCharge   │                                        ▼
   │ poolDiscount     │      1:1                      ┌──────────────────┐
   │ fare (Poisha)    ├──────────────────────────────►│    PoolMember    │
   │ status (ENUM)    │                               │──────────────────│
   └────────┬─────────┘                               │ id (PK)          │
            │                                         │ poolId (FK)      │
            │ 1:N                                     │ rideId (FK-Uniq) │
            ├──────────────────────┐                  │ passengerId (FK) │
            ▼                      ▼                  │ seats (1-3)      │
   ┌──────────────────┐   ┌──────────────────┐        │ individualFare   │
   │  StatusHistory   │   │     Payment      │        └──────────────────┘
   │──────────────────│   │──────────────────│
   │ id (PK)          │   │ id (PK)          │
   │ rideId (FK)      │   │ rideId (FK)      │
   │ status (ENUM)    │   │ amount (Poisha)  │
   │ note             │   │ method (CASH/TP) │
   │ timestamp        │   │ status (PAID)    │
   └──────────────────┘   └──────────────────┘
```

---

## 4. Dhaka Corridor Compatibility & Pooling Algorithm

Instead of relying on external map APIs, Dhaka Tesla Pool uses predefined commercial nodes and transit corridors:

### Supported Locations
* **Banani** (Central Commercial Spine)
* **Gulshan 1** (South Financial District)
* **Gulshan 2** (North Diplomatic District)
* **Mohakhali** (Central Transit Hub / Flyover)
* **Dhanmondi** (South-West Spine)
* **Mirpur** (North-West Metro Link)
* **Uttara** (Northern Gateway)
* **Farmgate** (Central Metro Interchange)
* **Bashundhara** (East Hub / Kuril Interchange)

### Corridor Matching Rules
1. **Exact Vector**: If Route A and Route B share origin and destination.
2. **Hub Dropoff Cluster**: If Route A and Route B share pickup (`Banani`) and their destinations are in adjacent clusters (`Mohakhali` vs `Gulshan 1`, $\le 3.5\text{ km}$ apart).
3. **En-Route Stop**: If Route B's pickup lies on Route A's direct transit corridor with $\le 25\%$ detour margin (e.g. `Uttara` $\to$ `Mohakhali` with pickup at `Banani`).
4. **Capacity Gate**: Remaining seats in the vehicle must be $\ge \text{seatsRequested}$.

---

## 5. Transparent Fare Calculation Formula

All monetary values are stored in integer **Poisha** (100 Poisha = ৳1.00 BDT) to prevent floating-point rounding errors:

$$\text{passengerFare} = \text{baseFare} + \text{distanceCharge} - \text{poolDiscount}$$

* **Base Fare**: ৳60.00 (6,000 Poisha)
* **Distance Charge**: ৳25.00 / km (2,500 Poisha / km)
* **Pool Discount**: **25% discount** applied when pooled with other commuters
* **Example (Banani $\to$ Mohakhali, 2.2 km)**:
  * Base: $6,000$ Poisha
  * Distance: $2.2 \times 2,500 = 5,500$ Poisha
  * Subtotal: $11,500$ Poisha ($৳115.00$)
  * **25% Pool Discount**: $-2,875$ Poisha
  * **Total Pooled Fare**: **$8,625$ Poisha ($৳86.25$)**

---

## 6. Finite State Machine (FSM) Protection

The ride lifecycle is strictly enforced:
$$\text{REQUESTED} \longrightarrow \text{MATCHED} \longrightarrow \text{DRIVER\_ARRIVED} \longrightarrow \text{STARTED} \longrightarrow \text{COMPLETED}$$

* **Cancellation** is permitted only during `REQUESTED` or `MATCHED` before the driver has arrived.
* Illegal backward or terminal jumps (such as `COMPLETED` $\to$ `STARTED`, or `CANCELLED` $\to$ `STARTED`) are rejected by the backend with HTTP `400 Bad Request`.

---

## 7. Concurrency & Overbooking Guard

When a vehicle like Tesla "Bullet" has only 1 available seat remaining, two commuters (e.g., Nusrat and Shirin) might attempt to book the final seat at the same millisecond.

* The backend uses an **atomic transaction mutex**:
  1. Serializes pool seat allocations.
  2. Queries `occupiedSeats = sum(poolMember.seats)`.
  3. Validates `occupiedSeats + requestedSeats <= vehicle.capacity`.
  4. If capacity is exceeded, the request is rejected with `409 Conflict` ("Capacity exceeded").
  5. Vehicle status updates to `FULL` automatically.
* Verified by automated test #10 in `src/tests/suite.ts`.

---

## 8. Demo Characters & Credentials

The platform is pre-seeded with realistic Dhaka commuters and driver:

| Persona | Name | Role | Email | Password | Notes |
|---|---|---|---|---|---|
| **Driver** | **Jashim** | `DRIVER` | `jashim@tesla.dhaka` | `DhakaTesla2026!` | Operates Tesla "Bullet" (3 Seats) |
| **Rider 1** | **Nusrat** | `PASSENGER` | `nusrat@tesla.dhaka` | `DhakaTesla2026!` | Banani $\to$ Mohakhali (In Pool) |
| **Rider 2** | **Rafiq** | `PASSENGER` | `rafiq@tesla.dhaka` | `DhakaTesla2026!` | Banani $\to$ Gulshan 1 (In Pool) |
| **Rider 3** | **Shirin** | `PASSENGER` | `shirin@tesla.dhaka` | `DhakaTesla2026!` | Ready to claim 3rd seat |
| **Admin** | **Mamun Khan** | `ADMIN` | `admin@tesla.dhaka` | `DhakaTesla2026!` | Full metrics & DB reset access |

> The UI also includes a **1-Click Demo Persona Switcher** in the navigation and authentication modal for instant review.

---

## 9. API Reference

### Authentication
* `POST /api/auth/register` — Create Passenger or Driver account
* `POST /api/auth/login` — Sign in and obtain JWT
* `GET /api/auth/me` — Retrieve active authenticated user and vehicle
* `POST /api/auth/logout` — Revoke session

### Rides & Passengers
* `POST /api/rides/estimate` — Calculate transparent solo vs pooled fare
* `POST /api/rides` — Submit ride request and trigger pool matching
* `GET /api/rides` — Fetch passenger's own ride history (strictly private)
* `GET /api/rides/:id` — View ride details, co-passengers, driver, and audit history
* `PATCH /api/rides/:id/cancel` — Cancel ride (if allowed by FSM)
* `POST /api/rides/:id/pay` — Settle ride via CASH or TESLAPAY

### Driver
* `GET /api/driver/dashboard` — Driver stats, seat occupancy, and pending requests
* `PATCH /api/driver/status` — Toggle ONLINE / OFFLINE
* `POST /api/driver/rides/:id/accept` — Accept ride into Tesla pool
* `PATCH /api/driver/rides/:id/arrived` — Transition to `DRIVER_ARRIVED`
* `PATCH /api/driver/rides/:id/start` — Transition to `STARTED`
* `PATCH /api/driver/rides/:id/complete` — Transition to `COMPLETED`

### Pools & Admin
* `GET /api/pools` — List all active Tesla pools and seat gauges
* `POST /api/pools/:id/join` — Directly claim seat in a pool
* `GET /api/admin/statistics` — KPI summary (rides, users, revenue, active pools)
* `GET /api/admin/rides` — Inspect all rides across platform
* `GET /api/admin/users` — Inspect all accounts
* `POST /api/admin/reset` — Reset database to initial seed state

---

## 10. Automated Test Suite (10/10 Passing)

Run tests locally:
```bash
npm test
```

The test suite validates all 10 core constraints:
1. `Passenger Registration`: Creates secure account with salted hash
2. `Login Verification`: Validates password hash against bcrypt
3. `Fare Calculation`: Exact mathematical formula matching base + distance - discount
4. `Ride Creation`: Sets status to `REQUESTED`
5. `Pool Matching`: Corridor vector evaluation (Banani $\to$ Mohakhali + Banani $\to$ Gulshan 1)
6. `Seat Capacity Enforcement`: Bullet rejects 2 seats when only 1 is free
7. `State Transition Protection`: Rejects illegal jumps (`COMPLETED` $\to$ `STARTED`, `CANCELLED` $\to$ `STARTED`)
8. `Ride Cancellation`: Restricts cancellation to allowed states
9. `User Authorization`: Ensures Passenger, Driver, and Admin boundaries
10. `Concurrent Seat Claiming`: Simultaneous race between Nusrat and Shirin for the last seat guarantees strictly 1 winner and 0 overbooking.

---

## 11. Local & Docker Setup

### Prerequisites
* Node.js $\ge 20$
* Docker & Docker Compose (optional for containerized deployment)

### Method 1: Local Development
```bash
# 1. Install dependencies
npm install

# 2. Seed database
npm run seed

# 3. Run full-stack dev server (port 3000)
npm run dev

# 4. Run automated tests
npm test
```

### Method 2: Docker Compose
```bash
# Starts PostgreSQL + Node.js Backend & Frontend container
docker compose up --build
```
Access the application at `http://localhost:3000`.

---

## 12. Project Structure

```
├── .data/                  # Persistent local database store
├── prisma/
│   └── schema.prisma       # Relational PostgreSQL Prisma schema
├── src/
│   ├── client/             # Frontend UI Layer
│   │   ├── api.ts          # Type-safe API client & JWT storage
│   │   ├── types.ts        # Frontend interfaces
│   │   └── components/     # UI Components
│   │       ├── Navbar.tsx
│   │       ├── Footer.tsx  # Mandatory Mamun Khan credit footer
│   │       ├── LandingPage.tsx
│   │       ├── PassengerDashboard.tsx
│   │       ├── DriverDashboard.tsx
│   │       ├── AdminDashboard.tsx
│   │       ├── PoolsView.tsx
│   │       ├── DhakaMapVisualizer.tsx
│   │       └── AuthModal.tsx
│   ├── server/             # Backend API Layer
│   │   ├── controllers/    # Route controllers (auth, ride, driver, admin)
│   │   ├── middleware/     # JWT authentication & role authorization
│   │   ├── routes/         # Express API router
│   │   ├── services/       # Pooling algorithm & Dhaka routing
│   │   ├── db/             # Store & seed scripts
│   │   └── types/          # Backend types
│   ├── tests/
│   │   └── suite.ts        # 10-point automated test suite
│   ├── App.tsx             # Root component
│   └── main.tsx            # Entry point
├── Dockerfile
├── docker-compose.yml
├── server.ts               # Production Express + Vite server entry
└── package.json
```

---

## 13. AI Usage Disclosure

* **What AI helped with**: Rapid initial scaffolding of repetitive TypeScript interfaces, generating Dhaka zone coordinate mappings, and structuring test cases for concurrent Promise resolution.
* **What suggestions were accepted**: Using integer Poisha storage for zero floating-point drift, and designing the SVG corridor visualizer.
* **What suggestions were rejected / modified**: Generic map mockups were rejected in favor of an authentic Dhaka transit model (Airport Road, Kemal Ataturk, Gulshan Avenue, Mohakhali Flyover) with strict FSM lifecycle enforcement.

---

## 14. License & Credits

**© 2026 Dhaka Tesla Pool.**

Crafted by **[Mamun Khan](https://aamkhan.vercel.app/)**.
All rights reserved.
