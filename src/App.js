import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthPage />} />
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
