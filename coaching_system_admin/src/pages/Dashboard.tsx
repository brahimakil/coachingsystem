import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Coaches from './Coaches';
import Players from './Players';
import Subscriptions from './Subscriptions';
import { 
  MdDashboard, 
  MdSportsSoccer, 
  MdPeople, 
  MdPayment, 
  MdTask,
  MdLogout,
  MdMenu,
  MdClose
} from 'react-icons/md';
import '../styles/dashboard.css';

const Dashboard = () => {
  const [activeMenu, setActiveMenu] = useState(() => {
    // Get saved menu from localStorage or default to 'dashboard'
    return localStorage.getItem('activeMenu') || 'dashboard';
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleMenuClick = (menuId: string) => {
    setActiveMenu(menuId);
    localStorage.setItem('activeMenu', menuId);
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: MdDashboard },
    { id: 'coaches', label: 'Coaches', icon: MdPeople },
    { id: 'players', label: 'Players', icon: MdSportsSoccer },
    { id: 'subscriptions', label: 'Subscriptions', icon: MdPayment },
    { id: 'tasks', label: 'Tasks', icon: MdTask },
  ];

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-title">{isSidebarOpen ? 'Coach System' : 'CS'}</h2>
          {isSidebarOpen && (
            <button 
              className="sidebar-close-btn"
              onClick={() => setIsSidebarOpen(false)}
              aria-label="Close Sidebar"
            >
              <MdClose size={24} />
            </button>
          )}
        </div>
        
        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`nav-item ${activeMenu === item.id ? 'active' : ''}`}
                onClick={() => handleMenuClick(item.id)}
              >
                <Icon className="nav-icon" />
                {isSidebarOpen && <span className="nav-label">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <MdLogout className="nav-icon" />
            {isSidebarOpen && <span className="nav-label">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <header className="dashboard-header">
          <button 
            className="toggle-sidebar-btn"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-label="Toggle Sidebar"
          >
            {isSidebarOpen ? <MdClose size={24} /> : <MdMenu size={24} />}
          </button>
          <div className="header-user">
            <div className="user-avatar">
              {user?.displayName?.charAt(0).toUpperCase() || 'A'}
            </div>
            <span className="user-name">Welcome, {user?.displayName || 'Admin'}</span>
          </div>
        </header>

        {/* Content Area */}
        <div className="content-area">
          {activeMenu === 'dashboard' ? (
            <>
              <div className="page-header">
                <h1>Dashboard</h1>
                <p className="page-subtitle">Manage your coaching system</p>
              </div>
              
              <div className="dashboard-grid">
                <div className="stat-card">
                  <div className="stat-icon coaches">
                    <MdPeople size={32} />
                  </div>
                  <div className="stat-content">
                    <h3>Total Coaches</h3>
                    <p className="stat-number">0</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon players">
                    <MdSportsSoccer size={32} />
                  </div>
                  <div className="stat-content">
                    <h3>Total Players</h3>
                    <p className="stat-number">0</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon subscriptions">
                    <MdPayment size={32} />
                  </div>
                  <div className="stat-content">
                    <h3>Active Subscriptions</h3>
                    <p className="stat-number">0</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon tasks">
                    <MdTask size={32} />
                  </div>
                  <div className="stat-content">
                    <h3>Pending Tasks</h3>
                    <p className="stat-number">0</p>
                  </div>
                </div>
              </div>
            </>
          ) : activeMenu === 'coaches' ? (
            <Coaches />
          ) : activeMenu === 'players' ? (
            <Players />
          ) : activeMenu === 'subscriptions' ? (
            <Subscriptions />
          ) : (
            <>
              <div className="page-header">
                <h1>{menuItems.find(item => item.id === activeMenu)?.label || 'Dashboard'}</h1>
                <p className="page-subtitle">Manage your coaching system</p>
              </div>
              <div className="content-placeholder">
                <div className="placeholder-icon">
                  {(() => {
                    const item = menuItems.find(m => m.id === activeMenu);
                    const Icon = item?.icon || MdDashboard;
                    return <Icon size={64} />;
                  })()}
                </div>
                <h2>{menuItems.find(item => item.id === activeMenu)?.label}</h2>
                <p>This section is coming soon. Start building your {activeMenu} management here.</p>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
