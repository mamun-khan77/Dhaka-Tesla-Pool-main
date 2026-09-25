import React from 'react';
import { Zap, ShieldCheck, MapPin, ExternalLink, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md text-slate-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Zap className="w-4 h-4 fill-emerald-400" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Dhaka <span className="text-emerald-400">Tesla</span> Pool
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              “Share a seat. Split the fare. Survive Dhaka traffic.” 
              An electric, whisper-quiet corridor ride-pooling network connecting Banani, Gulshan, Mohakhali, Mirpur, Uttara, and Dhanmondi.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-950/60 border border-emerald-800/50 text-emerald-300">
                <Zap className="w-3 h-3" /> 100% Zero Emission
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-cyan-950/60 border border-cyan-800/50 text-cyan-300">
                <ShieldCheck className="w-3 h-3" /> Strict 3-Seat Capacity
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-950/60 border border-purple-800/50 text-purple-300">
                <MapPin className="w-3 h-3" /> Dhaka Central Hubs
              </span>
            </div>
          </div>

          {/* Dhaka Hubs */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">
              Covered Zones
            </h4>
            <ul className="text-sm space-y-1.5 text-slate-400">
              <li>• Banani & Gulshan 1 & 2</li>
              <li>• Mohakhali Flyover Corridor</li>
              <li>• Dhanmondi & Farmgate</li>
              <li>• Mirpur & Uttara Spine</li>
              <li>• Bashundhara & Kuril</li>
            </ul>
          </div>

          {/* Quick Demo Credentials */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">
              Seed Personas
            </h4>
            <ul className="text-xs space-y-1 text-slate-400 font-mono">
              <li><strong className="text-slate-200">Driver:</strong> jashim@tesla.dhaka</li>
              <li><strong className="text-slate-200">Riders:</strong> nusrat@, rafiq@, shirin@</li>
              <li><strong className="text-slate-200">Admin:</strong> admin@tesla.dhaka</li>
              <li className="text-emerald-400 pt-1">Pass: DhakaTesla2026!</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar with Required Mamun Khan Credit */}
        <div className="pt-8 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1">
            <span>© 2026 Dhaka Tesla Pool.</span>
            <span>Made with precision by</span>
            <a
              href="https://aamkhan.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 transition-colors underline decoration-emerald-500/40 hover:decoration-emerald-400"
            >
              Mamun Khan
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>Transparent Pricing: baseFare + distanceCharge - poolDiscount</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
