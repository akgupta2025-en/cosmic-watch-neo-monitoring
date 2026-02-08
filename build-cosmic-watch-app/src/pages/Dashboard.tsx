import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Info, Search, Zap, Activity } from 'lucide-react';
import { fetchNeoFeed, Asteroid } from '../api/nasa';
import { useAppStore } from '../store/useStore';
import { cn } from '../utils/cn';

export default function Dashboard() {
  const [asteroids, setAsteroids] = useState<Asteroid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { unit, toggleWatchlist, watchlist } = useAppStore();

  const [filterHazardous, setFilterHazardous] = useState<'all' | 'hazardous' | 'safe'>('all');
  const [search, setSearch] = useState('');

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

  const filteredAsteroids = useMemo(() => {
    return asteroids.filter((ast) => {
      if (filterHazardous === 'hazardous' && !ast.is_potentially_hazardous_asteroid) return false;
      if (filterHazardous === 'safe' && ast.is_potentially_hazardous_asteroid) return false;
      if (search && !ast.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [asteroids, filterHazardous, search]);

  const stats = useMemo(() => {
    return {
      total: asteroids.length,
      hazardous: asteroids.filter((a) => a.is_potentially_hazardous_asteroid).length,
      highRisk: asteroids.filter((a) => a.risk_level === 'High').length,
      avgVelocity: asteroids.reduce((acc, a) => acc + parseFloat(a.close_approach_data[0]?.relative_velocity.kilometers_per_hour || '0'), 0) / (asteroids.length || 1),
    };
  }, [asteroids]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <Zap className="w-12 h-12 text-accent-blue animate-pulse" />
        <h2 className="text-2xl font-mono text-white tracking-widest animate-pulse">ACQUIRING TELEMETRY...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <AlertTriangle className="w-12 h-12 text-accent-red" />
        <h2 className="text-xl text-white">System Error</h2>
        <p className="text-slate-400">{error}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-space-800 text-white rounded-lg hover:bg-space-700">Retry Connection</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Orbital Activity</h1>
          <p className="text-slate-400">Monitoring {stats.total} near-Earth objects over the next 7 days.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Tracked Objects', value: stats.total, icon: Info, color: 'text-accent-blue', bg: 'bg-accent-blue/10' },
          { label: 'Hazardous Flag', value: stats.hazardous, icon: AlertTriangle, color: 'text-accent-orange', bg: 'bg-accent-orange/10' },
          { label: 'High Risk Alert', value: stats.highRisk, icon: Zap, color: 'text-accent-red', bg: 'bg-accent-red/10' },
          { label: 'Avg Velocity (kph)', value: stats.avgVelocity.toLocaleString(undefined, { maximumFractionDigits: 0 }), icon: Activity, color: 'text-accent-purple', bg: 'bg-accent-purple/10' },
        ].map((stat, i) => (
          <div key={i} className="glass-panel p-4 rounded-xl flex items-center space-x-4">
            <div className={cn('p-3 rounded-xl', stat.bg)}>
              <stat.icon className={cn('w-6 h-6', stat.color)} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">{stat.label}</p>
              <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="glass-panel p-4 rounded-xl flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="flex flex-wrap gap-2">
          {['all', 'hazardous', 'safe'].map((filter) => (
            <button
              key={filter}
              onClick={() => setFilterHazardous(filter as any)}
              className={cn(
                'px-4 py-2 text-sm font-semibold rounded-lg capitalize transition-colors',
                filterHazardous === filter ? 'bg-space-600 text-white shadow-inner' : 'bg-space-800 text-slate-400 hover:text-white'
              )}
            >
              {filter}
            </button>
          ))}
        </div>
        
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by designation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-space-800 border border-space-700 text-white text-sm rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent-blue/50"
          />
        </div>
      </div>

      {/* List */}
      <div className="glass-panel rounded-xl overflow-hidden border border-space-700/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-space-800/50 text-slate-400 font-medium">
              <tr>
                <th className="px-6 py-4">Designation</th>
                <th className="px-6 py-4">Close Approach</th>
                <th className="px-6 py-4">Size (Max)</th>
                <th className="px-6 py-4">Miss Distance</th>
                <th className="px-6 py-4">Velocity</th>
                <th className="px-6 py-4 text-center">Risk Level</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-space-700/50 text-slate-300">
              {filteredAsteroids.map((ast) => {
                const closeApproach = ast.close_approach_data[0];
                if (!closeApproach) return null;

                const size = unit === 'km' 
                  ? ast.estimated_diameter.kilometers.estimated_diameter_max 
                  : ast.estimated_diameter.kilometers.estimated_diameter_max * 0.621371;
                
                const distance = unit === 'km'
                  ? parseFloat(closeApproach.miss_distance.kilometers)
                  : parseFloat(closeApproach.miss_distance.miles);
                  
                const velocity = unit === 'km'
                  ? parseFloat(closeApproach.relative_velocity.kilometers_per_hour)
                  : parseFloat(closeApproach.relative_velocity.miles_per_hour);

                return (
                  <tr key={ast.id} className="hover:bg-space-800/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-white flex items-center gap-2">
                      {ast.is_potentially_hazardous_asteroid && (
                        <AlertTriangle className="w-4 h-4 text-accent-orange" />
                      )}
                      {ast.name}
                    </td>
                    <td className="px-6 py-4">{closeApproach.close_approach_date}</td>
                    <td className="px-6 py-4">{size.toFixed(2)} {unit}</td>
                    <td className="px-6 py-4">{distance.toLocaleString(undefined, { maximumFractionDigits: 0 })} {unit}</td>
                    <td className="px-6 py-4">{velocity.toLocaleString(undefined, { maximumFractionDigits: 0 })} {unit}/h</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <span className={cn(
                          'px-2.5 py-1 text-xs font-bold rounded-full',
                          ast.risk_level === 'High' && 'bg-accent-red/20 text-accent-red',
                          ast.risk_level === 'Medium' && 'bg-accent-orange/20 text-accent-orange',
                          ast.risk_level === 'Low' && 'bg-accent-green/20 text-accent-green',
                        )}>
                          {ast.risk_level} ({ast.risk_score})
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => toggleWatchlist(ast.id)}
                        className={cn(
                          'px-3 py-1.5 text-xs font-semibold rounded-md transition-colors',
                          watchlist.includes(ast.id) ? 'bg-space-600 text-white' : 'bg-space-800 text-slate-400 hover:text-white'
                        )}
                      >
                        {watchlist.includes(ast.id) ? 'Tracking' : 'Track'}
                      </button>
                      <Link
                        to={`/asteroid/${ast.id}`}
                        className="inline-block px-3 py-1.5 text-xs font-semibold bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/20 rounded-md transition-colors"
                      >
                        Analyze
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {filteredAsteroids.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No orbital objects match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
