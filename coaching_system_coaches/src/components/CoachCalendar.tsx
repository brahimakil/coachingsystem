import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from 'date-fns';
import { MdChevronLeft, MdChevronRight, MdFilterList } from 'react-icons/md';
import { getCalendarEvents, getCoachPlayers, CalendarEvent } from '../services/calendar.service';
import { useAuth } from '../contexts/AuthContext';
import '../styles/calendar.css';

type FilterType = 'all' | 'subscriptions' | 'tasks';

const CoachCalendar: React.FC = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedPlayer, setSelectedPlayer] = useState<string>('all');
  const [players, setPlayers] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const userId = user?.uid || user?.id;
    if (userId) {
      fetchPlayers(userId);
      fetchEvents(userId);
    }
  }, [currentDate, user, filterType, selectedPlayer]);

  const fetchPlayers = async (userId: string) => {
    try {
      const playersList = await getCoachPlayers(userId);
      setPlayers(playersList);
    } catch (error) {
      console.error('Error fetching players:', error);
    }
  };

  const fetchEvents = async (userId: string) => {
    try {
      setLoading(true);
      const data = await getCalendarEvents(
        userId,
        currentDate.getMonth(),
        currentDate.getFullYear(),
        filterType,
        selectedPlayer
      );
      setEvents(data);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const getEventsForDay = (date: Date) => {
    return events.filter(event => isSameDay(new Date(event.date), date));
  };

  const selectedDayEvents = getEventsForDay(selectedDate);

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h2 className="calendar-title">{format(currentDate, 'MMMM yyyy')}</h2>
        <div className="calendar-actions">
          <button 
            className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
            title="Toggle Filters"
          >
            <MdFilterList />
          </button>
          <div className="calendar-nav">
            <button className="nav-btn" onClick={prevMonth}><MdChevronLeft /></button>
            <button className="nav-btn" onClick={nextMonth}><MdChevronRight /></button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="calendar-filters-panel">
          <div className="filter-row">
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
              </select>
            </div>

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
          </div>
        </div>
      )}

      {loading && <div className="calendar-loading">Loading events...</div>}

      <div className="calendar-grid">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="calendar-day-header">{day}</div>
        ))}
        
        {calendarDays.map((day, idx) => {
          const dayEvents = getEventsForDay(day);
          const isCurrentMonth = isSameMonth(day, monthStart);
          
          return (
            <div 
              key={idx} 
              className={`calendar-day ${!isCurrentMonth ? 'empty' : ''} ${isToday(day) ? 'today' : ''} ${isSameDay(day, selectedDate) ? 'selected' : ''}`}
              onClick={() => isCurrentMonth && setSelectedDate(day)}
            >
              {isCurrentMonth && (
                <>
                  <span className="day-number">{format(day, 'd')}</span>
                  <div className="event-dots">
                    {dayEvents.slice(0, 3).map(event => (
                      <div 
                        key={event.id} 
                        className={`event-dot ${event.type}`} 
                        title={event.title} 
                      />
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="event-dot-more">+{dayEvents.length - 3}</div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="selected-day-details">
        <h3 className="details-title">Events for {format(selectedDate, 'MMMM d, yyyy')}</h3>
        <div className="event-list">
          {selectedDayEvents.length > 0 ? (
            selectedDayEvents.map(event => (
              <div key={event.id} className={`event-item ${event.type}`}>
                <div className="event-info">
                  <h4>{event.title}</h4>
                  {event.playerName && <p className="event-player">Player: {event.playerName}</p>}
                  {event.type === 'subscription' && event.startDate && event.endDate && (
                    <p className="event-date-range">
                      {format(new Date(event.startDate), 'MMM d')} - {format(new Date(event.endDate), 'MMM d, yyyy')}
                    </p>
                  )}
                  {event.description && <p className="event-description">{event.description}</p>}
                  {event.status && (
                    <span className={`event-status status-${event.status}`}>
                      {event.status}
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-secondary">No events scheduled for this day.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoachCalendar;
