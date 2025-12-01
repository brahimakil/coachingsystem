import { Injectable, Inject } from '@nestjs/common';
import { Firestore } from 'firebase-admin/firestore';

@Injectable()
export class CalendarService {
  private readonly subscriptionsCollection = 'subscriptions';
  private readonly tasksCollection = 'tasks';
  private readonly playersCollection = 'players';
  private readonly coachesCollection = 'coaches';

  constructor(
    @Inject('FIRESTORE')
    private readonly firestore: Firestore,
  ) {}

  async getCalendarData() {
    console.log('Fetching calendar data...');

    try {
      // Fetch all data in parallel
      const [subscriptionsSnapshot, tasksSnapshot, playersSnapshot, coachesSnapshot] = await Promise.all([
        this.firestore.collection(this.subscriptionsCollection).get(),
        this.firestore.collection(this.tasksCollection).get(),
        this.firestore.collection(this.playersCollection).get(),
        this.firestore.collection(this.coachesCollection).get(),
      ]);

      // Build maps for quick lookups
      const playersMap = new Map();
      playersSnapshot.forEach((doc) => {
        const data = doc.data();
        playersMap.set(doc.id, data.fullName || data.name || 'Unknown Player');
      });

      const coachesMap = new Map();
      const coachAvailability: any[] = [];
      coachesSnapshot.forEach((doc) => {
        const data = doc.data();
        const coachName = data.fullName || data.name || 'Unknown Coach';
        coachesMap.set(doc.id, coachName);

        // Extract availability information
        if (data.availableDays && Array.isArray(data.availableDays)) {
          const timeSlots: any[] = [];
          
          // Parse time slots from the coach data
          if (data.timeSlots && Array.isArray(data.timeSlots)) {
            timeSlots.push(...data.timeSlots);
          } else if (data.availability) {
            // Alternative structure - check for availability object
            Object.keys(data.availability).forEach((day) => {
              if (data.availability[day] && Array.isArray(data.availability[day])) {
                timeSlots.push(...data.availability[day]);
              }
            });
          }

          coachAvailability.push({
            id: doc.id,
            coachName,
            availableDays: data.availableDays,
            timeSlots: timeSlots.length > 0 ? timeSlots : [{ start: '09:00', end: '17:00' }],
          });
        }
      });

      // Process subscriptions
      const subscriptions: any[] = [];
      subscriptionsSnapshot.forEach((doc) => {
        const data = doc.data();
        subscriptions.push({
          id: doc.id,
          playerName: playersMap.get(data.playerId) || 'Unknown Player',
          coachName: coachesMap.get(data.coachId) || 'Unknown Coach',
          startDate: data.startDate,
          endDate: data.endDate,
          status: data.status,
          playerId: data.playerId,
          coachId: data.coachId,
        });
      });

      // Process tasks
      const tasks: any[] = [];
      tasksSnapshot.forEach((doc) => {
        const data = doc.data();
        tasks.push({
          id: doc.id,
          title: data.title,
          description: data.description || '',
          startDate: data.startDate,
          dueDate: data.dueDate,
          playerName: playersMap.get(data.playerId) || 'Unknown Player',
          coachName: coachesMap.get(data.coachId) || 'Unknown Coach',
          status: data.status || 'pending',
          playerId: data.playerId,
          coachId: data.coachId,
        });
      });

      console.log(`Calendar data fetched: ${subscriptions.length} subscriptions, ${tasks.length} tasks, ${coachAvailability.length} coaches with availability`);

      return {
        subscriptions,
        tasks,
        coachAvailability,
      };
    } catch (error) {
      console.error('Error fetching calendar data:', error);
      throw error;
    }
  }
}
