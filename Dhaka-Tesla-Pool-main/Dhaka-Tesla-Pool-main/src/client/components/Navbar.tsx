import React, { useState } from 'react';
import { Zap, Car, Shield, User, LogOut, ChevronDown, Sparkles, Compass, Bot } from 'lucide-react';
import { User as UserType } from '../types.ts';
import { api } from '../api.ts';
import { signOutFirebase, auth } from '../firebase.ts';

interface NavbarProps {
  currentUser: UserType | null;
  currentTab: 'home' | 'passenger' | 'driver' | 'admin' | 'pools';
  onSelectTab: (tab: 'home' | 'passenger' | 'driver' | 'admin' | 'pools') => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onUserChange: (user: UserType | null) => void;
  onOpenMapsExplorer?: () => void;
  onOpenGeminiChat?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  currentTab,
  onSelectTab,
  onOpenAuth,
  onUserChange,
  onOpenMapsExplorer,
  onOpenGeminiChat,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await signOutFirebase();
    await api.logout();
    onUserChange(null);
    onSelectTab('home');
  };

  const handleQuickSwitch = async (email: string) => {
    try {
      const res = await api.login(email, 'DhakaTesla2026!');
      onUserChange(res.user);
      setDropdownOpen(false);
      if (res.user.role === 'DRIVER') {
        onSelectTab('driver');
      } else if (res.user.role === 'ADMIN') {
        onSelectTab('admin');
      } else {
        onSelectTab('passenger');
      }
    } catch (err) {
      console.error('Failed to switch user:', err);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Tagline */}
          <div
            onClick={() => onSelectTab('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-400 p-[1px] shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                <Zap className="w-5 h-5 text-emerald-400 fill-emerald-400/30" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-white">
                  Dhaka <span className="text-emerald-400">Tesla</span> Pool
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded">
                  Live
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden md:block">
                Share a seat. Split the fare.
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => onSelectTab('home')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                currentTab === 'home'
                  ? 'bg-slate-800 text-emerald-400'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              Home
            </button>

            <button
              onClick={() => onSelectTab('passenger')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                currentTab === 'passenger'
                  ? 'bg-slate-800 text-emerald-400'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              Book & Passenger
            </button>

            <button
              onClick={() => onSelectTab('pools')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                currentTab === 'pools'
                  ? 'bg-slate-800 text-emerald-400'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              Live Pools
            </button>

            <button
              onClick={() => onSelectTab('driver')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                currentTab === 'driver'
                  ? 'bg-slate-800 text-emerald-400'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Car className="w-3.5 h-3.5 text-emerald-400" />
              Driver Portal
            </button>

            <button
              onClick={() => onSelectTab('admin')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                currentTab === 'admin'
                  ? 'bg-slate-800 text-purple-400'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-purple-400" />
              Admin
            </button>

            {/* Google Maps Grounding Explorer */}
            {onOpenMapsExplorer && (
              <button
                onClick={onOpenMapsExplorer}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-cyan-300 hover:text-cyan-200 hover:bg-cyan-950/40 border border-cyan-500/30 transition-colors flex items-center gap-1.5 ml-1"
                title="Search Dhaka places with Google Maps Grounding (gemini-3.5-flash)"
              >
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden lg:inline">Maps Grounding</span>
              </button>
            )}

            {/* Gemini AI Copilot */}
            {onOpenGeminiChat && (
              <button
                onClick={onOpenGeminiChat}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-300 hover:text-emerald-200 hover:bg-emerald-950/40 border border-emerald-500/30 transition-colors flex items-center gap-1.5"
                title="Chat with Gemini Transit Copilot"
              >
                <Bot className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden lg:inline">AI Copilot</span>
              </button>
            )}
          </nav>

          {/* User Auth & Persona Actions */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors text-left"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-xs font-bold text-emerald-400">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-xs font-bold text-white flex items-center gap-1">
                      {currentUser.name}
                      <span className="text-[10px] px-1 rounded bg-slate-800 text-slate-400 font-mono">
                        {currentUser.role}
                      </span>
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-2 py-1.5 border-b border-slate-800 text-xs">
                      <p className="text-slate-400">Signed in as</p>
                      <p className="font-semibold text-white truncate">{currentUser.email}</p>
                    </div>

                    <div className="py-2">
                      <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-400" /> Switch Persona:
                      </div>
                      <button
                        onClick={() => handleQuickSwitch('jashim@tesla.dhaka')}
                        className="w-full text-left px-2 py-1 text-xs text-slate-300 hover:bg-slate-800 rounded flex items-center justify-between"
                      >
                        <span>Jashim</span>
                        <span className="text-[10px] text-emerald-400">Driver</span>
                      </button>
                      <button
                        onClick={() => handleQuickSwitch('nusrat@tesla.dhaka')}
                        className="w-full text-left px-2 py-1 text-xs text-slate-300 hover:bg-slate-800 rounded flex items-center justify-between"
                      >
                        <span>Nusrat</span>
                        <span className="text-[10px] text-slate-400">Passenger</span>
                      </button>
                      <button
                        onClick={() => handleQuickSwitch('shirin@tesla.dhaka')}
                        className="w-full text-left px-2 py-1 text-xs text-slate-300 hover:bg-slate-800 rounded flex items-center justify-between"
                      >
                        <span>Shirin</span>
                        <span className="text-[10px] text-slate-400">Passenger</span>
                      </button>
                      <button
                        onClick={() => handleQuickSwitch('admin@tesla.dhaka')}
                        className="w-full text-left px-2 py-1 text-xs text-slate-300 hover:bg-slate-800 rounded flex items-center justify-between"
                      >
                        <span>Mamun Khan</span>
                        <span className="text-[10px] text-purple-400">Admin</span>
                      </button>
                    </div>

                    <div className="border-t border-slate-800 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-2 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 rounded flex items-center gap-1.5 font-medium"
                      >
                        <LogOut className="w-3.5 h-3.5" /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="px-3.5 py-1.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg shadow-md shadow-emerald-500/20 transition-all"
                >
                  Join Pool
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Submenu Bar */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-800/60 text-xs">
          <button
            onClick={() => onSelectTab('home')}
            className={currentTab === 'home' ? 'text-emerald-400 font-bold' : 'text-slate-400'}
          >
            Home
          </button>
          <button
            onClick={() => onSelectTab('passenger')}
            className={currentTab === 'passenger' ? 'text-emerald-400 font-bold' : 'text-slate-400'}
          >
            Rides
          </button>
          <button
            onClick={() => onSelectTab('pools')}
            className={currentTab === 'pools' ? 'text-emerald-400 font-bold' : 'text-slate-400'}
          >
            Pools
          </button>
          <button
            onClick={() => onSelectTab('driver')}
            className={currentTab === 'driver' ? 'text-emerald-400 font-bold' : 'text-slate-400'}
          >
            Driver
          </button>
          <button
            onClick={() => onSelectTab('admin')}
            className={currentTab === 'admin' ? 'text-purple-400 font-bold' : 'text-slate-400'}
          >
            Admin
          </button>
        </div>
      </div>
    </header>
  );
};
