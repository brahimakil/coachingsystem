import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Coaches from './Coaches';
import Players from './Players';
import Subscriptions from './Subscriptions';
import Tasks from './Tasks';
import Calendar from './Calendar';
import { dashboardService, type DashboardStats } from '../services/dashboard.service';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { 
  MdDashboard, 
  MdSportsSoccer, 
  MdPeople, 
  MdPayment, 
  MdTask,
  MdLogout,
  MdMenu,
  MdClose,
  MdCalendarToday
} from 'react-icons/md';
import '../styles/dashboard.css';

const Dashboard = () => {
  const [activeMenu, setActiveMenu] = useState(() => {
    // Get saved menu from localStorage or default to 'dashboard'
    return localStorage.getItem('activeMenu') || 'dashboard';
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (activeMenu === 'dashboard') {
      fetchStats();
    }
  }, [activeMenu]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getStatistics();
      setStats(data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

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
    { id: 'calendar', label: 'Calendar', icon: MdCalendarToday },
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
              
              {loading ? (
                <div className="loading">Loading statistics...</div>
              ) : (
                <>
                  <div className="dashboard-grid">
                    <div className="stat-card">
                      <div className="stat-icon coaches">
                        <MdPeople size={32} />
                      </div>
                      <div className="stat-content">
                        <h3>Total Coaches</h3>
                        <p className="stat-number">{stats?.totals.coaches || 0}</p>
                        <p className="stat-detail">Active: {stats?.active.coaches || 0}</p>
                      </div>
                    </div>

                    <div className="stat-card">
                      <div className="stat-icon players">
                        <MdSportsSoccer size={32} />
                      </div>
                      <div className="stat-content">
                        <h3>Total Players</h3>
                        <p className="stat-number">{stats?.totals.players || 0}</p>
                        <p className="stat-detail">Active: {stats?.active.players || 0}</p>
                      </div>
                    </div>

                    <div className="stat-card">
                      <div className="stat-icon subscriptions">
                        <MdPayment size={32} />
                      </div>
                      <div className="stat-content">
                        <h3>Total Subscriptions</h3>
                        <p className="stat-number">{stats?.totals.subscriptions || 0}</p>
                        <p className="stat-detail">Active: {stats?.active.subscriptions || 0}</p>
                      </div>
                    </div>

                    <div className="stat-card">
                      <div className="stat-icon tasks">
                        <MdTask size={32} />
                      </div>
                      <div className="stat-content">
                        <h3>Pending Subscriptions</h3>
                        <p className="stat-number">{stats?.subscriptionsByStatus.pending || 0}</p>
                        <p className="stat-detail">Requires attention</p>
                      </div>
                    </div>
                  </div>

                  {/* Charts Section */}
                  <div className="charts-grid">
                    {/* Monthly Trends Line Chart */}
                    <div className="chart-card">
                      <h3>Monthly Registrations & Subscriptions</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={stats?.monthlyData || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="players" stroke="#8884d8" name="Players" />
                          <Line type="monotone" dataKey="coaches" stroke="#82ca9d" name="Coaches" />
                          <Line type="monotone" dataKey="subscriptions" stroke="#ffc658" name="Subscriptions" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Subscription Status Bar Chart */}
                    <div className="chart-card">
                      <h3>Subscription Status Breakdown</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={[
                          { name: 'Active', count: stats?.subscriptionsByStatus.active || 0 },
                          { name: 'Pending', count: stats?.subscriptionsByStatus.pending || 0 },
                          { name: 'Stopped', count: stats?.subscriptionsByStatus.stopped || 0 },
                          { name: 'Rejected', count: stats?.subscriptionsByStatus.rejected || 0 },
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="count" fill="#8884d8" name="Subscriptions" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Tasks Section */}
                  <div className="tasks-section">
                    <h3>Quick Tasks</h3>
                    <div className="tasks-placeholder">
                      <MdTask size={48} />
                      <p>Task management coming soon. This section will help you track pending approvals, follow-ups, and administrative tasks.</p>
                    </div>
                  </div>
                </>
              )}
            </>
          ) : activeMenu === 'coaches' ? (
            <Coaches />
          ) : activeMenu === 'players' ? (
            <Players />
          ) : activeMenu === 'subscriptions' ? (
            <Subscriptions />
          ) : activeMenu === 'tasks' ? (
            <Tasks />
          ) : activeMenu === 'calendar' ? (
            <Calendar />
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
