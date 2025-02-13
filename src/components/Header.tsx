import '../styles/header.css';

export const Header = () => {
  return (
    <header className="header">
      <div className="header-content">
        <div className="logo-container">
          <img src="/img/yailogo.jpg" alt="YAI Logo" className="logo" />
        </div>
        <h1>Traffic Light Dashboard</h1>
      </div>
    </header>
  );
}; 