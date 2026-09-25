import React, { useState, useEffect } from 'react';
import { Car, Users, RefreshCw, MapPin, Zap, ArrowRight } from 'lucide-react';
import { api } from '../api.ts';
import { Pool } from '../types.ts';

interface PoolsViewProps {
  onBookRide: () => void;
}

export const PoolsView: React.FC<PoolsViewProps> = ({ onBookRide }) => {
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(false);

  const loadPools = async () => {
    setLoading(true);
    try {
      const res = await api.getPools();
      setPools(res.pools);
    } catch (err) {
      console.error('Failed to load pools:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPools();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-slate-900/60 border border-slate-800 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Dhaka Tesla Fleet & Active Pools</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Live Network
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time occupancy and transit corridor status across Dhaka metropolitan hubs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadPools}
            disabled={loading}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={onBookRide}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs shadow-md transition-all"
          >
            Join a Pool
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pools.map((pool) => (
          <div
            key={pool.id}
            className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-5 hover:border-slate-700 transition-colors"
          >
            <div>
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Car className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      Tesla "{pool.vehicle?.name || 'Tesla'}"
                    </h4>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {pool.vehicle?.plateNumber}
                    </p>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                    pool.status === 'FULL'
                      ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                      : pool.status === 'IN_TRANSIT'
                      ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                      : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {pool.status}
                </span>
              </div>

              {/* Route Summary */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1 mb-4">
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Corridor Route
                </div>
                <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{pool.routeSummary || 'Open Dhaka Spine'}</span>
                </div>
              </div>

              {/* Seat Capacity Gauge */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Seat Occupancy:</span>
                  <span className="font-bold text-white font-mono">
                    {pool.occupiedSeats} / {pool.capacity} Seats
                  </span>
                </div>

                {/* 3-Seat Visual Blocks */}
                <div className="grid grid-cols-3 gap-1.5">
                  {Array.from({ length: pool.capacity }).map((_, idx) => {
                    const isOccupied = idx < pool.occupiedSeats;
                    return (
                      <div
                        key={idx}
                        className={`h-2.5 rounded-full transition-colors ${
                          isOccupied ? 'bg-emerald-400' : 'bg-slate-800'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Members in Pool */}
              <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center justify-between">
                  <span>Current Passengers</span>
                  <span className="text-emerald-400">{pool.availableSeats} Left</span>
                </div>

                {pool.members.length > 0 ? (
                  <div className="space-y-1.5">
                    {pool.members.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-950/70 border border-slate-800/60 text-xs"
                      >
                        <span className="font-medium text-slate-300">{m.passengerName}</span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {m.pickup} → {m.destination}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 italic py-1">
                    No riders yet. Ready for dispatch.
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={onBookRide}
              disabled={pool.availableSeats <= 0}
              className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40"
            >
              <span>{pool.availableSeats > 0 ? 'Request Ride on This Route' : 'Pool Full'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
