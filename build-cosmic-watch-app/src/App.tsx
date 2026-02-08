import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import AsteroidDetail from './pages/AsteroidDetail';
import AlertsPanel from './pages/AlertsPanel';
import OrreryPage from './pages/Orrery';
import Login from './pages/Login';
import Signup from './pages/Signup';
import NotFound from './pages/NotFound';
import { useAppStore } from './store/useStore';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useAppStore((state) => state.user);
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const user = useAppStore((state) => state.user);
  return user ? <Navigate to="/" replace /> : <>{children}</>;
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
        <Route path="/signup" element={<AuthRoute><Signup /></AuthRoute>} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="orrery" element={<OrreryPage />} />
          <Route path="asteroid/:id" element={<AsteroidDetail />} />
          <Route path="alerts" element={<AlertsPanel />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
