import { Injectable, Inject } from '@nestjs/common';
import { Firestore } from 'firebase-admin/firestore';

@Injectable()
export class DashboardService {
  constructor(@Inject('FIRESTORE') private firestore: Firestore) {}

  async getStatistics() {
    // Get all collections
    const [playersSnapshot, coachesSnapshot, subscriptionsSnapshot] = await Promise.all([
      this.firestore.collection('players').get(),
      this.firestore.collection('coaches').get(),
      this.firestore.collection('subscriptions').get(),
    ]);

    // Total counts
    const totalPlayers = playersSnapshot.size;
    const totalCoaches = coachesSnapshot.size;
    const totalSubscriptions = subscriptionsSnapshot.size;

    // Active counts
    const activePlayers = playersSnapshot.docs.filter(doc => doc.data().status === 'active').length;
    const activeCoaches = coachesSnapshot.docs.filter(doc => doc.data().status === 'active').length;
    const activeSubscriptions = subscriptionsSnapshot.docs.filter(doc => doc.data().status === 'active').length;

    // Subscription status breakdown
    const subscriptionsByStatus = {
      active: 0,
      pending: 0,
      rejected: 0,
      stopped: 0,
    };

    subscriptionsSnapshot.docs.forEach(doc => {
      const status = doc.data().status;
      if (subscriptionsByStatus.hasOwnProperty(status)) {
        subscriptionsByStatus[status]++;
      }
    });

    // Monthly data for last 6 months
    const monthlyData = this.getMonthlyData(playersSnapshot.docs, coachesSnapshot.docs, subscriptionsSnapshot.docs);

    return {
      totals: {
        players: totalPlayers,
        coaches: totalCoaches,
        subscriptions: totalSubscriptions,
      },
      active: {
        players: activePlayers,
        coaches: activeCoaches,
        subscriptions: activeSubscriptions,
      },
      subscriptionsByStatus,
      monthlyData,
    };
  }

  private getMonthlyData(players: any[], coaches: any[], subscriptions: any[]) {
    const months: Array<{ month: string; players: number; coaches: number; subscriptions: number }> = [];
    const now = new Date();

    // Generate last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleString('default', { month: 'short' });
      const year = date.getFullYear();
      const monthKey = `${monthName} ${year}`;

      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

      // Helper function to safely convert createdAt to Date
      const getCreatedAtDate = (doc: any): Date | null => {
        try {
          const data = doc.data();
          if (!data.createdAt) return null;
          
          // If it's a Firestore Timestamp
          if (typeof data.createdAt.toDate === 'function') {
            return data.createdAt.toDate();
          }
          
          // If it's already a Date object
          if (data.createdAt instanceof Date) {
            return data.createdAt;
          }
          
          // If it's a string, try to parse it
          if (typeof data.createdAt === 'string') {
            return new Date(data.createdAt);
          }
          
          return null;
        } catch (error) {
          return null;
        }
      };

      // Count new registrations/subscriptions in this month
      const playersCount = players.filter(doc => {
        const createdAt = getCreatedAtDate(doc);
        return createdAt && createdAt >= startOfMonth && createdAt <= endOfMonth;
      }).length;

      const coachesCount = coaches.filter(doc => {
        const createdAt = getCreatedAtDate(doc);
        return createdAt && createdAt >= startOfMonth && createdAt <= endOfMonth;
      }).length;

      const subscriptionsCount = subscriptions.filter(doc => {
        const createdAt = getCreatedAtDate(doc);
        return createdAt && createdAt >= startOfMonth && createdAt <= endOfMonth;
      }).length;

      months.push({
        month: monthKey,
        players: playersCount,
        coaches: coachesCount,
        subscriptions: subscriptionsCount,
      });
    }

    return months;
  }
}
