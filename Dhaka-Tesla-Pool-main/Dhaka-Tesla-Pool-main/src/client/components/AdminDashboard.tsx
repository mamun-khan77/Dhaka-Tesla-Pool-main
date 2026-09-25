import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  Car,
  TrendingUp,
  RefreshCw,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Database,
  Search,
} from 'lucide-react';
import { api } from '../api.ts';
import { User, Vehicle, Ride, Pool, SystemStats } from '../types.ts';

interface AdminDashboardProps {
  currentUser: User | null;
  onOpenAuth: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  onOpenAuth,
}) => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [rides, setRides] = useState<Ride[]>([]);
  const [activeTab, setActiveTab] = useState<'rides' | 'users' | 'vehicles'>('rides');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = async () => {
    if (!currentUser || currentUser.role !== 'ADMIN') return;
    setLoading(true);
    try {
      const [statsRes, usersRes, vehiclesRes, ridesRes] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers(),
        api.getAdminVehicles(),
        api.getAdminRides(),
      ]);

      setStats(statsRes.statistics);
      setUsers(usersRes.users);
      setVehicles(vehiclesRes.vehicles);
      setRides(ridesRes.rides);
    } catch (err: any) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const handleResetSeed = async () => {
    if (!confirm('Reset entire system database to the default seed characters (Jashim, Bullet, Nusrat, Rafiq, Shirin)?')) return;
    setLoading(true);
    try {
      const res = await api.resetSeedData();
      setFeedback(res.message);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <Shield className="w-12 h-12 text-purple-400 mx-auto" />
        <h3 className="text-xl font-bold text-white">Admin Console Restricted</h3>
        <p className="text-xs text-slate-400">
          Sign in as system administrator (Mamun Khan) to view metrics, fleet status, and full database records.
        </p>
        <button
          onClick={onOpenAuth}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs shadow-lg transition-all"
        >
          Sign In as Admin (Mamun Khan)
        </button>
      </div>
    );
  }

  const filteredRides = rides.filter((r) =>
    (r.passengerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.pickupArea.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.destinationArea.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-slate-900/60 border border-slate-800 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">System Administration</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/10 text-purple-300 border border-purple-500/30">
                Mamun Khan
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live observability, state inspection, and database integrity control.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleResetSeed}
            disabled={loading}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Seed</span>
          </button>

          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{feedback}</span>
        </div>
      )}

      {/* KPI Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl">
            <div className="text-[11px] text-slate-400 uppercase font-semibold">Total Rides</div>
            <div className="text-2xl font-extrabold text-white mt-1">{stats.totalRides}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {stats.completedRides} Completed • {stats.cancelledRides} Cancelled
            </div>
          </div>

          <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl">
            <div className="text-[11px] text-slate-400 uppercase font-semibold">Registered Users</div>
            <div className="text-2xl font-extrabold text-emerald-400 mt-1">{stats.totalUsers}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {stats.totalPassengers} Passengers • {stats.totalDrivers} Drivers
            </div>
          </div>

          <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl">
            <div className="text-[11px] text-slate-400 uppercase font-semibold">Active Pools</div>
            <div className="text-2xl font-extrabold text-cyan-400 mt-1">{stats.activePools}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {stats.totalVehicles} Registered Vehicles
            </div>
          </div>

          <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl">
            <div className="text-[11px] text-slate-400 uppercase font-semibold">Platform Revenue</div>
            <div className="text-2xl font-extrabold text-purple-400 mt-1">
              {stats.totalRevenueFormatted}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {stats.totalRevenuePoisha} Poisha Total
            </div>
          </div>
        </div>
      )}

      {/* Tabs & Search */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
            <button
              onClick={() => setActiveTab('rides')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'rides' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Rides ({rides.length})
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'users' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Users ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('vehicles')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'vehicles' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Vehicles ({vehicles.length})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* Tab 1: Rides Table */}
        {activeTab === 'rides' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-mono">
                <tr>
                  <th className="pb-3">Ride ID</th>
                  <th className="pb-3">Passenger</th>
                  <th className="pb-3">Route</th>
                  <th className="pb-3">Vehicle</th>
                  <th className="pb-3">Fare</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredRides.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/40">
                    <td className="py-3 font-mono text-slate-400">{r.id.substring(0, 12)}...</td>
                    <td className="py-3 text-white font-bold">{r.passengerName || 'Commuter'}</td>
                    <td className="py-3 text-slate-300">
                      {r.pickupArea} → {r.destinationArea} ({r.seatsRequested} seat)
                    </td>
                    <td className="py-3 text-slate-400">{r.vehicleName || 'None'}</td>
                    <td className="py-3 font-mono text-emerald-400 font-bold">{r.formattedFare}</td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                          r.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : r.status === 'CANCELLED'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 text-slate-500 font-mono">
                      {new Date(r.createdAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Users Table */}
        {activeTab === 'users' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-mono">
                <tr>
                  <th className="pb-3">Name</th>
                  <th className="pb-3">Email</th>
                  <th className="pb-3">Phone</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40">
                    <td className="py-3 text-white font-bold">{u.name}</td>
                    <td className="py-3 font-mono text-slate-300">{u.email}</td>
                    <td className="py-3 font-mono text-slate-400">{u.phone}</td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-500/10 text-purple-300 border border-purple-500/30'
                            : u.role === 'DRIVER'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 text-slate-500 font-mono">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '2026-09-25'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Vehicles Table */}
        {activeTab === 'vehicles' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-mono">
                <tr>
                  <th className="pb-3">Vehicle Name</th>
                  <th className="pb-3">Model</th>
                  <th className="pb-3">Plate Number</th>
                  <th className="pb-3">Capacity</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {vehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-800/40">
                    <td className="py-3 text-white font-bold">{v.name}</td>
                    <td className="py-3 text-slate-300">{v.model}</td>
                    <td className="py-3 font-mono text-slate-400">{v.plateNumber}</td>
                    <td className="py-3 font-bold font-mono text-emerald-400">
                      {v.capacity} Seats (Max)
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                          v.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {v.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
