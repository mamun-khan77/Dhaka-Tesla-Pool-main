import React, { useState } from 'react';
import {
  MapPin,
  Search,
  ExternalLink,
  X,
  Compass,
  Sparkles,
  Bookmark,
  Check,
  Star,
  Navigation,
  Loader2,
} from 'lucide-react';
import { api } from '../api.ts';
import { User } from '../types.ts';
import { saveGroundedPlaceToFirestore, auth } from '../firebase.ts';

interface GoogleMapsGroundingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onSelectLocation?: (locationName: string) => void;
}

interface GroundedPlaceLink {
  title: string;
  uri: string;
  address?: string;
  snippet?: string;
}

const POPULAR_DHAKA_SEARCHES = [
  'Gulshan 2 Circle Tesla pickup point',
  'Banani Road 11 commercial hub',
  'Mohakhali Bus Terminal and Flyover entrance',
  'Bashundhara R/A Kuril interchange',
  'Uttara Sector 3 Metro Station',
  'Dhanmondi 27 Satmasjid Road landmark',
];

export const GoogleMapsGroundingModal: React.FC<GoogleMapsGroundingModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSelectLocation,
}) => {
  const [queryText, setQueryText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [mapsLinks, setMapsLinks] = useState<GroundedPlaceLink[]>([]);
  const [savedSuccessMap, setSavedSuccessMap] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSearch = async (searchTerm?: string) => {
    const term = (searchTerm || queryText).trim();
    if (!term || loading) return;

    setLoading(true);
    setError(null);
    setAnswer(null);
    setMapsLinks([]);

    try {
      // Calls server-side gemini-3.5-flash with googleMaps tool
      const res = await api.searchGoogleMapsGrounding(term);
      setAnswer(res.answer);
      setMapsLinks(res.mapsLinks || []);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve Google Maps grounded results.');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePlace = async (place: GroundedPlaceLink, index: number) => {
    if (!auth.currentUser) {
      alert('Please sign in to bookmark places to your profile.');
      return;
    }
    try {
      await saveGroundedPlaceToFirestore(auth.currentUser.uid, {
        title: place.title,
        uri: place.uri,
        address: place.address,
        snippet: place.snippet,
        area: 'Dhaka',
      });
      setSavedSuccessMap((prev) => ({ ...prev, [index]: true }));
      setTimeout(() => {
        setSavedSuccessMap((prev) => ({ ...prev, [index]: false }));
      }, 3000);
    } catch (err) {
      console.error('Error saving place:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Dhaka Maps Grounding Explorer</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  gemini-3.5-flash
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Live Google Maps verified landmarks, pickup spots & corridor hubs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-5 border-b border-slate-800 space-y-3 bg-slate-900/50">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search Dhaka landmark, circle, hotel or pickup spot (e.g. Gulshan 2)..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
              />
            </div>
            <button
              onClick={() => handleSearch()}
              disabled={loading || !queryText.trim()}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 text-slate-950 disabled:text-slate-600 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-lg shadow-emerald-500/20 shrink-0"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Grounding...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Search Maps</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Suggestions */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
            <span className="text-slate-500 shrink-0 font-mono text-[10px]">Popular:</span>
            {POPULAR_DHAKA_SEARCHES.map((term, i) => (
              <button
                key={i}
                onClick={() => {
                  setQueryText(term);
                  handleSearch(term);
                }}
                className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg whitespace-nowrap transition-colors border border-slate-700/60"
              >
                {term}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-300">
              {error}
            </div>
          )}

          {/* Answer Breakdown */}
          {answer && (
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 font-mono flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Google Maps Grounded Intelligence
              </div>
              <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                {answer}
              </div>
            </div>
          )}

          {/* Grounding Links & Verified Locations List */}
          {mapsLinks.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  Verified Google Maps Places ({mapsLinks.length})
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Grounding Sources & Reviews
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {mapsLinks.map((place, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-slate-950/80 hover:bg-slate-950 border border-slate-800 rounded-2xl transition-all space-y-2 group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                            {place.title}
                          </h4>
                        </div>
                        {place.address && (
                          <p className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Navigation className="w-3 h-3 text-slate-500 shrink-0" />
                            {place.address}
                          </p>
                        )}
                        {place.snippet && (
                          <p className="text-[11px] text-slate-400 italic bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                            "{place.snippet}"
                          </p>
                        )}
                      </div>

                      {/* Direct Links and Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {onSelectLocation && (
                          <button
                            onClick={() => {
                              onSelectLocation(place.title);
                              onClose();
                            }}
                            className="px-2.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-[11px] font-semibold transition-colors"
                            title="Use as booking location"
                          >
                            Select
                          </button>
                        )}

                        <button
                          onClick={() => handleSavePlace(place, idx)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors"
                          title="Save place to Firestore"
                        >
                          {savedSuccessMap[idx] ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Bookmark className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Open in Google Maps link */}
                        <a
                          href={place.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-cyan-400 rounded-xl transition-colors flex items-center gap-1 text-[11px] font-mono"
                          title="Open Google Maps link"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading && !answer && mapsLinks.length === 0 && (
            <div className="py-12 text-center space-y-3">
              <Compass className="w-12 h-12 text-slate-700 mx-auto animate-pulse" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-white">Search Dhaka Places & Hubs</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Type any location in Dhaka above to fetch Google Maps verified routes, pickup landmarks, and clickable maps links grounded with Gemini.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
