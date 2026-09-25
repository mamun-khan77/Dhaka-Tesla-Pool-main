import React, { useState, useEffect, useCallback } from 'react';
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
  Navigation,
  Radio,
  Zap,
} from 'lucide-react';
import { api } from '../api.ts';
import { Ride, RideStatus } from '../types.ts';

export interface RideTrackingViewProps {
  rideId: string;
  role: 'PASSENGER' | 'DRIVER' | 'ADMIN';
  initialDetails?: any;
  onStatusChange?: (updatedRide: Ride) => void;
  onClose?: () => void;
}

interface StepConfig {
  status: RideStatus;
  label: string;
  shortLabel: string;
  description: string;
  percentage: number;
}

const STEPS: StepConfig[] = [
  {
    status: 'REQUESTED',
    label: 'Ride Requested',
    shortLabel: 'Requested',
    description: 'Queued in Dhaka transit system, matching compatible Tesla corridors',
    percentage: 15,
  },
  {
    status: 'MATCHED',
    label: 'Tesla Matched',
    shortLabel: 'Matched',
    description: 'Matched to Tesla Bullet operated by Jashim. En route to pickup hub',
    percentage: 40,
  },
  {
    status: 'DRIVER_ARRIVED',
    label: 'Driver Arrived',
    shortLabel: 'Arrived',
    description: 'Vehicle arrived at pickup location. Ready for passenger boarding',
    percentage: 65,
  },
  {
    status: 'STARTED',
    label: 'Trip in Progress',
    shortLabel: 'En Route',
    description: 'Cruising through Dhaka corridor. Silent, air-conditioned transit',
    percentage: 85,
  },
  {
    status: 'COMPLETED',
    label: 'Ride Completed',
    shortLabel: 'Completed',
    description: 'Safely arrived at destination. Fare recorded and settled',
    percentage: 100,
  },
];

export const RideTrackingView: React.FC<RideTrackingViewProps> = ({
  rideId,
  role,
  initialDetails,
  onStatusChange,
  onClose,
}) => {
  const [details, setDetails] = useState<any | null>(initialDetails || null);
  const [loading, setLoading] = useState<boolean>(!initialDetails);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [autoSync, setAutoSync] = useState<boolean>(true);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch ride details
  const fetchRideDetails = useCallback(async (silent: boolean = false) => {
    if (!rideId) return;
    if (!silent) setLoading(true);
    try {
      const data = await api.getRideDetails(rideId);
      setDetails(data);
      setLastSyncTime(new Date());
      if (onStatusChange && data.ride) {
        onStatusChange(data.ride);
      }
    } catch (err: any) {
      if (!silent) {
        setFeedback({ type: 'error', message: err.message || 'Failed to update ride status' });
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [rideId, onStatusChange]);

  // Initial load
  useEffect(() => {
    fetchRideDetails();
  }, [fetchRideDetails]);

  // Real-time polling mechanism (every 2.5 seconds when active)
  useEffect(() => {
    if (!autoSync || !rideId) return;

    const currentStatus = details?.ride?.status;
    const isTerminal = currentStatus === 'COMPLETED' || currentStatus === 'CANCELLED';

    // If already terminal, slow polling or stop
    const intervalMs = isTerminal ? 10000 : 2500;

    const interval = setInterval(() => {
      fetchRideDetails(true);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [autoSync, rideId, details?.ride?.status, fetchRideDetails]);

  // Status Action Handlers (for Driver)
  const handleDriverArrived = async () => {
    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await api.markDriverArrived(rideId);
      setFeedback({ type: 'success', message: res.message });
      await fetchRideDetails();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartRide = async () => {
    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await api.startRide(rideId);
      setFeedback({ type: 'success', message: res.message });
      await fetchRideDetails();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteRide = async () => {
    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await api.completeRide(rideId);
      setFeedback({ type: 'success', message: res.message });
      await fetchRideDetails();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Status Action Handler (for Passenger)
  const handleCancelRide = async () => {
    if (!confirm('Are you sure you want to cancel this ride?')) return;
    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await api.cancelRide(rideId);
      setFeedback({ type: 'success', message: res.message });
      await fetchRideDetails();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Payment Handler
  const handlePayRide = async (method: 'CASH' | 'TESLAPAY') => {
    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await api.payRide(rideId, method);
      setFeedback({ type: 'success', message: res.message });
      await fetchRideDetails();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !details) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
        <p className="text-xs text-slate-400 font-mono">Syncing live ride telemetry...</p>
      </div>
    );
  }

  if (!details || !details.ride) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
        <p className="text-sm font-bold text-white">Ride Telemetry Unavailable</p>
        <p className="text-xs text-slate-400">The requested ride could not be retrieved.</p>
      </div>
    );
  }

  const ride: Ride = details.ride;
  const vehicle = details.vehicle;
  const driver = details.driver;
  const coPassengers = details.coPassengers || [];
  const history = details.history || [];
  const payments = details.payments || [];

  const isCancelled = ride.status === 'CANCELLED';

  // Find step progress
  const currentStepIndex = STEPS.findIndex((s) => s.status === ride.status);
  const currentPercentage = isCancelled
    ? 100
    : currentStepIndex >= 0
    ? STEPS[currentStepIndex].percentage
    : 10;

  // Active status description
  const activeStepConfig = STEPS.find((s) => s.status === ride.status);

  return (
    <div className="relative bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden space-y-6">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Telemetry Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Live Ride Tracking
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs font-mono font-bold text-white">
              {ride.id.substring(0, 16)}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase ${
                ride.status === 'COMPLETED'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : isCancelled
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : ride.status === 'STARTED'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 animate-pulse'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              {ride.status.replace('_', ' ')}
            </span>
          </div>

          <p className="text-xs text-slate-400">
            {activeStepConfig ? activeStepConfig.description : 'Real-time telemetry active'}
          </p>
        </div>

        {/* Real-Time Live Sync Indicator & Actions */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setAutoSync(!autoSync)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono transition-colors border ${
              autoSync
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
            title="Toggle live real-time auto sync"
          >
            <Radio className={`w-3 h-3 ${autoSync ? 'text-emerald-400 animate-ping' : ''}`} />
            <span>{autoSync ? 'Live Auto-Sync ON' : 'Sync Paused'}</span>
          </button>

          <button
            onClick={() => fetchRideDetails(false)}
            disabled={actionLoading}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors"
            title={`Last synced: ${lastSyncTime.toLocaleTimeString()}`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center justify-between border ${
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
            <XCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Real-Time Continuous Progress Bar */}
      <div className="relative z-10 space-y-3 pt-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400">Transit Progress</span>
          <span className="text-emerald-400 font-bold">{currentPercentage}%</span>
        </div>

        {/* Progress Bar Track */}
        <div className="relative w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
          <div
            className={`h-full transition-all duration-700 ease-out rounded-full ${
              isCancelled
                ? 'bg-rose-500'
                : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 shadow-lg shadow-emerald-500/30'
            }`}
            style={{ width: `${currentPercentage}%` }}
          />
        </div>

        {/* Milestone Steps Bar */}
        <div className="grid grid-cols-5 gap-1 pt-2">
          {STEPS.map((step, idx) => {
            const isCompleted = currentStepIndex > idx && !isCancelled;
            const isCurrent = currentStepIndex === idx && !isCancelled;

            return (
              <div key={step.status} className="flex flex-col items-center text-center space-y-1">
                {/* Step Circle Indicator */}
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                    isCompleted
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : isCurrent
                      ? 'bg-cyan-400 text-slate-950 ring-4 ring-cyan-400/20 animate-pulse'
                      : isCancelled
                      ? 'bg-slate-800 text-slate-600'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {isCompleted ? '✓' : idx + 1}
                </div>

                {/* Step Labels */}
                <div className="space-y-0.5">
                  <div
                    className={`text-[10px] font-bold transition-colors ${
                      isCurrent
                        ? 'text-cyan-400'
                        : isCompleted
                        ? 'text-emerald-300'
                        : 'text-slate-500'
                    }`}
                  >
                    {step.shortLabel}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Route & Corridor Summary */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Origin to Destination */}
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center justify-between">
            <span>Dhaka Transit Corridor</span>
            <span className="text-emerald-400 font-mono">{ride.seatsRequested} Seat(s)</span>
          </div>
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <span className="text-emerald-400 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              {ride.pickupArea}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-cyan-400">{ride.destinationArea}</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            Direct corridor transit with pooled passengers
          </div>
        </div>

        {/* Fare Breakdown */}
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center justify-between">
            <span>Fare Transparency</span>
            <span className="text-emerald-400 font-mono">25% Discount</span>
          </div>
          <div className="text-xl font-extrabold text-emerald-400">
            {ride.formattedFare}
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            Base: {ride.formattedBaseFare || '৳60.00'} | Dist: {ride.formattedDistanceCharge} | Pool: -{ride.formattedPoolDiscount}
          </div>
        </div>
      </div>

      {/* Vehicle & Assigned Driver Details */}
      {vehicle && (
        <div className="relative z-10 p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white">
                Tesla "{vehicle.name}" ({vehicle.model})
              </span>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Plate: {vehicle.plateNumber}
            </span>
          </div>

          {driver && (
            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
              <div className="text-slate-300">
                Driver: <strong className="text-white">{driver.name}</strong>
              </div>
              <a
                href={`tel:${driver.phone}`}
                className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-mono transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{driver.phone}</span>
              </a>
            </div>
          )}

          {/* Co-passengers sharing the Tesla */}
          {coPassengers.length > 0 && (
            <div className="pt-2 border-t border-slate-800/80">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Users className="w-3 h-3 text-emerald-400" /> Co-Passengers Sharing This Ride:
              </div>
              <div className="space-y-1">
                {coPassengers.map((cp: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-xs text-slate-300 bg-slate-900/60 p-1.5 rounded">
                    <span>{cp.name}</span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {cp.pickup} → {cp.destination} ({cp.seats} seat)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Role-Specific Action Controls */}
      <div className="relative z-10 pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
        {/* DRIVER ACTIONS */}
        {role === 'DRIVER' && (
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {ride.status === 'MATCHED' && (
              <button
                onClick={handleDriverArrived}
                disabled={actionLoading}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Mark Driver Arrived (At Pickup)</span>
              </button>
            )}

            {ride.status === 'DRIVER_ARRIVED' && (
              <button
                onClick={handleStartRide}
                disabled={actionLoading}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Start Ride (Passenger Boarded)</span>
              </button>
            )}

            {ride.status === 'STARTED' && (
              <button
                onClick={handleCompleteRide}
                disabled={actionLoading}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Complete Ride (Dropoff Done)</span>
              </button>
            )}

            {ride.status === 'COMPLETED' && (
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 font-mono">
                <CheckCircle2 className="w-4 h-4" /> Trip Finished & Recorded
              </span>
            )}
          </div>
        )}

        {/* PASSENGER ACTIONS */}
        {role === 'PASSENGER' && (
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Cancellation button (allowed in REQUESTED or MATCHED before arrival) */}
            {(ride.status === 'REQUESTED' || ride.status === 'MATCHED') && (
              <button
                onClick={handleCancelRide}
                disabled={actionLoading}
                className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold rounded-xl text-xs transition-colors"
              >
                Cancel Ride Request
              </button>
            )}

            {/* Settle Payment if pending */}
            {ride.status === 'COMPLETED' && payments.every((p: any) => p.status === 'PAID') ? (
              <div className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Payment Complete ({ride.formattedFare})</span>
              </div>
            ) : ride.status === 'COMPLETED' ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePayRide('TESLAPAY')}
                  disabled={actionLoading}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition-colors flex items-center gap-1"
                >
                  <CreditCard className="w-3 h-3" /> Pay with TeslaPay
                </button>
                <button
                  onClick={() => handlePayRide('CASH')}
                  disabled={actionLoading}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-xs transition-colors flex items-center gap-1"
                >
                  <Banknote className="w-3 h-3" /> Pay with Cash
                </button>
              </div>
            ) : null}
          </div>
        )}

        <div className="text-[10px] text-slate-500 font-mono ml-auto">
          Updated: {lastSyncTime.toLocaleTimeString()}
        </div>
      </div>

      {/* Ride Audit Trail History */}
      {history.length > 0 && (
        <div className="relative z-10 p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 space-y-1.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Real-Time Audit Trail
          </div>
          <div className="space-y-1">
            {history.map((h: any) => (
              <div key={h.id} className="flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="font-semibold text-slate-300 font-mono text-[11px]">{h.status}</span>
                  {h.note && <span className="text-slate-500 text-[11px]">— {h.note}</span>}
                </div>
                <span className="text-[10px] font-mono text-slate-500">
                  {new Date(h.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
