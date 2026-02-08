import { useEffect, useState } from 'react';
import { Zap, AlertTriangle } from 'lucide-react';
import { fetchNeoFeed, Asteroid } from '../api/nasa';
import Orrery3D from '../components/Orrery3D';

export default function OrreryPage() {
  const [asteroids, setAsteroids] = useState<Asteroid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchNeoFeed();
        setAsteroids(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch asteroid data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <Zap className="w-12 h-12 text-accent-blue animate-pulse" />
        <h2 className="text-2xl font-mono text-white tracking-widest animate-pulse">INITIALIZING ORRERY...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <AlertTriangle className="w-12 h-12 text-accent-red" />
        <h2 className="text-xl text-white">System Error</h2>
        <p className="text-slate-400">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-space-800 text-white rounded-lg hover:bg-space-700"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Solar System Orrery</h1>
          <p className="text-slate-400">
            Interactive 3D visualization of near-Earth asteroids and planetary orbits. 
            {asteroids.length > 0 && ` Tracking ${Math.min(asteroids.length, 30)} objects.`}
          </p>
        </div>
      </div>

      {/* Info Box */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-space-700/50">
          <div className="text-sm text-slate-400 mb-1">Total Objects</div>
          <div className="text-2xl font-bold text-white">{asteroids.length}</div>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-space-700/50">
          <div className="text-sm text-slate-400 mb-1">Hazardous</div>
          <div className="text-2xl font-bold text-accent-red">
            {asteroids.filter(a => a.is_potentially_hazardous_asteroid).length}
          </div>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-space-700/50">
          <div className="text-sm text-slate-400 mb-1">High Risk</div>
          <div className="text-2xl font-bold text-accent-red">
            {asteroids.filter(a => a.risk_level === 'High').length}
          </div>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-space-700/50">
          <div className="text-sm text-slate-400 mb-1">Low Risk</div>
          <div className="text-2xl font-bold text-accent-green">
            {asteroids.filter(a => a.risk_level === 'Low').length}
          </div>
        </div>
      </div>

      {/* 3D Visualization */}
      <div className="flex-1 glass-panel rounded-xl border border-space-700/50 overflow-hidden shadow-2xl min-h-[600px]">
        <Orrery3D asteroids={asteroids} />
      </div>

      {/* Controls Info */}
      <div className="glass-panel p-4 rounded-xl border border-space-700/50 text-sm text-slate-400">
        <p className="font-semibold text-white mb-2">🎮 Controls:</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div>
            <span className="text-accent-blue">Left Mouse</span> - Rotate view
          </div>
          <div>
            <span className="text-accent-blue">Right Mouse</span> - Pan view
          </div>
          <div>
            <span className="text-accent-blue">Scroll</span> - Zoom in/out
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          🔴 Red asteroids are potentially hazardous • 🟢 Green asteroids are safe
        </p>
      </div>
    </div>
  );
}
