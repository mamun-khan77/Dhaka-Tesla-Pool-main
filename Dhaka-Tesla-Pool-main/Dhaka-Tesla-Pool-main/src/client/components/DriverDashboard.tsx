import React, { useState, useEffect } from 'react';
import {
  Car,
  Power,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Navigation,
  MapPin,
  RefreshCw,
  Phone,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { api } from '../api.ts';
import { User } from '../types.ts';
import { RideTrackingView } from './RideTrackingView.tsx';

interface DriverDashboardProps {
  currentUser: User | null;
  onOpenAuth: () => void;
}

export const DriverDashboard: React.FC<DriverDashboardProps> = ({
  currentUser,
  onOpenAuth,
}) => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [selectedTrackingRideId, setSelectedTrackingRideId] = useState<string | null>(null);

  const loadDashboard = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const res = await api.getDriverDashboard();
      setData(res);
      // Auto select first member ride if none selected or previous no longer exists
      if (res.activePool?.members?.length > 0) {
        setSelectedTrackingRideId((prev) => {
          const exists = res.activePool.members.some((m: any) => m.ride?.id === prev);
          return exists ? prev : res.activePool.members[0].ride?.id || null;
        });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to load driver dashboard' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [currentUser]);

  // Toggle Online/Offline
  const handleToggleOnline = async () => {
    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await api.toggleVehicleStatus();
      setFeedback({ type: 'success', message: res.message });
      await loadDashboard();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Accept incoming ride request
  const handleAcceptRide = async (rideId: string) => {
    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await api.acceptRide(rideId);
      setFeedback({ type: 'success', message: res.message });
      await loadDashboard();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Lifecycle progression
  const handleMarkArrived = async (rideId: string) => {
    setActionLoading(true);
    try {
      const res = await api.markDriverArrived(rideId);
      setFeedback({ type: 'success', message: res.message });
      await loadDashboard();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartRide = async (rideId: string) => {
    setActionLoading(true);
    try {
      const res = await api.startRide(rideId);
      setFeedback({ type: 'success', message: res.message });
      await loadDashboard();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteRide = async (rideId: string) => {
    setActionLoading(true);
    try {
      const res = await api.completeRide(rideId);
      setFeedback({ type: 'success', message: res.message });
      await loadDashboard();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <Car className="w-12 h-12 text-emerald-400 mx-auto" />
        <h3 className="text-xl font-bold text-white">Driver Portal</h3>
        <p className="text-xs text-slate-400">
          Sign in as driver Jashim or register a new Tesla to manage vehicle pools and seat allocations.
        </p>
        <button
          onClick={onOpenAuth}
          className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg transition-all"
        >
          Sign In as Driver (Jashim)
        </button>
      </div>
    );
  }

  const vehicle = data?.vehicle;
  const seatStats = data?.seatStats || { capacity: 3, occupied: 0, available: 3, isFull: false };
  const activePool = data?.activePool;
  const pendingRequests = data?.pendingRequests || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Driver Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-slate-900/60 border border-slate-800 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Car className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">{currentUser.name}</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Tesla Driver
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Assigned Vehicle: <strong className="text-white">{vehicle?.name || 'Bullet'}</strong> ({vehicle?.model || 'Tesla Model 3'}) • Plate: <span className="font-mono text-slate-300">{vehicle?.plateNumber}</span>
            </p>
          </div>
        </div>

        {/* Online / Offline Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleOnline}
            disabled={actionLoading}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
              vehicle?.status === 'ACTIVE'
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{vehicle?.status === 'ACTIVE' ? 'ONLINE (Accepting Pools)' : 'OFFLINE'}</span>
          </button>

          <button
            onClick={loadDashboard}
            disabled={loading}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
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
        </div>
      )}

      {/* Seat Capacity Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Capacity */}
        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-1">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Vehicle Capacity
          </div>
          <div className="text-3xl font-extrabold text-white">
            {seatStats.capacity} <span className="text-sm font-normal text-slate-400">Seats</span>
          </div>
          <p className="text-[10px] text-slate-500">Strict limit enforced by backend database</p>
        </div>

        {/* Occupied */}
        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-1">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Occupied Seats
          </div>
          <div className="text-3xl font-extrabold text-emerald-400">
            {seatStats.occupied} <span className="text-sm font-normal text-slate-400">/ {seatStats.capacity}</span>
          </div>
          <p className="text-[10px] text-slate-500">
            {activePool?.members?.length || 0} active commuter(s) pooled
          </p>
        </div>

        {/* Available */}
        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-1">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Remaining Available
          </div>
          <div className="text-3xl font-extrabold text-cyan-400">
            {seatStats.available} <span className="text-sm font-normal text-slate-400">Seats Left</span>
          </div>
          <p className="text-[10px] text-slate-500">
            {seatStats.isFull ? 'Vehicle is FULL' : 'Can accept matching corridor requests'}
          </p>
        </div>
      </div>

      {/* Active Pool Section */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Active Tesla Pool</span>
            </h3>
            {activePool && (
              <p className="text-xs text-slate-400 mt-0.5">
                Route: <strong className="text-emerald-300">{activePool.routeSummary}</strong> • Status: <span className="font-mono text-slate-300">{activePool.status}</span>
              </p>
            )}
          </div>
          {activePool && (
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono uppercase ${
                activePool.status === 'FULL'
                  ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                  : activePool.status === 'IN_TRANSIT'
                  ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                  : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
              }`}
            >
              {activePool.status}
            </span>
          )}
        </div>

        {/* Active Passenger Live Telemetry Track & Progress Bar */}
        {selectedTrackingRideId && (
          <div className="space-y-3 pb-2 border-b border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5" />
                Live Real-Time Passenger Progress
              </span>
              {activePool?.members && activePool.members.length > 1 && (
                <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                  <span className="text-[10px] text-slate-500 font-mono mr-1">Switch Rider:</span>
                  {activePool.members.map((m: any) => (
                    <button
                      key={m.memberId}
                      onClick={() => setSelectedTrackingRideId(m.ride?.id)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                        selectedTrackingRideId === m.ride?.id
                          ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {m.passenger?.name || 'Commuter'} ({m.ride?.status})
                    </button>
                  ))}
                </div>
              )}
            </div>

            <RideTrackingView
              rideId={selectedTrackingRideId}
              role="DRIVER"
              onStatusChange={() => loadDashboard()}
            />
          </div>
        )}

        {activePool && activePool.members && activePool.members.length > 0 ? (
          <div className="space-y-4">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
              All Passengers in Pool ({activePool.members.length})
            </div>
            {activePool.members.map((member: any) => (
              <div
                key={member.memberId}
                onClick={() => setSelectedTrackingRideId(member.ride?.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  selectedTrackingRideId === member.ride?.id
                    ? 'bg-slate-950 border-emerald-500/50 shadow-md shadow-emerald-500/10'
                    : 'bg-slate-950 hover:bg-slate-900 border-slate-800'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">
                      {member.passenger?.name || 'Passenger'}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded font-mono">
                      {member.seats} Seat(s)
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold uppercase ${
                        member.ride?.status === 'COMPLETED'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : member.ride?.status === 'STARTED'
                          ? 'bg-cyan-500/20 text-cyan-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {member.ride?.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{member.ride?.pickupArea} → {member.ride?.destinationArea}</span>
                    <span className="text-slate-600">•</span>
                    <span className="font-mono text-emerald-400 font-bold">{member.formattedFare}</span>
                  </div>
                </div>

                {/* Ride Lifecycle Transition Action Buttons */}
                <div className="flex items-center gap-2">
                  {member.ride?.status === 'MATCHED' && (
                    <button
                      onClick={() => handleMarkArrived(member.ride.id)}
                      disabled={actionLoading}
                      className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-xs transition-colors"
                    >
                      Driver Arrived
                    </button>
                  )}

                  {member.ride?.status === 'DRIVER_ARRIVED' && (
                    <button
                      onClick={() => handleStartRide(member.ride.id)}
                      disabled={actionLoading}
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition-colors"
                    >
                      Start Ride
                    </button>
                  )}

                  {member.ride?.status === 'STARTED' && (
                    <button
                      onClick={() => handleCompleteRide(member.ride.id)}
                      disabled={actionLoading}
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition-colors"
                    >
                      Complete Ride
                    </button>
                  )}

                  {member.ride?.status === 'COMPLETED' && (
                    <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Finished
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 text-xs">
            No passengers currently in pool. New incoming requests below can be accepted.
          </div>
        )}
      </div>

      {/* Available Ride Requests in Dhaka */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Navigation className="w-4 h-4 text-cyan-400" />
              <span>Pending Dhaka Ride Requests</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Available commuters waiting along your transit corridors.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {pendingRequests.length} Waiting
          </span>
        </div>

        {pendingRequests.length > 0 ? (
          <div className="space-y-3">
            {pendingRequests.map((req: any) => {
              const hasCapacity = seatStats.available >= req.seatsRequested;

              return (
                <div
                  key={req.id}
                  className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">
                        {req.passenger?.name || 'Commuter'}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded font-mono">
                        {req.seatsRequested} Seat(s)
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{req.pickupArea} → {req.destinationArea}</span>
                      <span className="text-slate-600">•</span>
                      <span className="font-mono text-emerald-400 font-bold">{req.formattedFare}</span>
                    </div>
                  </div>

                  <div>
                    {hasCapacity ? (
                      <button
                        onClick={() => handleAcceptRide(req.id)}
                        disabled={actionLoading || vehicle?.status !== 'ACTIVE'}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-500/20 disabled:opacity-50"
                      >
                        <span>Accept & Add to Pool</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <div className="flex items-center gap-1 text-xs text-amber-400 font-mono">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Capacity Full ({seatStats.occupied}/{seatStats.capacity})</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 text-xs">
            No pending ride requests right now. New requests will appear here in real-time.
          </div>
        )}
      </div>
    </div>
  );
};
