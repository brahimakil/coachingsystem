import api from './api';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // ISO date string
  type: 'subscription' | 'task' | 'other';
  description?: string;
  playerName?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface CoachAvailableDay {
  day: string;
  hours: { from: string; to: string };
}

export interface Subscription {
  id: string;
  playerName: string;
  startDate: string;
  endDate: string;
  status: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  startDate: string;
  dueDate: string;
  playerName: string;
  status: string;
}

/**
 * Fetch calendar events for a coach
 * Combines subscriptions and tasks
 */
export const getCalendarEvents = async (
  coachId: string, 
  month: number, 
  year: number,
  filterType: 'all' | 'subscriptions' | 'tasks' = 'all',
  selectedPlayer: string = 'all'
): Promise<CalendarEvent[]> => {
  try {
    const events: CalendarEvent[] = [];

    // Fetch subscriptions and tasks in parallel
    const [subscriptionsResponse, tasksResponse] = await Promise.all([
      filterType === 'all' || filterType === 'subscriptions' 
        ? api.get(`/subscriptions?coachId=${coachId}`) 
        : Promise.resolve({ data: [] }),
      filterType === 'all' || filterType === 'tasks'
        ? api.get(`/tasks?coachId=${coachId}`)
        : Promise.resolve({ data: [] })
    ]);

    const subscriptions: Subscription[] = subscriptionsResponse.data || [];
    const tasks: Task[] = tasksResponse.data || [];

    // Filter subscriptions that are active in the selected month
    if (filterType === 'all' || filterType === 'subscriptions') {
      for (const sub of subscriptions) {
        const subStart = new Date(sub.startDate);
        const subEnd = new Date(sub.endDate);
        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month + 1, 0);

        // Check if subscription overlaps with the selected month
        if (subEnd >= monthStart && subStart <= monthEnd) {
          // Apply player filter
          if (selectedPlayer !== 'all' && sub.playerName !== selectedPlayer) {
            continue;
          }

          // Add event for each day in the subscription period within the month
          const startDay = subStart.getMonth() === month ? subStart.getDate() : 1;
          const endDay = subEnd.getMonth() === month ? subEnd.getDate() : monthEnd.getDate();

          // Add start date marker
          if (subStart.getMonth() === month && subStart.getFullYear() === year) {
            events.push({
              id: `sub-start-${sub.id}`,
              title: `${sub.playerName} - Start`,
              date: sub.startDate,
              type: 'subscription',
              description: `Subscription starts`,
              playerName: sub.playerName,
              status: sub.status,
              startDate: sub.startDate,
              endDate: sub.endDate
            });
          }

          // Add end date marker
          if (subEnd.getMonth() === month && subEnd.getFullYear() === year) {
            events.push({
              id: `sub-end-${sub.id}`,
              title: `${sub.playerName} - End`,
              date: sub.endDate,
              type: 'subscription',
              description: `Subscription ends`,
              playerName: sub.playerName,
              status: sub.status,
              startDate: sub.startDate,
              endDate: sub.endDate
            });
          }
        }
      }
    }

    // Convert tasks to calendar events
    if (filterType === 'all' || filterType === 'tasks') {
      for (const task of tasks) {
        // Apply player filter
        if (selectedPlayer !== 'all' && task.playerName !== selectedPlayer) {
          continue;
        }

        // Add event for task start date
        if (task.startDate) {
          const startDate = new Date(task.startDate);
          if (startDate.getMonth() === month && startDate.getFullYear() === year) {
            events.push({
              id: `task-start-${task.id}`,
              title: `${task.title} (Start)`,
              date: task.startDate,
              type: 'task',
              description: task.description || 'Task assigned',
              playerName: task.playerName,
              status: task.status
            });
          }
        }

        // Add event for task due date
        if (task.dueDate) {
          const dueDate = new Date(task.dueDate);
          if (dueDate.getMonth() === month && dueDate.getFullYear() === year) {
            events.push({
              id: `task-due-${task.id}`,
              title: `${task.title} (Due)`,
              date: task.dueDate,
              type: 'task',
              description: task.description || 'Task due',
              playerName: task.playerName,
              status: task.status
            });
          }
        }
      }
    }

    return events;
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return [];
  }
};

/**
 * Get unique players from coach's subscriptions
 */
export const getCoachPlayers = async (coachId: string): Promise<string[]> => {
  try {
    const response = await api.get(`/subscriptions?coachId=${coachId}`);
    const subscriptions: Subscription[] = response.data || [];
    
    const players = new Set<string>();
    for (const sub of subscriptions) {
      if (sub.playerName) {
        players.add(sub.playerName);
      }
    }
    
    return Array.from(players).sort();
  } catch (error) {
    console.error('Error fetching coach players:', error);
    return [];
  }
};

/**
 * Parse coach's available hours into structured data
 */
export const parseAvailableHours = (availableHours: any): CoachAvailableDay[] => {
  if (!availableHours) return [];
  
  try {
    // If it's a string, parse it
    const hours = typeof availableHours === 'string' 
      ? JSON.parse(availableHours) 
      : availableHours;
    
    // Convert to array format
    if (Array.isArray(hours)) {
      return hours;
    } else if (typeof hours === 'object') {
      // If it's an object like { monday: { from: '09:00', to: '17:00' } }
      return Object.entries(hours).map(([day, timeSlot]: [string, any]) => ({
        day,
        hours: timeSlot
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error parsing available hours:', error);
    return [];
  }
};
