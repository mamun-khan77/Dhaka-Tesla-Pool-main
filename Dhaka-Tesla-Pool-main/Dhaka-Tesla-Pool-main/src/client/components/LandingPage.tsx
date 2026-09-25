import React, { useState } from 'react';
import {
  Zap,
  Car,
  Users,
  ShieldCheck,
  TrendingDown,
  Navigation,
  Clock,
  ArrowRight,
  Sparkles,
  Calculator,
  CheckCircle2,
} from 'lucide-react';
import { DhakaMapVisualizer } from './DhakaMapVisualizer.tsx';
import { calculateFare } from '../../server/services/dhakaRouting.ts';

interface LandingPageProps {
  onStartBooking: () => void;
  onDriveWithUs: () => void;
  onExplorePools: () => void;
}

const DHAKA_AREAS = [
  { name: 'Banani', type: 'Primary Tech & Dining Hub' },
  { name: 'Gulshan 1', type: 'Financial & Diplomatic South' },
  { name: 'Gulshan 2', type: 'Diplomatic Zone North' },
  { name: 'Mohakhali', type: 'Central Flyover Interchange' },
  { name: 'Dhanmondi', type: 'Residential & University Spine' },
  { name: 'Mirpur', type: 'Metro Rail Corridor' },
  { name: 'Uttara', type: 'Northern Gateway & Airport' },
  { name: 'Farmgate', type: 'Central Metro Hub' },
  { name: 'Bashundhara', type: 'Residential & Kuril Interchange' },
];

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartBooking,
  onDriveWithUs,
  onExplorePools,
}) => {
  // Interactive Fare Calculator State
  const [calcPickup, setCalcPickup] = useState('Banani');
  const [calcDest, setCalcDest] = useState('Mohakhali');
  const [calcSeats, setCalcSeats] = useState(1);

  const soloFare = calculateFare(calcPickup, calcDest, false, calcSeats);
  const pooledFare = calculateFare(calcPickup, calcDest, true, calcSeats);

  return (
    <div className="space-y-24 pb-16">
      {/* 1. HERO SECTION */}
      <section className="relative pt-12 md:pt-20 overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-500/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[300px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                <Zap className="w-3.5 h-3.5 fill-emerald-400" />
                <span>Dhaka's 1st Electric Smart Ride-Pooling Network</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
                Share a Seat. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                  Split the Fare.
                </span> <br />
                Survive Dhaka Traffic.
              </h1>

              <p className="text-base sm:text-lg text-slate-300 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Why endure Dhaka's gridlock alone or pay surge solo rates? 
                Match in seconds with commuters traversing the Banani-Gulshan-Mohakhali corridors in premium, silent Teslas.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <button
                  onClick={onStartBooking}
                  className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 group text-base"
                >
                  <span>Request a Ride</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={onDriveWithUs}
                  className="w-full sm:w-auto px-6 py-4 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 text-base"
                >
                  <Car className="w-4 h-4 text-emerald-400" />
                  <span>Drive with Us (Jashim)</span>
                </button>
              </div>

              {/* Live Metric Badges */}
              <div className="grid grid-cols-3 gap-3 pt-6 border-t border-slate-800/80 max-w-md mx-auto lg:mx-0 text-left">
                <div>
                  <div className="text-2xl font-extrabold text-white">25%</div>
                  <div className="text-xs text-slate-400">Pool Discount</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-emerald-400">3 Seats</div>
                  <div className="text-xs text-slate-400">Strict Capacity</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-cyan-400">0 Grams</div>
                  <div className="text-xs text-slate-400">CO2 Emissions</div>
                </div>
              </div>
            </div>

            {/* Right: Interactive Visual Corridor Network & Vehicle Card */}
            <div className="lg:col-span-5 space-y-4">
              <DhakaMapVisualizer
                selectedPickup={calcPickup}
                selectedDestination={calcDest}
                onSelectArea={(area) => {
                  if (calcPickup === area) return;
                  if (!calcPickup) setCalcPickup(area);
                  else setCalcDest(area);
                }}
              />

              {/* Live Bullet Tesla Status Pill */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Car className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      Tesla "Bullet" (Driver: Jashim)
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Route: Banani → Mohakhali → Gulshan 1
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="px-2 py-1 text-xs font-bold bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded">
                    1 Seat Free
                  </span>
                  <div className="text-[10px] text-slate-400 pt-0.5">2/3 Occupied</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. HOW IT WORKS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Intelligent Pooling
          </h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            How Dhaka Tesla Pool Works
          </h3>
          <p className="text-sm text-slate-400">
            Zero complex detours. Commuters traversing the same transit corridors are pooled into the same high-efficiency vehicle.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Step 1 */}
          <div className="relative p-6 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4 hover:border-slate-700 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400 font-mono font-bold text-lg">
              1
            </div>
            <h4 className="text-base font-bold text-white">Request a Ride</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Select your pickup and dropoff hubs across key Dhaka corridors (e.g. Banani to Mohakhali).
            </p>
          </div>

          {/* Step 2 */}
          <div className="relative p-6 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4 hover:border-slate-700 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-cyan-400 font-mono font-bold text-lg">
              2
            </div>
            <h4 className="text-base font-bold text-white">Find a Compatible Pool</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Our corridor matching engine pairs you with riders taking parallel paths like Kemal Ataturk or Airport Road.
            </p>
          </div>

          {/* Step 3 */}
          <div className="relative p-6 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4 hover:border-slate-700 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-purple-400 font-mono font-bold text-lg">
              3
            </div>
            <h4 className="text-base font-bold text-white">Share the Vehicle</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Step into Tesla "Bullet" operated by Jashim. Strict 3-passenger cap guarantees personal room and comfort.
            </p>
          </div>

          {/* Step 4 */}
          <div className="relative p-6 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4 hover:border-slate-700 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-amber-400 font-mono font-bold text-lg">
              4
            </div>
            <h4 className="text-base font-bold text-white">Pay Your Fair Share</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Enjoy an automatic 25% pool discount deducted straight from your base and distance fare. Pay Cash or TeslaPay.
            </p>
          </div>
        </div>
      </section>

      {/* 3. TRANSPARENT FARE FORMULA & LIVE SIMULATOR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Explanation */}
            <div className="lg:col-span-6 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold">
                <Calculator className="w-3.5 h-3.5" />
                <span>Zero Hidden Surges</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Transparent Fare System
              </h3>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-sm sm:text-base text-emerald-400">
                passengerFare = baseFare + distanceCharge - poolDiscount
              </div>

              <p className="text-sm text-slate-300 leading-relaxed">
                Dhaka fares are fixed to objective zone kilometers rather than manipulative surge multipliers:
              </p>

              <ul className="text-xs space-y-2 text-slate-400">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span><strong>Base Fare:</strong> ৳60.00 (covers initial boarding & electric energy)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span><strong>Distance Charge:</strong> ৳25.00 / km based on verified corridor distances</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span><strong>Pool Discount:</strong> -25% off the total when shared with fellow passengers</span>
                </li>
              </ul>
            </div>

            {/* Live Interactive Quote Calculator */}
            <div className="lg:col-span-6 bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-5">
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                <span>Try the Fare Calculator</span>
                <span className="text-xs text-emerald-400 font-mono">{soloFare.distanceKm} KM</span>
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Pickup Area</label>
                  <select
                    value={calcPickup}
                    onChange={(e) => setCalcPickup(e.target.value)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
                  >
                    {DHAKA_AREAS.map((a) => (
                      <option key={a.name} value={a.name}>{a.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Destination Area</label>
                  <select
                    value={calcDest}
                    onChange={(e) => setCalcDest(e.target.value)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
                  >
                    {DHAKA_AREAS.map((a) => (
                      <option key={a.name} value={a.name}>{a.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Fare Comparison Breakdown */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                  <div className="text-[11px] text-slate-400">Solo Fare (No Pool)</div>
                  <div className="text-lg font-bold text-slate-300">{soloFare.formatted.totalFare}</div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Base {soloFare.formatted.baseFare} + Dist {soloFare.formatted.distanceCharge}
                  </div>
                </div>

                <div className="p-3 bg-emerald-950/30 rounded-xl border border-emerald-500/40">
                  <div className="text-[11px] text-emerald-400 font-bold flex items-center justify-between">
                    <span>Pooled Fare</span>
                    <span className="text-[10px] bg-emerald-500/20 px-1 rounded">-25%</span>
                  </div>
                  <div className="text-xl font-extrabold text-emerald-300">{pooledFare.formatted.totalFare}</div>
                  <div className="text-[10px] text-emerald-400/80 font-mono">
                    You save {pooledFare.formatted.poolDiscount}!
                  </div>
                </div>
              </div>

              <button
                onClick={onStartBooking}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20"
              >
                <span>Book This Route Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SIX CORE PRODUCT FEATURES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Engineered For Dhaka
          </h2>
          <h3 className="text-3xl font-extrabold text-white tracking-tight">
            Production-Grade Capabilities
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Navigation className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white">Smart Pool Matching</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Analyzes Dhaka corridor vectors to cluster compatible rides (e.g. Banani to Mohakhali & Banani to Gulshan 1) with near-zero detour delay.
            </p>
          </div>

          <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <TrendingDown className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white">Lower Fare (25% Discount)</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Transparent algorithm splits the base and corridor distance charges, guaranteeing noticeable daily savings compared to traditional rideshares.
            </p>
          </div>

          <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white">Strict Seat Protection</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Backend transactional concurrency locks prevent overbooking. When Nusrat and Shirin claim the final seat, only 1 can book; capacity is never exceeded.
            </p>
          </div>

          <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white">Real-Time Ride Status</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              State-machine protected transitions: REQUESTED → MATCHED → DRIVER_ARRIVED → STARTED → COMPLETED with audit logs.
            </p>
          </div>

          <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Users className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white">Private Passenger Boundary</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Role-based authorization ensures passengers only access their personal booking history and billing data. Zero data leakage.
            </p>
          </div>

          <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Zap className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white">Secure Authentication</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Bcrypt salted password encryption and tamper-proof JWT sessions ensure authentic commuter identity across driver, passenger, and admin portals.
            </p>
          </div>
        </div>
      </section>

      {/* 5. COVERED DHAKA HUBS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
          <h3 className="text-2xl font-extrabold text-white">Supported Dhaka Locations</h3>
          <p className="text-xs text-slate-400">
            Serving key commercial and residential crossroads with predefined route compatibility rules.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
          {DHAKA_AREAS.map((area) => (
            <div
              key={area.name}
              className="p-4 bg-slate-900/50 border border-slate-800/80 rounded-xl hover:border-emerald-500/40 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <h4 className="text-sm font-bold text-white">{area.name}</h4>
              </div>
              <p className="text-xs text-slate-400">{area.type}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. CALL TO ACTION */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-8 sm:p-12 text-center text-slate-950 overflow-hidden shadow-2xl">
          <div className="relative z-10 space-y-4 max-w-xl mx-auto">
            <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Ready to share your ride?
            </h3>
            <p className="text-emerald-100 text-sm sm:text-base leading-relaxed">
              Step into an electric Tesla. Split your fare, cut your commute stress, and arrive refreshed in Dhaka.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={onStartBooking}
                className="w-full sm:w-auto px-8 py-3.5 bg-slate-950 hover:bg-slate-900 text-white font-bold rounded-xl shadow-lg transition-transform hover:scale-105 text-sm"
              >
                Book a Ride
              </button>
              <button
                onClick={onExplorePools}
                className="w-full sm:w-auto px-6 py-3.5 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-xl backdrop-blur-sm transition-colors text-sm"
              >
                Explore Active Pools
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
