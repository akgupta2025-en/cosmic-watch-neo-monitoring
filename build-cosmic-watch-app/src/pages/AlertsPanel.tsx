import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BellRing, ShieldAlert, Trash2, Crosshair } from 'lucide-react';
import { fetchAsteroidDetails, Asteroid } from '../api/nasa';
import { useAppStore } from '../store/useStore';
import { cn } from '../utils/cn';

export default function AlertsPanel() {
  const { watchlist, toggleWatchlist, unit } = useAppStore();
  const [tracked, setTracked] = useState<Asteroid[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadWatchlist = async () => {
      if (watchlist.length === 0) {
        setTracked([]);
        return;
      }
      try {
        setLoading(true);
        // Load details for all tracked items
        const results = await Promise.all(watchlist.map(id => fetchAsteroidDetails(id)));
        setTracked(results);
      } catch (err) {
        console.error('Failed to load watchlist details', err);
      } finally {
        setLoading(false);
      }
    };
    loadWatchlist();
  }, [watchlist]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <BellRing className="w-8 h-8 text-accent-red" /> Deep Space Alerts
          </h1>
          <p className="text-slate-400">Monitoring {watchlist.length} custom flagged objects.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <Crosshair className="w-12 h-12 text-accent-blue animate-[spin_4s_linear_infinite]" />
          <h2 className="text-xl font-mono text-white tracking-widest animate-pulse">SYNCHRONIZING WATCHLIST...</h2>
        </div>
      ) : watchlist.length === 0 ? (
        <div className="glass-panel p-12 rounded-xl text-center space-y-4">
          <ShieldAlert className="w-16 h-16 text-slate-600 mx-auto" />
          <h2 className="text-2xl font-bold text-white">No Active Alerts</h2>
          <p className="text-slate-400 max-w-md mx-auto">
            You are not tracking any near-Earth objects. Return to the dashboard to find objects of interest and flag them for your personal radar.
          </p>
          <Link to="/" className="inline-block mt-4 px-6 py-2 bg-space-700 text-white font-bold rounded-lg hover:bg-space-600">
            Scan Dashboard
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {tracked.map((ast) => {
            const nextApproach = ast.close_approach_data.find(
              (ca) => new Date(ca.close_approach_date) >= new Date()
            ) || ast.close_approach_data[0];

            return (
              <div key={ast.id} className={cn(
                "glass-panel p-6 rounded-2xl relative overflow-hidden group border",
                ast.risk_level === 'High' ? 'border-accent-red/50 shadow-lg shadow-accent-red/10' : 'border-space-700/50'
              )}>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <Link to={`/asteroid/${ast.id}`} className="text-2xl font-bold text-white hover:text-accent-blue transition-colors flex items-center gap-2">
                      {ast.name}
                    </Link>
                    <p className="text-slate-400 font-mono text-sm mt-1">ID: {ast.id}</p>
                  </div>
                  <button
                    onClick={() => toggleWatchlist(ast.id)}
                    className="p-2 bg-space-800 text-slate-400 hover:text-accent-red hover:bg-accent-red/10 rounded-lg transition-colors"
                    title="Remove from watchlist"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="bg-space-800/50 p-4 rounded-xl border border-space-700/30">
                    <p className="text-sm font-medium text-slate-400 mb-1">Next Close Approach</p>
                    <p className="text-xl font-bold text-white font-mono">
                      {nextApproach ? nextApproach.close_approach_date : 'Unknown'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-space-800/50 p-4 rounded-xl border border-space-700/30">
                      <p className="text-sm font-medium text-slate-400 mb-1">Miss Distance</p>
                      <p className="text-lg font-bold text-white">
                        {nextApproach 
                          ? (unit === 'km' 
                              ? parseFloat(nextApproach.miss_distance.kilometers).toLocaleString(undefined, { maximumFractionDigits: 0 }) + ' km'
                              : parseFloat(nextApproach.miss_distance.miles).toLocaleString(undefined, { maximumFractionDigits: 0 }) + ' mi')
                          : 'N/A'}
                      </p>
                    </div>
                    <div className="bg-space-800/50 p-4 rounded-xl border border-space-700/30">
                      <p className="text-sm font-medium text-slate-400 mb-1">Risk Assessment</p>
                      <p className={cn(
                        "text-lg font-bold",
                        ast.risk_level === 'High' ? 'text-accent-red' : 
                        ast.risk_level === 'Medium' ? 'text-accent-orange' : 'text-accent-green'
                      )}>
                        {ast.risk_level} ({ast.risk_score})
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
