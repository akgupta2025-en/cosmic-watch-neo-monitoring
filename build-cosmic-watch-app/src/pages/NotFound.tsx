import { Link } from 'react-router-dom';
import { Orbit } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-4 text-center">
      <Orbit className="w-16 h-16 text-slate-600 animate-[spin_10s_linear_infinite]" />
      <h1 className="text-4xl font-bold text-white">404</h1>
      <p className="text-slate-400">Lost in the void. This sector does not exist.</p>
      <Link to="/" className="mt-4 px-6 py-2 bg-accent-blue text-space-900 font-bold rounded-lg hover:bg-accent-blue/90">
        Return to Base
      </Link>
    </div>
  );
}
