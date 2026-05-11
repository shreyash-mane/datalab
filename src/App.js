import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useDataLabStore } from './store/dataLabStore';
import AuthPage from './AuthPage';
import LandingPage from './LandingPage';
import SharedNav from './SharedNav';
import FinderApp from './finder/FinderApp';
import DebuggerApp from './debugger/DebuggerApp';
import VisualizerApp from './visualizer/VisualizerApp';
import StatAnalyzerApp from './analyzer/StatAnalyzerApp';
import InsightsApp from './insights/InsightsApp';

function ProtectedRoute({ children }) {
  const { datalabUser } = useDataLabStore();
  if (!datalabUser) return <Navigate to="/" replace />;
  return children;
}

function WithNav({ children }) {
  return <><SharedNav />{children}</>;
}

// Handles redirect from Google / GitHub OAuth
// Backend sends: /auth/callback?token=...&name=...&email=...
function AuthCallback() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const { loginDataLab } = useDataLabStore();

  useEffect(() => {
    const params = new URLSearchParams(search);
    const token = params.get('token');
    const name  = params.get('name');
    const email = params.get('email');
    if (token && name && email) {
      localStorage.setItem('token', token);
      loginDataLab({ name, email });
      navigate('/home', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#030712', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6fa3ef', fontFamily: 'sans-serif', fontSize: 14 }}>
      Signing you in...
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/home" element={<ProtectedRoute><WithNav><LandingPage /></WithNav></ProtectedRoute>} />
        <Route path="/finder/*" element={<ProtectedRoute><WithNav><FinderApp /></WithNav></ProtectedRoute>} />
        <Route path="/debugger/*" element={<ProtectedRoute><WithNav><DebuggerApp /></WithNav></ProtectedRoute>} />
        <Route path="/visualizer/*" element={<ProtectedRoute><WithNav><VisualizerApp /></WithNav></ProtectedRoute>} />
        <Route path="/analyzer/*" element={<ProtectedRoute><WithNav><StatAnalyzerApp /></WithNav></ProtectedRoute>} />
        <Route path="/insights/*" element={<ProtectedRoute><WithNav><InsightsApp /></WithNav></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
