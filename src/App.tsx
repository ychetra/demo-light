import './App.css'
import { LabLine } from './components/LabLine'
import { DebugPanel } from './components/DebugPanel'
import './styles/lab.css'
import { ErrorBoundary } from './components/ErrorBoundary'

export default function App() {
  return (
    <ErrorBoundary>
      <div className="app">
        <h1 className="app-title">Smart Light Dashboard</h1>
        <div className="labs-wrapper">
          <LabLine lineNumber={15} />
          <LabLine lineNumber={16} />
        </div>
        <DebugPanel />
      </div>
    </ErrorBoundary>
  );
}
