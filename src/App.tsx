import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { DashboardPage } from './pages/DashboardPage';
import { ReportPage } from './pages/ReportPage';
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
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/report" element={
              <ErrorBoundary>
                <ReportPage />
              </ErrorBoundary>
            } />
            <Route path="/debug" element={<DebugPage />} />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  );
}
