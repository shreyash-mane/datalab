import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './LandingPage';
import SharedNav from './SharedNav';
import FinderApp from './finder/FinderApp';
import DebuggerApp from './debugger/DebuggerApp';
import VisualizerApp from './visualizer/VisualizerApp';
import StatAnalyzerApp from './analyzer/StatAnalyzerApp';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/finder/*" element={<><SharedNav /><FinderApp /></>} />
        <Route path="/debugger/*" element={<><SharedNav /><DebuggerApp /></>} />
        <Route path="/visualizer/*" element={<><SharedNav /><VisualizerApp /></>} />
        <Route path="/analyzer/*" element={<><SharedNav /><StatAnalyzerApp /></>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
