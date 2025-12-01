import api from './api';

export interface DashboardStats {
  activePlayers: number;
  pendingTasks: number;
  completedTasks: number;
  attendanceRate: number;
}

export interface SubscriptionFilter {
  remaining: number; // Active subscriptions
  ending: number; // Subscriptions ending within 7-30 days
  expiringSoon: number; // Ending within 7 days
}

export interface RecentActivity {
  id: string;
  type: 'enrollment' | 'task' | 'completion' | 'other';
  message: string;
  timestamp: string;
  playerName?: string;
  taskTitle?: string;
}

export interface DashboardData {
  stats: DashboardStats;
  filters: SubscriptionFilter;
  recentActivities: RecentActivity[];
}

export const dashboardService = {
  /**
   * Fetch comprehensive dashboard data for the logged-in coach
   */
  async getDashboardData(coachId: string): Promise<DashboardData> {
    try {
      const [subscriptions, tasks] = await Promise.all([
        api.get(`/subscriptions?coachId=${coachId}`),
        api.get(`/tasks?coachId=${coachId}`)
      ]);

      const allSubscriptions = subscriptions.data || [];
      const allTasks = tasks.data || [];

      // Calculate stats
      const activeSubscriptions = allSubscriptions.filter((s: any) => s.status === 'active');
      const pendingTasks = allTasks.filter((t: any) => t.status === 'pending');
      const completedTasks = allTasks.filter((t: any) => t.status === 'completed');

      // Calculate attendance rate (completed tasks / total tasks or a simple percentage)
      const totalTasks = allTasks.length;
      const attendanceRate = totalTasks > 0 
        ? Math.round((completedTasks.length / totalTasks) * 100) 
        : 0;

      const stats: DashboardStats = {
        activePlayers: activeSubscriptions.length,
        pendingTasks: pendingTasks.length,
        completedTasks: completedTasks.length,
        attendanceRate
      };

      // Calculate subscription filters
      const now = new Date();
      now.setHours(0, 0, 0, 0); // Start of today
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      let expiringSoon = 0;
      let ending = 0;

      for (const sub of activeSubscriptions) {
        const endDate = new Date(sub.endDate);
        endDate.setHours(23, 59, 59, 999); // End of the end date
        
        // Expiring within 7 days (includes today)
        if (endDate >= now && endDate <= sevenDaysFromNow) {
          expiringSoon++;
        }
        // Ending in 8-30 days
        else if (endDate > sevenDaysFromNow && endDate <= thirtyDaysFromNow) {
          ending++;
        }
      }

      const filters: SubscriptionFilter = {
        remaining: activeSubscriptions.length,
        ending,
        expiringSoon
      };

      // Generate recent activities
      const recentActivities = this.generateRecentActivities(allSubscriptions, allTasks);

      return {
        stats,
        filters,
        recentActivities
      };

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  },

  /**
   * Generate recent activity feed from subscriptions and tasks
   */
  generateRecentActivities(subscriptions: any[], tasks: any[]): RecentActivity[] {
    const activities: RecentActivity[] = [];

    // Add recent enrollments (subscriptions created recently)
    subscriptions
      .filter(sub => sub.createdAt)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .forEach(sub => {
        activities.push({
          id: `enrollment-${sub.id}`,
          type: 'enrollment',
          message: `New player enrollment`,
          timestamp: sub.createdAt,
          playerName: sub.playerName || 'Unknown Player'
        });
      });

    // Add recent task completions
    tasks
      .filter(task => task.status === 'completed' && task.submission?.submittedAt)
      .sort((a, b) => new Date(b.submission.submittedAt).getTime() - new Date(a.submission.submittedAt).getTime())
      .slice(0, 5)
      .forEach(task => {
        activities.push({
          id: `completion-${task.id}`,
          type: 'completion',
          message: `Task completed`,
          timestamp: task.submission.submittedAt,
          playerName: task.playerName || 'Unknown Player',
          taskTitle: task.title
        });
      });

    // Add recently assigned tasks
    tasks
      .filter(task => task.status === 'pending' && task.createdAt)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3)
      .forEach(task => {
        activities.push({
          id: `task-${task.id}`,
          type: 'task',
          message: `Task assigned`,
          timestamp: task.createdAt,
          playerName: task.playerName || 'Unknown Player',
          taskTitle: task.title
        });
      });

    // Sort all activities by timestamp (most recent first) and take top 10
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
  },

  /**
   * Format activity message for display
   */
  formatActivityMessage(activity: RecentActivity): string {
    switch (activity.type) {
      case 'enrollment':
        return `New player ${activity.playerName} registered`;
      case 'completion':
        return `Task "${activity.taskTitle}" completed by ${activity.playerName}`;
      case 'task':
        return `Task "${activity.taskTitle}" assigned to ${activity.playerName}`;
      default:
        return activity.message;
    }
  },

  /**
   * Get time ago string from timestamp
   */
  getTimeAgo(timestamp: string): string {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffMs = now.getTime() - activityTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return activityTime.toLocaleDateString();
  }
};
