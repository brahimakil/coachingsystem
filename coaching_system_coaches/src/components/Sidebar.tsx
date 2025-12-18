import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MdDashboard, MdPeople, MdTask, MdChat, MdLogout, MdClose } from 'react-icons/md';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/dashboard', icon: MdDashboard, label: 'Overview' },
    { path: '/dashboard/players', icon: MdPeople, label: 'My Players' },
    { path: '/dashboard/tasks', icon: MdTask, label: 'Tasks' },
    { path: '/dashboard/chat', icon: MdChat, label: 'Live Chat' },
  ];

  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <div className="logo">
          <span className="logo-icon">⚽</span>
          <span className="logo-text">CoachPanel</span>
        </div>
        <button className="close-btn" onClick={toggleSidebar}>
          <MdClose />
        </button>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            end={item.path === '/dashboard'}
          >
            <span className="nav-icon-wrapper">
              <item.icon className="nav-icon" />
            </span>
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="nav-item logout-btn" onClick={handleLogout}>
          <span className="nav-icon-wrapper">
            <MdLogout className="nav-icon" />
          </span>
          <span className="nav-label">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
