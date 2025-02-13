import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaBug, FaChartBar } from 'react-icons/fa';
import '../styles/nav.css';

export const Navigation = () => {
  const location = useLocation();

  return (
    <nav className="nav-bar">
      <div className="nav-container">
        <div className="nav-brand">
          <img src="/img/yailogo.jpg" alt="YAI Logo" className="nav-logo" />
        </div>
        <ul className="nav-links">
          <li>
            <Link 
              to="/" 
              className={location.pathname === '/' ? 'active' : ''}
            >
              <FaHome className="nav-icon" />
              <span>Dashboard</span>
            </Link>
          </li>
          <li>
            <Link 
              to="/report" 
              className={location.pathname === '/report' ? 'active' : ''}
            >
              <FaChartBar className="nav-icon" />
              <span>Report</span>
            </Link>
          </li>
          <li>
            <Link 
              to="/debug" 
              className={location.pathname === '/debug' ? 'active' : ''}
            >
              <FaBug className="nav-icon" />
              <span>Debug</span>
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};
