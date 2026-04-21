import { Routes, Route, Navigate } from 'react-router-dom';
import UploadPage from './components/UploadPage';
import PipelineBuilder from './components/PipelineBuilder';
import DebuggerPage from './components/DebuggerPage';

export default function DebuggerApp() {
  return (
    <Routes>
      <Route index element={<UploadPage />} />
      <Route path="pipeline/:pipelineId" element={<PipelineBuilder />} />
      <Route path="debug/:pipelineId/:runId" element={<DebuggerPage />} />
      <Route path="*" element={<Navigate to="/debugger" replace />} />
    </Routes>
  );
}
