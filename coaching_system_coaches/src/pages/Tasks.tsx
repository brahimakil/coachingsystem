import React, { useState, useEffect } from 'react';
import { 
  MdAdd, 
  MdClose, 
  MdCalendarToday, 
  MdPerson, 
  MdCheck, 
  MdDelete,
  MdFilterList,
  MdWarning,
  MdVideoLibrary,
  MdNotes,
  MdAccessTime,
  MdVisibility
} from 'react-icons/md';
import { useAuth } from '../contexts/AuthContext';
import { 
  getTasks, 
  createTask, 
  updateTaskStatus,
  deleteTask,
  getActiveSubscriptions,
  checkTaskConflict,
  Task,
  Subscription,
  CreateTaskDto
} from '../services/tasks.service';
import '../styles/tasks.css';

const Tasks: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [showTaskDetailsModal, setShowTaskDetailsModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [conflictError, setConflictError] = useState('');

  // Filter state
  const [playerFilter, setPlayerFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  // Form State
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    subscriptionId: '',
    playerId: '',
    startDate: new Date().toISOString().slice(0, 16),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
  });

  // Get selected subscription for date constraints
  const selectedSubscription = subscriptions.find(s => s.id === newTask.subscriptionId);

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [tasks, playerFilter, statusFilter, dateFilter]);

  const loadData = async () => {
    if (!user?.uid && !user?.id) return;
    
    const userId = user.uid || user.id;
    
    try {
      setLoading(true);
      const [tasksData, subscriptionsData] = await Promise.all([
        getTasks(userId),
        getActiveSubscriptions(userId)
      ]);
      setTasks(tasksData);
      setSubscriptions(subscriptionsData);
    } catch (err) {
      console.error(err);
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...tasks];

    // Filter by player
    if (playerFilter !== 'all') {
      filtered = filtered.filter(task => task.playerId === playerFilter);
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    // Filter by date
    if (dateFilter !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      filtered = filtered.filter(task => {
        const taskDate = new Date(task.dueDate);
        taskDate.setHours(0, 0, 0, 0);

        switch (dateFilter) {
          case 'today':
            return taskDate.getTime() === today.getTime();
          case 'upcoming':
            return taskDate >= today;
          case 'overdue':
            return taskDate < today && task.status === 'pending';
          default:
            return true;
        }
      });
    }

    setFilteredTasks(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setConflictError('');
    
    const userId = user?.uid || user?.id;
    if (!userId) {
      setError('User not authenticated');
      return;
    }

    if (!newTask.subscriptionId) {
      setError('Please select a player subscription');
      return;
    }

    try {
      // Check for conflict before creating task
      const hasConflict = await checkTaskConflict(
        userId, 
        newTask.playerId, 
        newTask.startDate,
        newTask.dueDate
      );
      
      if (hasConflict) {
        setConflictError('This player already has a task with overlapping dates. Please choose different dates.');
        return;
      }

      const taskData: CreateTaskDto = {
        coachId: userId,
        playerId: newTask.playerId,
        subscriptionId: newTask.subscriptionId,
        title: newTask.title,
        description: newTask.description,
        startDate: new Date(newTask.startDate).toISOString(),
        dueDate: new Date(newTask.dueDate).toISOString(),
        status: 'pending',
        submission: {
          status: 'pending'
        }
      };

      const createdTask = await createTask(taskData);
      setTasks([...tasks, createdTask]);
      setIsModalOpen(false);
      setNewTask({
        title: '',
        description: '',
        subscriptionId: '',
        playerId: '',
        startDate: new Date().toISOString().slice(0, 16),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to assign task';
      console.error('Task creation error:', errorMessage);
      setError(errorMessage);
    }
  };

  const handleStatusToggle = async (taskId: string, currentStatus: 'pending' | 'completed' | 'cancelled') => {
    try {
      const newStatus = currentStatus === 'pending' ? 'completed' : 'pending';
      const updatedTask = await updateTaskStatus(taskId, newStatus);
      
      setTasks(tasks.map(task => 
        task.id === taskId ? updatedTask : task
      ));
    } catch (err) {
      console.error('Failed to update task status:', err);
      setError('Failed to update task status');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    
    try {
      await deleteTask(taskId);
      setTasks(tasks.filter(task => task.id !== taskId));
    } catch (err) {
      console.error('Failed to delete task:', err);
      setError('Failed to delete task');
    }
  };

  if (loading) {
    return (
      <div className="tasks-page">
        <div className="loading-state">Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className="tasks-page">
      <div className="page-header">
        <div>
          <h1>Tasks Manager</h1>
          <p className="page-subtitle">Assign and track player tasks</p>
        </div>
        <button className="action-btn" onClick={() => setIsModalOpen(true)}>
          <MdAdd /> Assign Task
        </button>
      </div>

      {error && (
        <div className="error-banner">
          <MdWarning />
          {error}
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      {/* Filters */}
      <div className="tasks-filters">
        <div className="filter-group">
          <MdFilterList />
          <select 
            className="filter-select"
            value={playerFilter}
            onChange={(e) => setPlayerFilter(e.target.value)}
          >
            <option value="all">All Players</option>
            {subscriptions.map(sub => (
              <option key={sub.id} value={sub.playerId}>{sub.playerName}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <select 
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="filter-group">
          <select 
            className="filter-select"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="upcoming">Upcoming</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>

        <div className="tasks-count">
          {filteredTasks.length} task{filteredTasks.length === 1 ? '' : 's'}
        </div>
      </div>

      {/* Tasks Grid */}
      <div className="tasks-grid">
        {filteredTasks.length === 0 ? (
          <div className="no-data">
            <p>No tasks found</p>
            <button className="action-btn" onClick={() => setIsModalOpen(true)}>
              <MdAdd /> Assign First Task
            </button>
          </div>
        ) : (
          filteredTasks.map(task => {
            const isOverdue = new Date(task.dueDate) < new Date() && task.status === 'pending';
            const hasSubmission = task.submission && task.submission.status !== 'pending';
            
            return (
              <div key={task.id} className={`task-card ${task.status}`}>
                <div className="task-header">
                  <h3 className="task-title">{task.title}</h3>
                  <span className={`task-status ${task.status}`}>
                    {task.status}
                  </span>
                </div>
                <p className="task-desc">{task.description}</p>
                
                {/* Date Range */}
                <div className="task-date-range">
                  <div className="date-item">
                    <MdAccessTime />
                    <span className="date-label">Start:</span>
                    <span>
                      {new Date(task.startDate).toLocaleDateString()} at {new Date(task.startDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  <div className="date-item">
                    <MdCalendarToday />
                    <span className="date-label">Due:</span>
                    <span className={isOverdue ? 'overdue-text' : ''}>
                      {new Date(task.dueDate).toLocaleDateString()} at {new Date(task.dueDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                    {isOverdue && <span className="overdue-badge">Overdue</span>}
                  </div>
                </div>

                {/* Player Info */}
                <div className="task-meta">
                  <div className="task-assignee">
                    <div className="assignee-avatar">
                      <MdPerson />
                    </div>
                    <span>{task.playerName}</span>
                  </div>
                </div>

                {/* Submission Status */}
                {task.submission && (
                  <div className={`submission-status ${task.submission.status}`}>
                    <div className="submission-header">
                      <span className="submission-label">
                        Player Response: 
                        <span className={`submission-badge ${task.submission.status}`}>
                          {task.submission.status}
                        </span>
                      </span>
                    </div>
                    {hasSubmission && (
                      <div className="submission-content">
                        {task.submission.videos && task.submission.videos.length > 0 && (
                          <div className="submission-item">
                            <MdVideoLibrary />
                            <span>{task.submission.videos.length} video(s) uploaded</span>
                          </div>
                        )}
                        {task.submission.notes && (
                          <div className="submission-item">
                            <MdNotes />
                            <span className="submission-notes">{task.submission.notes}</span>
                          </div>
                        )}
                        <button 
                          className="btn-view-submission"
                          onClick={() => {
                            setSelectedTask(task);
                            setShowSubmissionModal(true);
                          }}
                        >
                          View Details
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="task-actions">
                  <button
                    className="btn-task-review"
                    onClick={() => {
                      setSelectedTask(task);
                      setShowTaskDetailsModal(true);
                    }}
                    title="Review Task"
                  >
                    <MdVisibility />
                    Review
                  </button>
                  {task.status !== 'cancelled' && (
                    <button
                      className={`btn-task-action ${task.status === 'completed' ? 'completed' : 'pending'}`}
                      onClick={() => handleStatusToggle(task.id, task.status)}
                      title={task.status === 'pending' ? 'Mark as Completed' : 'Mark as Pending'}
                    >
                      <MdCheck />
                      {task.status === 'pending' ? 'Mark Complete' : 'Mark Pending'}
                    </button>
                  )}
                  <button
                    className="btn-task-delete"
                    onClick={() => handleDeleteTask(task.id)}
                    title="Delete Task"
                  >
                    <MdDelete />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Assignment Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Assign New Task</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                ×
              </button>
            </div>

            <div className="modal-body">
              {conflictError && (
                <div className="conflict-error">
                  <MdWarning />
                  {conflictError}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="title">Task Title</label>
                  <input 
                    id="title"
                    type="text" 
                    className="form-input"
                    placeholder="e.g., Ball Control Drills"
                    required
                    value={newTask.title}
                    onChange={e => setNewTask({...newTask, title: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="subscriptionId">Assign To Player</label>
                  <select 
                    id="subscriptionId"
                    className="form-select"
                    required
                    value={newTask.subscriptionId}
                    onChange={e => {
                      const selectedSub = subscriptions.find(s => s.id === e.target.value);
                      setNewTask({
                        ...newTask, 
                        subscriptionId: e.target.value,
                        playerId: selectedSub?.playerId || ''
                      });
                      setConflictError('');
                    }}
                  >
                    <option value="">Select Player</option>
                    {subscriptions.map(sub => (
                      <option key={sub.id} value={sub.id}>{sub.playerName}</option>
                    ))}
                  </select>
                  {subscriptions.length === 0 && (
                    <p className="form-hint">No active subscriptions found. Players must have active enrollments to assign tasks.</p>
                  )}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="startDate">Start Date & Time</label>
                    <input 
                      id="startDate"
                      type="datetime-local" 
                      className="form-input"
                      required
                      min={selectedSubscription && selectedSubscription.startDate ? new Date(selectedSubscription.startDate).toISOString().slice(0, 16) : undefined}
                      max={selectedSubscription && selectedSubscription.endDate ? new Date(selectedSubscription.endDate).toISOString().slice(0, 16) : undefined}
                      value={newTask.startDate}
                      onChange={e => {
                        setNewTask({...newTask, startDate: e.target.value});
                        setConflictError('');
                      }}
                    />
                    {selectedSubscription && selectedSubscription.startDate && selectedSubscription.endDate && (
                      <p className="form-hint">
                        Subscription period: {new Date(selectedSubscription.startDate).toLocaleDateString()} - {new Date(selectedSubscription.endDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="dueDate">Due Date & Time</label>
                    <input 
                      id="dueDate"
                      type="datetime-local" 
                      className="form-input"
                      required
                      min={selectedSubscription && selectedSubscription.startDate ? new Date(selectedSubscription.startDate).toISOString().slice(0, 16) : undefined}
                      max={selectedSubscription && selectedSubscription.endDate ? new Date(selectedSubscription.endDate).toISOString().slice(0, 16) : undefined}
                      value={newTask.dueDate}
                      onChange={e => {
                        setNewTask({...newTask, dueDate: e.target.value});
                        setConflictError('');
                      }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea 
                    id="description"
                    className="form-textarea"
                    placeholder="Provide detailed instructions for the task..."
                    rows={4}
                    required
                    value={newTask.description}
                    onChange={e => setNewTask({...newTask, description: e.target.value})}
                  />
                </div>

                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Assign Task
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Submission View Modal */}
      {showSubmissionModal && selectedTask && selectedTask.submission && (
        <div className="modal-overlay" onClick={() => setShowSubmissionModal(false)}>
          <div className="modal-content submission-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Player Submission - {selectedTask.title}</h2>
              <button className="modal-close" onClick={() => setShowSubmissionModal(false)}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="submission-details">
                <div className="detail-row">
                  <span className="detail-label">Player:</span>
                  <span className="detail-value">{selectedTask.playerName}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Status:</span>
                  <span className={`submission-badge ${selectedTask.submission.status}`}>
                    {selectedTask.submission.status}
                  </span>
                </div>

                {selectedTask.submission.videos && selectedTask.submission.videos.length > 0 && (
                  <div className="submission-section">
                    <h3><MdVideoLibrary /> Videos ({selectedTask.submission.videos.length})</h3>
                    <div className="video-list">
                      {selectedTask.submission.videos.map((video, index) => (
                        <div key={index} className="video-item">
                          <a href={video} target="_blank" rel="noopener noreferrer">
                            Video {index + 1}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedTask.submission.notes && (
                  <div className="submission-section">
                    <h3><MdNotes /> Player Notes</h3>
                    <p className="notes-content">{selectedTask.submission.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Details Modal */}
      {showTaskDetailsModal && selectedTask && (
        <div className="modal-overlay" onClick={() => setShowTaskDetailsModal(false)}>
          <div className="modal-content task-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Task Details</h2>
              <button className="modal-close" onClick={() => setShowTaskDetailsModal(false)}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="task-details">
                <div className="detail-section">
                  <h3>Task Information</h3>
                  <div className="detail-row">
                    <span className="detail-label">Title:</span>
                    <span className="detail-value">{selectedTask.title}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Status:</span>
                    <span className={`task-status ${selectedTask.status}`}>
                      {selectedTask.status}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Description:</span>
                    <p className="detail-description">{selectedTask.description}</p>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Timeline</h3>
                  <div className="detail-row">
                    <span className="detail-label"><MdAccessTime /> Start:</span>
                    <span className="detail-value">
                      {new Date(selectedTask.startDate).toLocaleDateString()} at {new Date(selectedTask.startDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label"><MdCalendarToday /> Due:</span>
                    <span className="detail-value">
                      {new Date(selectedTask.dueDate).toLocaleDateString()} at {new Date(selectedTask.dueDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Player Information</h3>
                  <div className="detail-row">
                    <span className="detail-label"><MdPerson /> Player:</span>
                    <span className="detail-value">{selectedTask.playerName}</span>
                  </div>
                  {selectedTask.playerEmail && (
                    <div className="detail-row">
                      <span className="detail-label">Email:</span>
                      <span className="detail-value">{selectedTask.playerEmail}</span>
                    </div>
                  )}
                </div>

                {selectedTask.submission && (
                  <div className="detail-section">
                    <h3>Player Response</h3>
                    <div className="detail-row">
                      <span className="detail-label">Submission Status:</span>
                      <span className={`submission-badge ${selectedTask.submission.status}`}>
                        {selectedTask.submission.status}
                      </span>
                    </div>
                    {selectedTask.submission.videos && selectedTask.submission.videos.length > 0 && (
                      <div className="detail-row">
                        <span className="detail-label"><MdVideoLibrary /> Videos:</span>
                        <span className="detail-value">{selectedTask.submission.videos.length} uploaded</span>
                      </div>
                    )}
                    {selectedTask.submission.notes && (
                      <div className="detail-row">
                        <span className="detail-label"><MdNotes /> Notes:</span>
                        <p className="detail-notes">{selectedTask.submission.notes}</p>
                      </div>
                    )}
                    {selectedTask.submission.status !== 'pending' && (
                      <button 
                        className="btn-view-submission"
                        onClick={() => {
                          setShowTaskDetailsModal(false);
                          setShowSubmissionModal(true);
                        }}
                      >
                        View Full Submission
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
