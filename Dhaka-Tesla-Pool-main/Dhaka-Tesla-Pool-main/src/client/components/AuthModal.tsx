import React, { useState } from 'react';
import { X, Lock, Mail, User, Phone, Car, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../api.ts';
import { User as UserType } from '../types.ts';
import { signInWithGoogle, syncUserProfileToFirestore } from '../firebase.ts';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserType) => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('DhakaTesla2026!');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+8801711223344');
  const [role, setRole] = useState<'PASSENGER' | 'DRIVER'>('PASSENGER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await api.login(email, password);
        onSuccess(res.user);
        onClose();
      } else {
        const res = await api.register({
          name,
          email,
          phone,
          password,
          role,
        });
        onSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPersona = async (personaEmail: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.login(personaEmail, 'DhakaTesla2026!');
      onSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const fbUser = await signInWithGoogle();
      if (!fbUser || !fbUser.email) {
        throw new Error('Google Sign-In was cancelled or did not provide an email.');
      }

      // Sync user profile with Firestore database
      await syncUserProfileToFirestore({
        uid: fbUser.uid,
        name: fbUser.displayName || fbUser.email.split('@')[0],
        email: fbUser.email,
        photoURL: fbUser.photoURL,
        role: 'PASSENGER',
        phone: fbUser.phoneNumber || '+880 1700-000000',
      });

      // Sync with application server session
      const res = await api.firebaseSync({
        email: fbUser.email,
        name: fbUser.displayName || fbUser.email.split('@')[0],
        role: 'PASSENGER',
      });

      onSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Google Sign-In failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Glowing Ambient Gradient */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white">
              {mode === 'login' ? 'Sign In to Dhaka Tesla Pool' : 'Create Commuter Account'}
            </h3>
            <p className="text-xs text-slate-400">
              Access real-time pooling, seats, and transparent fares
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Google Sign-in with Firebase Auth */}
        <div className="mt-4">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-xl text-xs flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-95"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.16 0 9.98 0 12s.45 3.84 1.24 5.42l4.04-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Continue with Google (Firebase Auth)</span>
          </button>
        </div>

        <div className="relative my-3 flex items-center justify-center">
          <div className="border-t border-slate-800 w-full" />
          <span className="bg-slate-900 px-2 text-[10px] text-slate-500 font-mono uppercase">
            or choose demo persona
          </span>
          <div className="border-t border-slate-800 w-full" />
        </div>

        {/* Quick Demo Persona Switcher */}
        <div className="mt-4 p-3 bg-slate-950/60 border border-emerald-500/20 rounded-xl">
          <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold mb-2">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> 1-Click Demo Persona Login:
            </span>
            <span className="text-[10px] text-slate-500 font-normal">No password typing needed</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickPersona('jashim@tesla.dhaka')}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/40 text-left transition-colors"
            >
              <div className="font-bold text-emerald-300 flex items-center gap-1">
                <Car className="w-3 h-3" /> Jashim
              </div>
              <div className="text-[10px] text-slate-400">Driver (Tesla Bullet)</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickPersona('nusrat@tesla.dhaka')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700 text-left transition-colors"
            >
              <div className="font-bold text-white">Nusrat</div>
              <div className="text-[10px] text-slate-400">Passenger (In Pool)</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickPersona('shirin@tesla.dhaka')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700 text-left transition-colors"
            >
              <div className="font-bold text-white">Shirin</div>
              <div className="text-[10px] text-slate-400">Passenger (New Rider)</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickPersona('admin@tesla.dhaka')}
              className="px-2.5 py-1.5 rounded-lg bg-purple-950/40 hover:bg-purple-900/60 border border-purple-800/40 text-left transition-colors"
            >
              <div className="font-bold text-purple-300">Mamun Khan</div>
              <div className="text-[10px] text-slate-400">System Admin</div>
            </button>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex rounded-xl bg-slate-950 p-1 mt-4 border border-slate-800">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              mode === 'login' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(null); }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              mode === 'register' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="mt-3 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Standard Auth Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Farhan Ahmed"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+880 1711 000000"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Account Role</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('PASSENGER')}
                    className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                      role === 'PASSENGER'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    Passenger
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('DRIVER')}
                    className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                      role === 'DRIVER'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    Driver (Tesla)
                  </button>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rider@tesla.dhaka"
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block animate-spin">⏳</span>
            ) : mode === 'login' ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
