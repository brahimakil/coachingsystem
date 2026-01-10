import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { MdMenu, MdLightMode, MdDarkMode, MdNotifications, MdChat, MdSubscriptions, MdEdit, MdStar, MdClose } from 'react-icons/md';
import api from '../services/api';

interface Notification {
  id: string;
  type: 'subscription' | 'chat' | 'task' | 'review';
  title: string;
  message: string;
  time: Date;
  read: boolean;
}

interface TopBarProps {
  toggleSidebar: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ toggleSidebar }) => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadNotifications = async () => {
      const userId = user?.uid || user?.id;
      if (!userId) return;

      try {
        // Load recent subscriptions
        const subsResponse = await api.get(`/subscriptions/coach/${userId}`);
        const recentSubs = (subsResponse.data || [])
          .filter((sub: { status: string }) => sub.status === 'active' || sub.status === 'pending')
          .slice(0, 3)
          .map((sub: { id: string; playerName?: string; status: string; createdAt?: string }) => ({
            id: `sub-${sub.id}`,
            type: 'subscription' as const,
            title: sub.status === 'pending' ? 'New Subscription Request' : 'Subscription Active',
            message: `${sub.playerName || 'A player'} ${sub.status === 'pending' ? 'requested a subscription' : 'subscription is now active'}`,
            time: new Date(sub.createdAt || Date.now()),
            read: false,
          }));

        // Load recent chats
        const chatsResponse = await api.get(`/chat/coach/${userId}/conversations`);
        const recentChats = (chatsResponse.data || [])
          .slice(0, 2)
          .map((chat: { id: string; playerName?: string; updatedAt?: string }) => ({
            id: `chat-${chat.id}`,
            type: 'chat' as const,
            title: 'New Chat Message',
            message: `You have a conversation with ${chat.playerName || 'a player'}`,
            time: new Date(chat.updatedAt || Date.now()),
            read: false,
          }));

        // Load recent reviews
        const reviewsResponse = await api.get(`/ratings/coach/${userId}`);
        const recentReviews = (reviewsResponse.data || [])
          .slice(0, 2)
          .map((review: { id: string; playerName?: string; rating: number; createdAt?: string }) => ({
            id: `review-${review.id}`,
            type: 'review' as const,
            title: 'New Review',
            message: `${review.playerName || 'A player'} gave you ${review.rating} stars`,
            time: new Date(review.createdAt || Date.now()),
            read: false,
          }));

        // Combine and sort by time
        const allNotifications = [...recentSubs, ...recentChats, ...recentReviews]
          .sort((a, b) => b.time.getTime() - a.time.getTime())
          .slice(0, 5);

        setNotifications(allNotifications);
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    };

    loadNotifications();
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'subscription': return <MdSubscriptions />;
      case 'chat': return <MdChat />;
      case 'task': return <MdEdit />;
      case 'review': return <MdStar />;
      default: return <MdNotifications />;
    }
  };

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

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
        
        <div className="notification-wrapper" ref={dropdownRef}>
          <button 
            className="icon-btn" 
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <MdNotifications />
            {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
          </button>

          {showNotifications && (
            <div className="notification-dropdown">
              <div className="notification-header">
                <h4>Notifications</h4>
                {unreadCount > 0 && (
                  <button className="mark-read-btn" onClick={markAllRead}>
                    Mark all read
                  </button>
                )}
                <button className="close-notification-btn" onClick={() => setShowNotifications(false)}>
                  <MdClose />
                </button>
              </div>
              <div className="notification-list">
                {notifications.length > 0 ? (
                  notifications.map(notification => (
                    <div 
                      key={notification.id} 
                      className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                    >
                      <div className={`notification-icon ${notification.type}`}>
                        {getIcon(notification.type)}
                      </div>
                      <div className="notification-content">
                        <p className="notification-title">{notification.title}</p>
                        <p className="notification-message">{notification.message}</p>
                        <span className="notification-time">{getTimeAgo(notification.time)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-notifications">
                    <MdNotifications />
                    <p>No notifications yet</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

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
