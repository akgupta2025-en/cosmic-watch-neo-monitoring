import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Telescope, Bell, Activity, User, LogOut, Globe } from 'lucide-react';
import { useAppStore } from '../store/useStore';
import { cn } from '../utils/cn';

export default function Layout() {
  const navigate = useNavigate();
  const { user, unit, setUnit, watchlist, logout } = useAppStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: Activity },
    { name: 'Orrery', path: '/orrery', icon: Globe },
    { name: 'Watchlist & Alerts', path: '/alerts', icon: Bell, badge: watchlist.length },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-space-900 text-slate-300">
      {/* Sidebar */}
      <aside className="w-64 glass-panel border-r border-space-700/50 flex flex-col hidden md:flex z-10">
        <div className="h-16 flex items-center px-6 border-b border-space-700/50">
          <Telescope className="w-6 h-6 text-accent-blue mr-3" />
          <span className="text-xl font-bold text-white tracking-wider font-mono">
            COSMIC<span className="text-accent-blue">WATCH</span>
          </span>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200',
                  isActive
                    ? 'bg-space-700/80 text-white shadow-md shadow-black/20'
                    : 'text-slate-400 hover:bg-space-800 hover:text-white'
                )
              }
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
              {(item.badge || 0) > 0 && (
                <span className="ml-auto bg-accent-red text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-space-700/50 space-y-3">
          <div className="flex items-center bg-space-800 rounded-lg p-3">
            <div className="bg-space-700 rounded-full p-2 mr-3">
              <User className="w-4 h-4 text-accent-blue" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm font-medium transition-colors duration-200"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Decorative background orbits */}
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full border border-space-700/30 opacity-20 pointer-events-none" />
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full border border-space-700/50 opacity-20 pointer-events-none" />

        <header className="h-16 glass-panel border-b border-space-700/50 flex items-center justify-between px-6 z-10 sticky top-0">
          <div className="md:hidden flex items-center">
            <Telescope className="w-6 h-6 text-accent-blue mr-3" />
            <span className="text-lg font-bold text-white tracking-wider font-mono">
              COSMIC<span className="text-accent-blue">WATCH</span>
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-4 text-sm font-medium text-slate-400">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-space-800 border border-space-700">
              <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
              Live API Connection
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex bg-space-800 p-1 rounded-lg border border-space-700">
              <button
                onClick={() => setUnit('km')}
                className={cn(
                  'px-3 py-1 text-xs font-bold rounded-md transition-colors',
                  unit === 'km' ? 'bg-space-600 text-white' : 'text-slate-400 hover:text-white'
                )}
              >
                KM
              </button>
              <button
                onClick={() => setUnit('mi')}
                className={cn(
                  'px-3 py-1 text-xs font-bold rounded-md transition-colors',
                  unit === 'mi' ? 'bg-space-600 text-white' : 'text-slate-400 hover:text-white'
                )}
              >
                MI
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 relative z-0">
          <div className="max-w-7xl mx-auto h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
