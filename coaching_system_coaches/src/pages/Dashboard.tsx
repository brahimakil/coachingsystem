import React, { useState, useEffect } from 'react';
import CoachCalendar from '../components/CoachCalendar';
import { MdPeople, MdTaskAlt, MdTrendingUp, MdCheckCircle, MdWarning, MdStar } from 'react-icons/md';
import { useAuth } from '../contexts/AuthContext';
import { dashboardService, DashboardData } from '../services/dashboard.service';
import { getMyRatings, getMyRatingStats, Rating, RatingStats } from '../services/ratings.service';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'ending' | 'expiring'>('all');
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [ratingStats, setRatingStats] = useState<RatingStats | null>(null);

  useEffect(() => {
    const userId = user?.uid || user?.id;
    if (userId) {
      loadDashboardData(userId);
      loadRatings(userId);
    } else {
      setLoading(false);
      setError('User ID not found');
    }
  }, [user]);

  const loadRatings = async (userId: string) => {
    try {
      const [ratingsData, statsData] = await Promise.all([
        getMyRatings(userId),
        getMyRatingStats(userId),
      ]);
      setRatings(ratingsData);
      setRatingStats(statsData);
    } catch (error) {
      console.error('Error loading ratings:', error);
    }
  };

  const loadDashboardData = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading dashboard for user:', userId);
      const data = await dashboardService.getDashboardData(userId);
      console.log('Dashboard data loaded:', data);
      setDashboardData(data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data');
      // Set empty data to avoid infinite loading
      setDashboardData({
        stats: {
          activePlayers: 0,
          pendingTasks: 0,
          completedTasks: 0,
          attendanceRate: 0
        },
        filters: {
          remaining: 0,
          ending: 0,
          expiringSoon: 0
        },
        recentActivities: []
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="loading-spinner">Loading dashboard...</div>
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <div className="dashboard-page">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="dashboard-page">
        <div className="error-message">No data available</div>
      </div>
    );
  }

  const { stats, filters, recentActivities } = dashboardData;

  return (
    <div className="dashboard-page">
      <div className="dashboard-grid">
        {/* Left Column: Stats & Quick Actions */}
        <div className="dashboard-left">
          <div className="stats-grid">
            <div className="stat-card glass-panel">
              <div className="stat-icon blue"><MdPeople /></div>
              <div className="stat-info">
                <h3>{stats.activePlayers}</h3>
                <p>Active Players</p>
              </div>
            </div>
            <div className="stat-card glass-panel">
              <div className="stat-icon green"><MdTaskAlt /></div>
              <div className="stat-info">
                <h3>{stats.pendingTasks}</h3>
                <p>Pending Tasks</p>
              </div>
            </div>
            <div className="stat-card glass-panel">
              <div className="stat-icon purple"><MdCheckCircle /></div>
              <div className="stat-info">
                <h3>{stats.completedTasks}</h3>
                <p>Completed Tasks</p>
              </div>
            </div>
            <div className="stat-card glass-panel">
              <div className="stat-icon orange"><MdTrendingUp /></div>
              <div className="stat-info">
                <h3>{stats.attendanceRate}%</h3>
                <p>Task Completion</p>
              </div>
            </div>
          </div>

          {/* Subscription Filters */}
          <div className="subscription-filters glass-panel">
            <h3>Subscriptions Overview</h3>
            <div className="filter-buttons">
              <button 
                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                <MdPeople /> All Active ({filters.remaining})
              </button>
              <button 
                className={`filter-btn ${filter === 'ending' ? 'active' : ''}`}
                onClick={() => setFilter('ending')}
              >
                <MdWarning /> Ending Soon ({filters.ending})
              </button>
              <button 
                className={`filter-btn ${filter === 'expiring' ? 'active' : ''}`}
                onClick={() => setFilter('expiring')}
              >
                <MdWarning style={{ color: '#f59e0b' }} /> Expiring (7d) ({filters.expiringSoon})
              </button>
            </div>
            <p className="filter-info">
              {filter === 'all' && `You have ${filters.remaining} active subscriptions`}
              {filter === 'ending' && `${filters.ending} subscriptions ending in 7-30 days`}
              {filter === 'expiring' && `${filters.expiringSoon} subscriptions expiring within 7 days`}
            </p>
          </div>

          {/* Recent Activity */}
          <div className="recent-activity glass-panel">
            <h3>Recent Activity</h3>
            {recentActivities.length > 0 ? (
              <ul className="activity-list">
                {recentActivities.map((activity) => (
                  <li key={activity.id}>
                    <span className={`activity-dot ${activity.type}`}></span>
                    <p>{dashboardService.formatActivityMessage(activity)}</p>
                    <span className="activity-time">
                      {dashboardService.getTimeAgo(activity.timestamp)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-secondary">No recent activity</p>
            )}
          </div>

          {/* My Reviews Section */}
          <div className="reviews-section glass-panel">
            <h3><MdStar style={{ color: '#f59e0b', marginRight: '0.5rem' }} />My Reviews</h3>
            {ratingStats && ratingStats.totalReviews > 0 ? (
              <>
                <div className="rating-overview">
                  <div className="rating-big">
                    <span className="rating-number">{ratingStats.averageRating.toFixed(1)}</span>
                    <div className="rating-stars">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <MdStar 
                          key={star} 
                          style={{ color: star <= Math.round(ratingStats.averageRating) ? '#f59e0b' : '#d1d5db' }}
                        />
                      ))}
                    </div>
                    <span className="rating-count">{ratingStats.totalReviews} reviews</span>
                  </div>
                </div>
                <div className="reviews-list">
                  {ratings.slice(0, 3).map((review) => (
                    <div key={review.id} className="review-item">
                      <div className="review-header">
                        <span className="reviewer-name">{review.playerName}</span>
                        <div className="review-stars">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <MdStar 
                              key={star} 
                              size={14}
                              style={{ color: star <= review.rating ? '#f59e0b' : '#d1d5db' }}
                            />
                          ))}
                        </div>
                      </div>
                      {review.review && <p className="review-text">{review.review}</p>}
                      <span className="review-date">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-secondary">No reviews yet</p>
            )}
          </div>
        </div>

        {/* Right Column: Calendar */}
        <div className="dashboard-right">
          <CoachCalendar />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
