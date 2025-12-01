import React, { useState, useEffect } from 'react';
import { calendarService } from '../services/calendar.service';
import '../styles/calendar.css';

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
  timeSlots: Array<{ start: string; end: string }>;
}

interface CalendarData {
  subscriptions: Subscription[];
  tasks: Task[];
  coachAvailability: CoachAvailability[];
}

type FilterType = 'all' | 'subscriptions' | 'tasks' | 'availability';
type UserType = 'all' | 'players' | 'coaches';

const Calendar: React.FC = () => {
  const [calendarData, setCalendarData] = useState<CalendarData>({
    subscriptions: [],
    tasks: [],
    coachAvailability: [],
  });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [userType, setUserType] = useState<UserType>('all');
  const [selectedCoach, setSelectedCoach] = useState<string>('all');
  const [selectedPlayer, setSelectedPlayer] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  useEffect(() => {
    fetchCalendarData();
  }, []);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const data = await calendarService.getCalendarData();
      setCalendarData(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch calendar data');
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getWeekDays = (date: Date) => {
    const days: Date[] = [];
    const currentDay = new Date(date);
    const dayOfWeek = currentDay.getDay();
    
    // Get to the start of the week (Sunday)
    currentDay.setDate(currentDay.getDate() - dayOfWeek);
    
    // Add 7 days
    for (let i = 0; i < 7; i++) {
      days.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    return days;
  };

  const getEventsForDay = (date: Date | null) => {
    if (!date) return { subscriptions: [], tasks: [], availability: [] };

    const events = {
      subscriptions: [] as Subscription[],
      tasks: [] as Task[],
      availability: [] as CoachAvailability[],
    };

    // Filter subscriptions
    if (filterType === 'all' || filterType === 'subscriptions') {
      events.subscriptions = calendarData.subscriptions.filter((sub) => {
        const start = new Date(sub.startDate);
        const end = new Date(sub.endDate);
        const isInRange = date >= start && date <= end;
        
        let matchesUserFilter = true;
        if (userType === 'players') {
          matchesUserFilter = selectedPlayer === 'all' || sub.playerName === selectedPlayer;
        } else if (userType === 'coaches') {
          matchesUserFilter = selectedCoach === 'all' || sub.coachName === selectedCoach;
        }

        return isInRange && matchesUserFilter;
      });
    }

    // Filter tasks
    if (filterType === 'all' || filterType === 'tasks') {
      events.tasks = calendarData.tasks.filter((task) => {
        const taskStart = new Date(task.startDate);
        const taskDue = new Date(task.dueDate);
        const isOnDay = date >= taskStart && date <= taskDue;

        let matchesUserFilter = true;
        if (userType === 'players') {
          matchesUserFilter = selectedPlayer === 'all' || task.playerName === selectedPlayer;
        } else if (userType === 'coaches') {
          matchesUserFilter = selectedCoach === 'all' || task.coachName === selectedCoach;
        }

        return isOnDay && matchesUserFilter;
      });
    }

    // Filter coach availability
    if (filterType === 'all' || filterType === 'availability') {
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      events.availability = calendarData.coachAvailability.filter((coach) => {
        const isAvailable = coach.availableDays.includes(dayName);
        const matchesCoachFilter = selectedCoach === 'all' || coach.coachName === selectedCoach;
        return isAvailable && matchesCoachFilter;
      });
    }

    return events;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getUniqueCoaches = () => {
    const coaches = new Set<string>();
    calendarData.subscriptions.forEach((sub) => coaches.add(sub.coachName));
    calendarData.tasks.forEach((task) => coaches.add(task.coachName));
    calendarData.coachAvailability.forEach((coach) => coaches.add(coach.coachName));
    return Array.from(coaches).sort();
  };

  const getUniquePlayers = () => {
    const players = new Set<string>();
    calendarData.subscriptions.forEach((sub) => players.add(sub.playerName));
    calendarData.tasks.forEach((task) => players.add(task.playerName));
    return Array.from(players).sort();
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  if (loading) {
    return (
      <div className="calendar-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading calendar...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="calendar-container">
        <div className="error-state">
          <p>{error}</p>
          <button onClick={fetchCalendarData} className="btn-primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const days = viewMode === 'month' ? getDaysInMonth(currentDate) : getWeekDays(currentDate);
  const coaches = getUniqueCoaches();
  const players = getUniquePlayers();

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h1>📅 Calendar</h1>
        <p className="subtitle">Manage subscriptions, tasks, and coach availability</p>
      </div>

      {/* Filters Section */}
      <div className="calendar-filters">
        <div className="filter-group">
          <label>View:</label>
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value as FilterType)}
            className="filter-select"
          >
            <option value="all">All Events</option>
            <option value="subscriptions">Subscriptions Only</option>
            <option value="tasks">Tasks Only</option>
            <option value="availability">Coach Availability</option>
          </select>
        </div>

        <div className="filter-group">
          <label>User Type:</label>
          <select 
            value={userType} 
            onChange={(e) => {
              setUserType(e.target.value as UserType);
              setSelectedCoach('all');
              setSelectedPlayer('all');
            }}
            className="filter-select"
          >
            <option value="all">All Users</option>
            <option value="players">Players</option>
            <option value="coaches">Coaches</option>
          </select>
        </div>

        {userType === 'coaches' && (
          <div className="filter-group">
            <label>Coach:</label>
            <select 
              value={selectedCoach} 
              onChange={(e) => setSelectedCoach(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Coaches</option>
              {coaches.map((coach) => (
                <option key={coach} value={coach}>
                  {coach}
                </option>
              ))}
            </select>
          </div>
        )}

        {userType === 'players' && (
          <div className="filter-group">
            <label>Player:</label>
            <select 
              value={selectedPlayer} 
              onChange={(e) => setSelectedPlayer(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Players</option>
              {players.map((player) => (
                <option key={player} value={player}>
                  {player}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="filter-group">
          <label>Mode:</label>
          <select 
            value={viewMode} 
            onChange={(e) => setViewMode(e.target.value as 'month' | 'week')}
            className="filter-select"
          >
            <option value="month">Month View</option>
            <option value="week">Week View</option>
          </select>
        </div>
      </div>

      {/* Navigation */}
      <div className="calendar-navigation">
        <button 
          onClick={() => viewMode === 'month' ? navigateMonth('prev') : navigateWeek('prev')} 
          className="nav-btn"
        >
          ← Previous
        </button>
        <div className="current-period">
          <h2>
            {viewMode === 'month' 
              ? currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
              : `Week of ${getWeekDays(currentDate)[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
            }
          </h2>
          <button onClick={goToToday} className="today-btn">
            Today
          </button>
        </div>
        <button 
          onClick={() => viewMode === 'month' ? navigateMonth('next') : navigateWeek('next')} 
          className="nav-btn"
        >
          Next →
        </button>
      </div>

      {/* Legend */}
      <div className="calendar-legend">
        <div className="legend-item">
          <span className="legend-dot subscription-dot"></span>
          <span>Subscriptions</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot task-dot"></span>
          <span>Tasks</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot availability-dot"></span>
          <span>Coach Available</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className={`calendar-grid ${viewMode === 'week' ? 'week-view' : 'month-view'}`}>
        {/* Day Headers */}
        <div className="calendar-day-header">Sun</div>
        <div className="calendar-day-header">Mon</div>
        <div className="calendar-day-header">Tue</div>
        <div className="calendar-day-header">Wed</div>
        <div className="calendar-day-header">Thu</div>
        <div className="calendar-day-header">Fri</div>
        <div className="calendar-day-header">Sat</div>

        {/* Day Cells */}
        {days.map((day, index) => {
          const events = getEventsForDay(day);
          const hasEvents =
            events.subscriptions.length > 0 ||
            events.tasks.length > 0 ||
            events.availability.length > 0;

          return (
            <div
              key={index}
              className={`calendar-day ${!day ? 'empty' : ''} ${
                isToday(day) ? 'today' : ''
              } ${hasEvents ? 'has-events' : ''}`}
            >
              {day && (
                <>
                  <div className="day-number">{day.getDate()}</div>
                  <div className="day-events">
                    {/* Subscriptions */}
                    {events.subscriptions.map((sub) => (
                      <div key={sub.id} className="event-item subscription-event">
                        <span className="event-icon">📋</span>
                        <div className="event-details">
                          <div className="event-title">{sub.playerName}</div>
                          <div className="event-subtitle">with {sub.coachName}</div>
                          <div className="event-meta">
                            {new Date(sub.startDate).toLocaleDateString()} - {new Date(sub.endDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Tasks */}
                    {events.tasks.map((task) => (
                      <div key={task.id} className="event-item task-event">
                        <span className="event-icon">✓</span>
                        <div className="event-details">
                          <div className="event-title">{task.title}</div>
                          <div className="event-subtitle">
                            Coach: {task.coachName} | Player: {task.playerName}
                          </div>
                          <div className={`event-status status-${task.status}`}>
                            {task.status}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Coach Availability */}
                    {events.availability.map((coach) => (
                      <div key={coach.id} className="event-item availability-event">
                        <span className="event-icon">🕐</span>
                        <div className="event-details">
                          <div className="event-title">{coach.coachName}</div>
                          <div className="event-subtitle">Available</div>
                          <div className="event-meta">
                            {coach.timeSlots.map((slot, idx) => (
                              <span key={idx}>
                                {slot.start} - {slot.end}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;
