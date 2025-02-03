import { Link } from 'react-router-dom';

export const Navigation = () => {
  return (
    <nav className="nav-bar">
      <ul>
        <li><Link to="/">Dashboard</Link></li>
        <li><Link to="/debug">Debug</Link></li>
      </ul>
    </nav>
  );
};
