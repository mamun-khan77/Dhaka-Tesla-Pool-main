import React from 'react';
import { MapPin, Navigation, Car, Zap } from 'lucide-react';

interface DhakaMapVisualizerProps {
  selectedPickup?: string;
  selectedDestination?: string;
  onSelectArea?: (area: string) => void;
  activePoolsCount?: number;
}

interface AreaNode {
  name: string;
  x: number;
  y: number;
  zone: string;
  corridor: string;
}

const DHAKA_NODES: AreaNode[] = [
  { name: 'Uttara', x: 250, y: 50, zone: 'North Hub', corridor: 'Airport Road' },
  { name: 'Mirpur', x: 120, y: 140, zone: 'North-West', corridor: 'Metro Spine' },
  { name: 'Banani', x: 260, y: 170, zone: 'Central Commercial', corridor: 'Airport Road & Kemal Ataturk' },
  { name: 'Bashundhara', x: 380, y: 150, zone: 'East Hub', corridor: 'Kuril Link' },
  { name: 'Gulshan 2', x: 320, y: 180, zone: 'Diplomatic North', corridor: 'Gulshan Avenue' },
  { name: 'Gulshan 1', x: 330, y: 240, zone: 'Diplomatic South', corridor: 'Gulshan Avenue' },
  { name: 'Mohakhali', x: 240, y: 250, zone: 'Central Spine', corridor: 'Airport Road / Flyover' },
  { name: 'Farmgate', x: 190, y: 310, zone: 'Central Exchange', corridor: 'Airport Rd & Mirpur Rd' },
  { name: 'Dhanmondi', x: 130, y: 360, zone: 'South-West', corridor: 'Mirpur Road' },
];

const CORRIDOR_EDGES = [
  ['Uttara', 'Banani'],
  ['Banani', 'Gulshan 2'],
  ['Gulshan 2', 'Gulshan 1'],
  ['Banani', 'Mohakhali'],
  ['Gulshan 1', 'Mohakhali'],
  ['Mohakhali', 'Farmgate'],
  ['Farmgate', 'Dhanmondi'],
  ['Mirpur', 'Farmgate'],
  ['Banani', 'Bashundhara'],
  ['Gulshan 2', 'Bashundhara'],
  ['Mirpur', 'Uttara'],
];

export const DhakaMapVisualizer: React.FC<DhakaMapVisualizerProps> = ({
  selectedPickup,
  selectedDestination,
  onSelectArea,
}) => {
  const getNode = (name: string) => DHAKA_NODES.find((n) => n.name === name);

  const pickupNode = selectedPickup ? getNode(selectedPickup) : undefined;
  const destNode = selectedDestination ? getNode(selectedDestination) : undefined;

  return (
    <div className="relative w-full h-[400px] bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl p-4 flex flex-col justify-between">
      {/* Background Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #10b981 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Top Banner Indicator */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-bold text-white tracking-wide uppercase">
            Dhaka Tesla Corridor Network
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> Pickup
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400" /> Destination
          </span>
          <span className="flex items-center gap-1">
            <Car className="w-3 h-3 text-emerald-400" /> Tesla Bullet (Active)
          </span>
        </div>
      </div>

      {/* Interactive SVG Diagram */}
      <div className="relative z-10 w-full h-full my-auto flex items-center justify-center">
        <svg viewBox="0 0 500 420" className="w-full h-full max-h-[340px]">
          <defs>
            {/* Gradient Line for Active Pooling Path */}
            <linearGradient id="activeRouteGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Transit Corridor Lines */}
          {CORRIDOR_EDGES.map(([startName, endName], index) => {
            const start = getNode(startName);
            const end = getNode(endName);
            if (!start || !end) return null;

            const isCurrentTripRoute =
              (selectedPickup === startName && selectedDestination === endName) ||
              (selectedPickup === endName && selectedDestination === startName);

            // Seed demo active pool: Banani -> Mohakhali & Banani -> Gulshan 1
            const isBulletRoute =
              (startName === 'Banani' && endName === 'Mohakhali') ||
              (startName === 'Banani' && endName === 'Gulshan 2') ||
              (startName === 'Gulshan 2' && endName === 'Gulshan 1');

            return (
              <g key={`edge-${index}`}>
                <line
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  stroke={isCurrentTripRoute ? '#06b6d4' : isBulletRoute ? '#10b981' : '#334155'}
                  strokeWidth={isCurrentTripRoute ? 4 : isBulletRoute ? 2.5 : 1.5}
                  strokeDasharray={isCurrentTripRoute ? 'none' : isBulletRoute ? '4 3' : 'none'}
                  strokeOpacity={isCurrentTripRoute ? 1 : isBulletRoute ? 0.8 : 0.4}
                />
              </g>
            );
          })}

          {/* Active Vehicle Icon (Bullet positioned near Banani/Mohakhali corridor) */}
          <g transform="translate(250, 205)" filter="url(#glow)">
            <circle r="14" fill="#0f172a" stroke="#10b981" strokeWidth="2" />
            <foreignObject x="-9" y="-9" width="18" height="18">
              <div className="flex items-center justify-center text-emerald-400">
                <Car className="w-3.5 h-3.5" />
              </div>
            </foreignObject>
            {/* Tooltip on Tesla Bullet */}
            <text x="18" y="4" fill="#10b981" fontSize="10" fontWeight="bold" fontFamily="monospace">
              Bullet (2/3 Seats)
            </text>
          </g>

          {/* Area Nodes */}
          {DHAKA_NODES.map((node) => {
            const isPickup = selectedPickup === node.name;
            const isDest = selectedDestination === node.name;

            return (
              <g
                key={node.name}
                className="cursor-pointer group"
                onClick={() => onSelectArea?.(node.name)}
              >
                {/* Node Ring Halo */}
                {(isPickup || isDest) && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="16"
                    fill="none"
                    stroke={isPickup ? '#10b981' : '#06b6d4'}
                    strokeWidth="2"
                    className="animate-pulse"
                  />
                )}

                {/* Node Center */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isPickup || isDest ? 8 : 6}
                  fill={isPickup ? '#10b981' : isDest ? '#06b6d4' : '#1e293b'}
                  stroke={isPickup ? '#ffffff' : isDest ? '#ffffff' : '#64748b'}
                  strokeWidth="2"
                  className="transition-all duration-200 group-hover:scale-125"
                />

                {/* Node Label */}
                <text
                  x={node.x}
                  y={node.y - 12}
                  textAnchor="middle"
                  fill={isPickup ? '#10b981' : isDest ? '#06b6d4' : '#cbd5e1'}
                  fontSize={isPickup || isDest ? "12" : "11"}
                  fontWeight={isPickup || isDest ? "bold" : "600"}
                  className="select-none transition-colors group-hover:fill-emerald-300"
                >
                  {node.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Bottom Hint */}
      <div className="relative z-10 flex items-center justify-between text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
        <span>Click any node to pick or dropoff</span>
        <div className="flex items-center gap-2 font-mono">
          <span className="text-emerald-400">Banani ⇄ Mohakhali</span>
          <span className="text-slate-500">•</span>
          <span className="text-cyan-400">Banani ⇄ Gulshan 1</span>
        </div>
      </div>
    </div>
  );
};
