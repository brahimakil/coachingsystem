import api from './api';

interface TimeSlot {
  start: string;
  end: string;
}

interface Subscription {
  id: string;
  playerName: string;
  coachName: string;
  startDate: string;
  endDate: string;
  status: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  startDate: string;
  dueDate: string;
  playerName: string;
  coachName: string;
  status: string;
}

interface CoachAvailability {
  id: string;
  coachName: string;
  availableDays: string[];
  timeSlots: TimeSlot[];
}

interface CalendarData {
  subscriptions: Subscription[];
  tasks: Task[];
  coachAvailability: CoachAvailability[];
}

export const calendarService = {
  async getCalendarData(): Promise<CalendarData> {
    const response = await api.get('/calendar');
    return response.data;
  },
};
