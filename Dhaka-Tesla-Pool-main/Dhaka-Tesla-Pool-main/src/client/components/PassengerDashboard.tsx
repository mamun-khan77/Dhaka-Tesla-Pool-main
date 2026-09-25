import React, { useState, useEffect } from 'react';
import {
  Car,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  CreditCard,
  Banknote,
  Users,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  Phone,
  Sparkles,
} from 'lucide-react';
import { api } from '../api.ts';
import { User, Ride, FareEstimate } from '../types.ts';
import { DHAKA_LOCATIONS } from '../../server/services/dhakaRouting.ts';
import { RideTrackingView } from './RideTrackingView.tsx';
import { persistRideToFirestore } from '../firebase.ts';

interface PassengerDashboardProps {
  currentUser: User | null;
  onOpenAuth: () => void;
}

const SUPPORTED_AREAS = Object.keys(DHAKA_LOCATIONS);

export const PassengerDashboard: React.FC<PassengerDashboardProps> = ({
  currentUser,
  onOpenAuth,
}) => {
  // Booking Form State
  const [pickup, setPickup] = useState('Banani');
  const [destination, setDestination] = useState('Mohakhali');
  const [seats, setSeats] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TESLAPAY'>('TESLAPAY');

  // Async States
  const [estimate, setEstimate] = useState<FareEstimate | null>(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // User Rides State
  const [rides, setRides] = useState<Ride[]>([]);
  const [selectedRideDetails, setSelectedRideDetails] = useState<any | null>(null);
  const [loadingRides, setLoadingRides] = useState(false);

  // Fetch estimated quote whenever pickup/dest/seats change
  useEffect(() => {
    let isMounted = true;
    const fetchEstimate = async () => {
      if (pickup === destination) {
        setEstimate(null);
        return;
      }
      setEstimateLoading(true);
      try {
        const est = await api.estimateFare(pickup, destination, seats);
        if (isMounted) setEstimate(est);
      } catch (err) {
        // Silently handle if unauthenticated or invalid
      } finally {
        if (isMounted) setEstimateLoading(false);
      }
    };

    fetchEstimate();
    return () => { isMounted = false; };
  }, [pickup, destination, seats]);

  // Load passenger's rides
  const loadRides = async () => {
    if (!currentUser) return;
    setLoadingRides(true);
    try {
      const res = await api.getMyRides();
      setRides(res.rides);
      if (res.rides.length > 0) {
        // Fetch detailed view for the active or most recent ride
        const details = await api.getRideDetails(res.rides[0].id);
        setSelectedRideDetails(details);
      } else {
        setSelectedRideDetails(null);
      }
    } catch (err: any) {
      console.error('Failed to load rides:', err);
    } finally {
      setLoadingRides(false);
    }
  };

  useEffect(() => {
    loadRides();
  }, [currentUser]);

  // Select a specific ride from history
  const handleSelectRide = async (rideId: string) => {
    setActionLoading(true);
    try {
      const details = await api.getRideDetails(rideId);
      setSelectedRideDetails(details);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error fetching ride details' });
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Ride Request
  const handleRequestRide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    setFeedback(null);
    setBookingLoading(true);
    try {
      const res = await api.createRide(pickup, destination, seats, paymentMethod);
      if (res.ride) {
        persistRideToFirestore(res.ride);
      }
      setFeedback({
        type: 'success',
        message: res.message || 'Ride requested successfully!',
      });
      await loadRides();
      if (res.ride) {
        const details = await api.getRideDetails(res.ride.id);
        setSelectedRideDetails(details);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to request ride' });
    } finally {
      setBookingLoading(false);
    }
  };

  // Cancel Active Ride
  const handleCancelRide = async (rideId: string) => {
    if (!confirm('Are you sure you want to cancel this ride request?')) return;
    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await api.cancelRide(rideId);
      setFeedback({ type: 'success', message: res.message });
      await loadRides();
      const details = await api.getRideDetails(rideId);
      setSelectedRideDetails(details);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to cancel ride' });
    } finally {
      setActionLoading(false);
    }
  };

  // Settle Payment
  const handlePay = async (rideId: string, method: 'CASH' | 'TESLAPAY') => {
    setActionLoading(true);
    try {
      const res = await api.payRide(rideId, method);
      setFeedback({ type: 'success', message: res.message });
      const details = await api.getRideDetails(rideId);
      setSelectedRideDetails(details);
      await loadRides();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Payment failed' });
    } finally {
      setActionLoading(false);
    }
  };

  const activeRide = selectedRideDetails?.ride;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-slate-900/60 border border-slate-800 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Welcome, {currentUser ? currentUser.name : 'Dhaka Commuter'}</span>
            {currentUser && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                {currentUser.role}
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Book an electric pool seat or monitor active Tesla routing across Dhaka.
          </p>
        </div>

        {!currentUser ? (
          <button
            onClick={onOpenAuth}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs shadow-md transition-all"
          >
            Sign In to Book
          </button>
        ) : (
          <button
            onClick={loadRides}
            disabled={loadingRides}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingRides ? 'animate-spin' : ''}`} />
            <span>Refresh Status</span>
          </button>
        )}
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Grid: Left Booking Form, Right Active Ride Status & History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* 1. RIDE BOOKING INTERFACE */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Car className="w-4 h-4 text-emerald-400" />
              <span>Request a Pool Ride</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Max 3 Seats</span>
          </div>

          <form onSubmit={handleRequestRide} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Pickup Location (Dhaka Area)
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-emerald-400" />
                <select
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
                >
                  {SUPPORTED_AREAS.map((area) => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Destination Location
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-cyan-400" />
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
                >
                  {SUPPORTED_AREAS.map((area) => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Seats Requested
                </label>
                <div className="flex rounded-lg bg-slate-950 border border-slate-800 p-1">
                  {[1, 2, 3].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setSeats(num)}
                      className={`flex-1 py-1 text-xs font-bold rounded ${
                        seats === num
                          ? 'bg-emerald-500 text-slate-950'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Payment Method
                </label>
                <div className="flex rounded-lg bg-slate-950 border border-slate-800 p-1">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('TESLAPAY')}
                    className={`flex-1 py-1 text-[11px] font-bold rounded flex items-center justify-center gap-1 ${
                      paymentMethod === 'TESLAPAY'
                        ? 'bg-emerald-500 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <CreditCard className="w-3 h-3" /> TeslaPay
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CASH')}
                    className={`flex-1 py-1 text-[11px] font-bold rounded flex items-center justify-center gap-1 ${
                      paymentMethod === 'CASH'
                        ? 'bg-emerald-500 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Banknote className="w-3 h-3" /> Cash
                  </button>
                </div>
              </div>
            </div>

            {/* Estimated Fare Box */}
            {estimate && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Distance: {estimate.distanceKm} km</span>
                  {estimate.availablePoolsCount > 0 ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> {estimate.availablePoolsCount} pool(s) active!
                    </span>
                  ) : (
                    <span className="text-slate-500">New pool will be created</span>
                  )}
                </div>

                <div className="flex items-baseline justify-between pt-1 border-t border-slate-800">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">Estimated Pooled Fare</div>
                    <div className="text-2xl font-extrabold text-emerald-400">
                      {estimate.poolEstimate.formatted.totalFare}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 line-through">
                      Solo: {estimate.soloEstimate.formatted.totalFare}
                    </div>
                    <div className="text-xs text-emerald-400 font-bold">
                      Save {estimate.poolEstimate.formatted.poolDiscount} (25%)
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 font-mono">
                  baseFare ({estimate.poolEstimate.formatted.baseFare}) + distanceCharge ({estimate.poolEstimate.formatted.distanceCharge}) - poolDiscount ({estimate.poolEstimate.formatted.poolDiscount})
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={bookingLoading || pickup === destination}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {bookingLoading ? (
                <span>Matching Compatible Pool...</span>
              ) : (
                <>
                  <span>Confirm & Request Ride</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* 2. ACTIVE RIDE STATUS & DETAILS */}
        <div className="lg:col-span-7 space-y-6">
          {activeRide ? (
            <RideTrackingView
              rideId={activeRide.id}
              role="PASSENGER"
              initialDetails={selectedRideDetails}
              onStatusChange={() => {
                api.getMyRides().then((res) => setRides(res.rides));
              }}
            />
          ) : (
            /* Empty State */
            <div className="p-12 bg-slate-900/40 border border-slate-800 border-dashed rounded-2xl text-center space-y-3">
              <Car className="w-10 h-10 text-slate-600 mx-auto" />
              <h4 className="text-base font-bold text-white">No Active Ride Selected</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Select your pickup and destination in the left panel to join a Tesla corridor pool or choose from your previous rides below.
              </p>
            </div>
          )}

          {/* 3. RECENT RIDES HISTORY TABLE */}
          {rides.length > 0 && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white">My Ride History</h4>
                <span className="text-xs text-slate-400 font-mono">{rides.length} Total</span>
              </div>

              <div className="space-y-2">
                {rides.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => handleSelectRide(r.id)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                      activeRide?.id === r.id
                        ? 'bg-slate-800/80 border-emerald-500/50'
                        : 'bg-slate-950 hover:bg-slate-900 border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span>{r.pickupArea}</span>
                        <ArrowRight className="w-3 h-3 text-slate-500" />
                        <span>{r.destinationArea}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {new Date(r.createdAt).toLocaleDateString()} at {new Date(r.createdAt).toLocaleTimeString()}
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <div className="font-mono font-bold text-emerald-400">
                        {r.formattedFare}
                      </div>
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono ${
                          r.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : r.status === 'CANCELLED'
                            ? 'bg-rose-500/10 text-rose-400'
                            : 'bg-amber-500/10 text-amber-400'
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
