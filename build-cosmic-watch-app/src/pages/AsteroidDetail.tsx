import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Zap, Shield, Info, Bell, Target, TrendingUp, AlertTriangle } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip as RechartTooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ScatterChart, Scatter } from 'recharts';
import { fetchAsteroidDetails, Asteroid } from '../api/nasa';
import { useAppStore } from '../store/useStore';
import { cn } from '../utils/cn';
import Asteroid3D from '../components/Asteroid3D';

export default function AsteroidDetail() {
  const { id } = useParams<{ id: string }>();
  const [asteroid, setAsteroid] = useState<Asteroid | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedTimeline, setExpandedTimeline] = useState(false);
  const { unit, toggleWatchlist, watchlist } = useAppStore();

  useEffect(() => {
    if (!id) return;
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchAsteroidDetails(id);
        setAsteroid(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Target className="w-10 h-10 text-accent-blue animate-[spin_3s_linear_infinite]" />
        <span className="ml-4 text-xl font-mono text-white animate-pulse">LOCKED ON SIGNAL...</span>
      </div>
    );
  }

  if (!asteroid) return <div>Asteroid not found.</div>;

  const closeApproach = asteroid.close_approach_data[0];
  const isWatched = watchlist.includes(asteroid.id);

  // Calculate impact probability (simplified model)
  const calculateImpactProbability = (): number => {
    const missDistanceKm = parseFloat(closeApproach?.miss_distance.kilometers || '0');
    const earthRadiusKm = 6371;
    const relativeVelocity = parseFloat(closeApproach?.relative_velocity.kilometers_per_hour || '1');
    
    // Very simplified: if miss distance is within Earth's radius + atmosphere buffer
    if (missDistanceKm < earthRadiusKm + 100) {
      return 0.8; // 80% if it's within Earth's radius buffer
    } else if (missDistanceKm < earthRadiusKm * 2) {
      return 0.15; // 15% if within 2x Earth radius
    } else if (missDistanceKm < 400000) { // Within Moon's orbit
      return 0.01; // 1% if within Moon's orbit
    }
    return 0.0001; // Negligible for far approaches
  };

  // Prepare chart data for velocity profile
  const velocityChartData = asteroid.close_approach_data.slice(0, 20).map((ca, idx) => ({
    date: ca.close_approach_date.substring(0, 7),
    velocity: parseFloat(ca.relative_velocity.kilometers_per_hour),
    missDistance: parseFloat(ca.miss_distance.kilometers) / 1000, // Convert to thousands
  }));

  // Prepare scatter data for miss distance analysis
  const missDistanceData = asteroid.close_approach_data.slice(0, 30).map((ca, idx) => ({
    date: ca.close_approach_date.substring(0, 10),
    missDistance: parseFloat(ca.miss_distance.kilometers) / 1000,
    velocity: parseFloat(ca.relative_velocity.kilometers_per_hour),
  }));

  const radarData = [
    {
      subject: 'Velocity',
      A: Math.min(100, (parseFloat(closeApproach?.relative_velocity.kilometers_per_hour || '0') / 100000) * 100),
      fullMark: 100,
    },
    {
      subject: 'Size',
      A: Math.min(100, (asteroid.estimated_diameter.kilometers.estimated_diameter_max / 2) * 100),
      fullMark: 100,
    },
    {
      subject: 'Proximity',
      A: closeApproach ? 100 - Math.min(100, (parseFloat(closeApproach.miss_distance.lunar) / 50) * 100) : 0,
      fullMark: 100,
    },
    {
      subject: 'Hazard',
      A: asteroid.is_potentially_hazardous_asteroid ? 100 : 20,
      fullMark: 100,
    }
  ];

  const impactProb = calculateImpactProbability();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <Link to="/" className="inline-flex items-center text-accent-blue hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
      </Link>

      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white flex items-center gap-3">
            {asteroid.name}
            {asteroid.is_potentially_hazardous_asteroid && (
              <span className="bg-accent-red/20 text-accent-red text-sm px-3 py-1 rounded-full border border-accent-red/50">
                POTENTIALLY HAZARDOUS
              </span>
            )}
          </h1>
          <p className="text-slate-400 mt-2 font-mono">ID: {asteroid.id} | Abs Magnitude: {asteroid.absolute_magnitude_h}</p>
        </div>
        
        <button
          onClick={() => toggleWatchlist(asteroid.id)}
          className={cn(
            'px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg',
            isWatched 
              ? 'bg-space-600 text-white shadow-black/50 border border-space-500' 
              : 'bg-accent-blue text-space-900 shadow-accent-blue/20 hover:bg-accent-blue/90'
          )}
        >
          <Bell className={cn('w-5 h-5', isWatched && 'fill-white')} />
          {isWatched ? 'Stop Tracking' : 'Track Asteroid'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Profile & Metrics */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
            <div className={cn(
              "absolute inset-0 opacity-10 blur-xl transition-opacity group-hover:opacity-20",
              asteroid.risk_level === 'High' ? 'bg-accent-red' : 
              asteroid.risk_level === 'Medium' ? 'bg-accent-orange' : 'bg-accent-green'
            )} />
            
            <h3 className="text-lg font-bold text-white mb-4 relative z-10 flex items-center gap-2">
              <Shield className="w-5 h-5 text-accent-blue" /> Risk Assessment
            </h3>
            
            <div className="flex items-end gap-4 relative z-10 mb-6">
              <span className={cn(
                "text-6xl font-black",
                asteroid.risk_level === 'High' ? 'text-accent-red' : 
                asteroid.risk_level === 'Medium' ? 'text-accent-orange' : 'text-accent-green'
              )}>
                {asteroid.risk_score}
              </span>
              <span className="text-xl font-bold text-slate-400 mb-2 uppercase">{asteroid.risk_level} RISK</span>
            </div>

            <div className="h-64 w-full -ml-4 relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="#262F40" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Radar name="Risk Vectors" dataKey="A" stroke="#00F0FF" fill="#00F0FF" fillOpacity={0.3} />
                  <RechartTooltip contentStyle={{ backgroundColor: '#151A26', borderColor: '#262F40' }} itemStyle={{ color: '#00F0FF' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-accent-blue" /> Physical Properties
            </h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between border-b border-space-700/50 pb-2">
                <span className="text-slate-400">Min Diameter</span>
                <span className="text-white font-mono">
                  {unit === 'km' 
                    ? asteroid.estimated_diameter.kilometers.estimated_diameter_min.toFixed(3) + ' km'
                    : (asteroid.estimated_diameter.kilometers.estimated_diameter_min * 0.621371).toFixed(3) + ' mi'}
                </span>
              </div>
              <div className="flex justify-between border-b border-space-700/50 pb-2">
                <span className="text-slate-400">Max Diameter</span>
                <span className="text-white font-mono">
                  {unit === 'km' 
                    ? asteroid.estimated_diameter.kilometers.estimated_diameter_max.toFixed(3) + ' km'
                    : (asteroid.estimated_diameter.kilometers.estimated_diameter_max * 0.621371).toFixed(3) + ' mi'}
                </span>
              </div>
              <div className="flex justify-between border-b border-space-700/50 pb-2">
                <span className="text-slate-400">Absolute Magnitude</span>
                <span className="text-white font-mono">{asteroid.absolute_magnitude_h.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Est. Mass (approx)</span>
                <span className="text-white font-mono text-xs">~{(asteroid.estimated_diameter.kilometers.estimated_diameter_max ** 3).toExponential(2)} kg</span>
              </div>
            </div>
          </div>

          <div className={cn("glass-panel p-6 rounded-2xl border", impactProb > 0.01 ? 'border-accent-red/50 bg-accent-red/5' : 'border-accent-green/50 bg-accent-green/5')}>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className={cn("w-5 h-5", impactProb > 0.01 ? 'text-accent-red' : 'text-accent-green')} /> 
              Impact Probability
            </h3>
            <div className="space-y-2">
              <div className={cn("text-4xl font-bold", impactProb > 0.01 ? 'text-accent-red' : 'text-accent-green')}>
                {(impactProb * 100).toFixed(4)}%
              </div>
              <p className="text-xs text-slate-400">
                {impactProb > 0.01 ? 'Close approach detected' : 'Safe distance maintained'}
              </p>
            </div>
          </div>
        </div>

        {/* 3D Visualizer & Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel rounded-2xl h-[500px] relative overflow-hidden flex flex-col">
            <div className="p-4 border-b border-space-700/50 flex justify-between items-center bg-space-800/80 z-10">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-accent-blue" /> 3D Orbital Simulation
              </h3>
              <span className="text-xs text-slate-400 bg-space-900 px-2 py-1 rounded">Interactive • Drag to Rotate</span>
            </div>
            <div className="flex-1 bg-black/50 relative">
              <Asteroid3D 
                size={asteroid.estimated_diameter.kilometers.estimated_diameter_max}
                hazardous={asteroid.is_potentially_hazardous_asteroid}
                asteroid={asteroid}
              />
            </div>
          </div>

          {/* Velocity Profile Chart */}
          <div className="glass-panel p-6 rounded-2xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-accent-blue" /> Velocity Profile (Next 20 Approaches)
            </h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={velocityChartData}>
                  <CartesianGrid stroke="#262F40" />
                  <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} yAxisId="left" />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} yAxisId="right" orientation="right" />
                  <RechartTooltip contentStyle={{ backgroundColor: '#151A26', borderColor: '#262F40' }} />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="velocity" stroke="#00F0FF" dot={false} name="Velocity (km/h)" />
                  <Line yAxisId="right" type="monotone" dataKey="missDistance" stroke="#FF6B6B" dot={false} name="Miss Distance (1000s km)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Miss Distance Analysis */}
          <div className="glass-panel p-6 rounded-2xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-accent-blue" /> Miss Distance Analysis
            </h3>
            <div className="bg-space-900/50 p-4 rounded-lg mb-4 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Closest Approach</span>
                <span className="text-white font-mono">{parseFloat(closeApproach?.miss_distance.kilometers || '0').toLocaleString(undefined, { maximumFractionDigits: 0 })} km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Moon Distance Ratio</span>
                <span className="text-white font-mono">{parseFloat(closeApproach?.miss_distance.lunar || '0').toFixed(2)} × Moon Distance</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Earth Radii Away</span>
                <span className="text-white font-mono">{(parseFloat(closeApproach?.miss_distance.kilometers || '0') / 6371).toFixed(2)}× Earth Radius</span>
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid stroke="#262F40" />
                  <XAxis type="number" dataKey="velocity" tick={{ fill: '#94a3b8', fontSize: 12 }} name="Velocity (km/h)" />
                  <YAxis type="number" dataKey="missDistance" tick={{ fill: '#94a3b8', fontSize: 12 }} name="Miss Distance (1000s km)" />
                  <RechartTooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#151A26', borderColor: '#262F40' }} />
                  <Scatter name="Approaches" data={missDistanceData} fill="#00F0FF" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Extended Approach Timeline */}
          <div className="glass-panel p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-accent-blue" /> Complete Approach History
              </h3>
              <span className="text-xs text-slate-400 bg-space-900 px-2 py-1 rounded">
                {asteroid.close_approach_data.length} records
              </span>
            </div>
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="text-slate-400 border-b border-space-700/50 sticky top-0 bg-space-900/80">
                  <tr>
                    <th className="pb-3 pr-4 font-medium">#</th>
                    <th className="pb-3 px-4 font-medium">Date</th>
                    <th className="pb-3 px-4 font-medium">Velocity</th>
                    <th className="pb-3 px-4 font-medium">Miss Distance</th>
                    <th className="pb-3 px-4 font-medium">Lunar Distance</th>
                    <th className="pb-3 pl-4 font-medium text-right">Body</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-space-700/50 text-slate-300">
                  {asteroid.close_approach_data.map((ca, idx) => (
                    <tr key={idx} className={cn(
                      "hover:bg-space-800/30 transition-colors",
                      idx === 0 && "bg-accent-blue/10 border-l-2 border-accent-blue"
                    )}>
                      <td className="py-2 pr-4 font-mono text-xs text-slate-500">{idx + 1}</td>
                      <td className="py-2 px-4 font-mono text-xs">{ca.close_approach_date}</td>
                      <td className="py-2 px-4">
                        {parseFloat(ca.relative_velocity.kilometers_per_hour).toLocaleString(undefined, { maximumFractionDigits: 0 })} km/h
                      </td>
                      <td className="py-2 px-4">
                        {parseFloat(ca.miss_distance.kilometers).toLocaleString(undefined, { maximumFractionDigits: 0 })} km
                      </td>
                      <td className="py-2 px-4">
                        {parseFloat(ca.miss_distance.lunar).toFixed(2)}×
                      </td>
                      <td className="py-2 pl-4 text-right capitalize text-xs">{ca.orbiting_body}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
