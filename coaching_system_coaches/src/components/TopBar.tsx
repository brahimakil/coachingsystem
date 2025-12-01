import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { MdMenu, MdLightMode, MdDarkMode, MdNotifications } from 'react-icons/md';

interface TopBarProps {
  toggleSidebar: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ toggleSidebar }) => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  return (
    <header className="topbar glass-panel">
      <div className="topbar-left">
        <button className="menu-btn" onClick={toggleSidebar}>
          <MdMenu />
        </button>
        <h2 className="page-title">Dashboard</h2>
      </div>

      <div className="topbar-right">
        <button className="icon-btn" onClick={toggleTheme}>
          {theme === 'dark' ? <MdLightMode /> : <MdDarkMode />}
        </button>
        
        <button className="icon-btn">
          <MdNotifications />
          <span className="badge">2</span>
        </button>

        <div className="user-profile">
          <div className="avatar">
            {user?.displayName?.charAt(0) || 'C'}
          </div>
          <div className="user-info">
            <span className="user-name">{user?.displayName || 'Coach'}</span>
            <span className="user-role">Active</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
