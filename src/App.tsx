import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { DashboardPage } from './pages/DashboardPage';
import { DebugPage } from './pages/DebugPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import './App.css';
import './styles/lab.css';

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <div className="app">
          <Navigation />
          <h1 className="app-title">Traffic Light Dashboard</h1>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/debug" element={<DebugPage />} />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  );
}
