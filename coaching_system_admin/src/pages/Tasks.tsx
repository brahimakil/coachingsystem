import { useState, useEffect } from 'react';
import { tasksService, type Task } from '../services/tasks.service';
import { coachesService } from '../services/coaches.service';
import { subscriptionsService } from '../services/subscriptions.service';
import { playersService } from '../services/players.service';
import '../styles/tasks.css';

interface Coach {
  id: string;
  name: string;
  email: string;
}

interface EnrichedSubscription {
  id: string;
  playerId: string;
  playerName: string;
  planName?: string;
  startDate: string;
  endDate: string;
}

const Tasks = () => {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [selectedCoachId, setSelectedCoachId] = useState<string>('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);

  // Modal specific state
  const [modalCoachId, setModalCoachId] = useState<string>('');
  const [coachSubscriptions, setCoachSubscriptions] = useState<EnrichedSubscription[]>([]);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string>('');
  const [selectedPlayerName, setSelectedPlayerName] = useState<string>('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    dueDate: '',
    status: 'pending' as 'pending' | 'completed' | 'cancelled',
  });

  useEffect(() => {
    fetchCoaches();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [selectedCoachId]);

  // Fetch subscriptions when modal coach changes
  useEffect(() => {
    if (modalCoachId) {
      fetchCoachSubscriptions(modalCoachId);
    } else {
      setCoachSubscriptions([]);
      setSelectedSubscriptionId('');
      setSelectedPlayerName('');
    }
  }, [modalCoachId]);

  const fetchCoaches = async () => {
    try {
      const response = await coachesService.getAll(undefined, 'active');
      // Handle response structure { success: true, data: [...] }
      const coachesData = response.data || response;
      setCoaches(Array.isArray(coachesData) ? coachesData : []);
    } catch (error) {
      console.error('Error fetching coaches:', error);
      setCoaches([]);
    }
  };

  const fetchCoachSubscriptions = async (coachId: string) => {
    try {
      const subs = await subscriptionsService.getAll(undefined, 'active', coachId);
      const enrichedSubs = await Promise.all(subs.map(async (sub) => {
        try {
          const playerResponse = await playersService.getOne(sub.playerId);
          // Handle response structure { success: true, data: { ... } }
          const playerData = playerResponse.data || playerResponse;
          
          return {
            id: sub.id,
            playerId: sub.playerId,
            playerName: playerData.name || 'Unknown Player',
            startDate: sub.startDate,
            endDate: sub.endDate
          };
        } catch (e) {
          return {
            id: sub.id,
            playerId: sub.playerId,
            playerName: 'Unknown Player',
            startDate: sub.startDate,
            endDate: sub.endDate
          };
        }
      }));
      setCoachSubscriptions(enrichedSubs);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      setCoachSubscriptions([]);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await tasksService.getAll(selectedCoachId || undefined);
      setTasks(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setModalCoachId(task.coachId);
      setSelectedSubscriptionId(task.subscriptionId);
      setSelectedPlayerName(task.playerName || '');
      setFormData({
        title: task.title,
        description: task.description,
        startDate: task.startDate ? task.startDate.split('T')[0] : '',
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
        status: task.status,
      });
    } else {
      setEditingTask(null);
      // If a coach is selected in the main view, pre-select them in the modal
      setModalCoachId(selectedCoachId || '');
      setSelectedSubscriptionId('');
      setSelectedPlayerName('');
      setFormData({
        title: '',
        description: '',
        startDate: '',
        dueDate: '',
        status: 'pending',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTask(null);
    setModalCoachId('');
    setSelectedSubscriptionId('');
    setSelectedPlayerName('');
    setFormData({
      title: '',
      description: '',
      startDate: '',
      dueDate: '',
      status: 'pending',
    });
  };

  const handleSubscriptionChange = (subId: string) => {
    setSelectedSubscriptionId(subId);
    const sub = coachSubscriptions.find(s => s.id === subId);
    if (sub) {
      setSelectedPlayerName(sub.playerName);
    }
  };

  const handleSetNow = (field: 'startDate' | 'dueDate') => {
    const now = new Date();
    // Format to YYYY-MM-DDTHH:mm for datetime-local input
    // Adjust for timezone offset to ensure local time is correct in input
    const offset = now.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(now.getTime() - offset)).toISOString().slice(0, 16);
    setFormData(prev => ({ ...prev, [field]: localISOTime }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalCoachId || !selectedSubscriptionId) {
      alert('Please select a coach and an enrollment');
      return;
    }

    const selectedSub = coachSubscriptions.find(s => s.id === selectedSubscriptionId);
    if (!selectedSub) return;

    try {
      const taskData = {
        ...formData,
        coachId: modalCoachId,
        subscriptionId: selectedSubscriptionId,
        playerId: selectedSub.playerId,
      };

      if (editingTask) {
        await tasksService.update(editingTask.id, taskData);
      } else {
        await tasksService.create(taskData);
      }

      handleCloseModal();
      
      // If we're already viewing this coach's tasks, refresh the list
      if (selectedCoachId === modalCoachId) {
        fetchTasks();
      } else {
        // Otherwise, switch view to this coach so the user sees the new task
        setSelectedCoachId(modalCoachId);
      }
    } catch (error) {
      console.error('Error saving task:', error);
      alert('Failed to save task. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      await tasksService.delete(id);
      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task. Please try again.');
    }
  };

  return (
    <div className="tasks-container">
      <div className="tasks-header">
        <h1>Tasks Management</h1>
        <button className="add-task-btn" onClick={() => handleOpenModal()}>
          Add New Task
        </button>
      </div>

      <div className="tasks-filters">
        <select
          value={selectedCoachId}
          onChange={(e) => setSelectedCoachId(e.target.value)}
          className="coach-select"
        >
          <option value="">Select Coach to View Tasks</option>
          {coaches.map((coach) => (
            <option key={coach.id} value={coach.id}>
              {coach.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="loading">Loading tasks...</div>
      ) : (
        <div className="tasks-list">
          {tasks.length === 0 ? (
            <div className="no-tasks">
              {selectedCoachId ? 'No tasks found for this coach.' : 'No tasks found. Select a coach or create a new task.'}
            </div>
          ) : (
            tasks.map((task) => (
              <div key={task.id} className={`task-card ${task.status}`}>
                <div className="task-header">
                  <h3>{task.title}</h3>
                  <span className={`status-badge ${task.status}`}>{task.status}</span>
                </div>
                <div className="task-meta">
                  <p><strong>Player:</strong> {task.playerName}</p>
                  <p><strong>Due:</strong> {new Date(task.dueDate).toLocaleDateString()}</p>
                </div>
                <p className="task-description">{task.description}</p>
                <div className="task-actions">
                  <button onClick={() => setViewingTask(task)} className="view-btn">View</button>
                  <button onClick={() => handleOpenModal(task)} className="edit-btn">Edit</button>
                  <button onClick={() => handleDelete(task.id)} className="delete-btn">Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* View Task Modal */}
      {viewingTask && (
        <div className="modal-overlay" onClick={() => setViewingTask(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Task Details</h2>
              <button className="btn-close" onClick={() => setViewingTask(null)}>
                ×
              </button>
            </div>
            <div className="view-content">
              <div className="view-section">
                <h3>Task Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="label">Title</span>
                    <span className="value">{viewingTask.title}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Status</span>
                    <span className={`status-badge ${viewingTask.status}`}>{viewingTask.status}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Player</span>
                    <span className="value">{viewingTask.playerName || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Coach</span>
                    <span className="value">{viewingTask.coachName || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Start Date</span>
                    <span className="value">{new Date(viewingTask.startDate).toLocaleDateString()}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Due Date</span>
                    <span className="value">{new Date(viewingTask.dueDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="view-section">
                <h3>Description</h3>
                <div className="task-description-full">
                  {viewingTask.description}
                </div>
              </div>

              {/* Submission Section */}
              {viewingTask.submission && viewingTask.submission.status !== 'not_submitted' && viewingTask.submission.status !== 'pending' && (
                <div className="view-section">
                  <h3>Student Submission</h3>
                  <div className="submission-info">
                    <div className="detail-item">
                      <span className="label">Status</span>
                      <span className={`status-badge ${viewingTask.submission.status}`}>
                        {viewingTask.submission.status}
                      </span>
                    </div>
                    {viewingTask.submission.submittedAt && (
                      <div className="detail-item">
                        <span className="label">Submitted At</span>
                        <span className="value">{new Date(viewingTask.submission.submittedAt).toLocaleString()}</span>
                      </div>
                    )}
                    {viewingTask.submission.textResponse && (
                      <div className="detail-item full-width">
                        <span className="label">Text Response</span>
                        <div className="submission-text">
                          {viewingTask.submission.textResponse}
                        </div>
                      </div>
                    )}
                    {viewingTask.submission.mediaUrls && viewingTask.submission.mediaUrls.length > 0 && (
                      <div className="detail-item full-width">
                        <span className="label">Attachments ({viewingTask.submission.mediaUrls.length})</span>
                        <div className="media-list">
                          {viewingTask.submission.mediaUrls.map((url, index) => (
                            <a 
                              key={index} 
                              href={url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="media-link"
                            >
                              <span>📎 Attachment {index + 1}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="modal-actions">
                <button className="cancel-btn" onClick={() => setViewingTask(null)}>
                  Close
                </button>
                <button className="submit-btn" onClick={() => { handleOpenModal(viewingTask); setViewingTask(null); }}>
                  Edit Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{editingTask ? 'Edit Task' : 'Create New Task'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Select Coach</label>
                <select
                  value={modalCoachId}
                  onChange={(e) => setModalCoachId(e.target.value)}
                  required
                  disabled={!!editingTask}
                >
                  <option value="">Select Coach</option>
                  {coaches.map((coach) => (
                    <option key={coach.id} value={coach.id}>
                      {coach.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Select Enrollment (Active Subscription)</label>
                <select
                  value={selectedSubscriptionId}
                  onChange={(e) => handleSubscriptionChange(e.target.value)}
                  required
                  disabled={!modalCoachId || !!editingTask}
                >
                  <option value="">Select Enrollment</option>
                  {coachSubscriptions.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.playerName} (Ends: {new Date(sub.endDate).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>

              {selectedPlayerName && (
                <div className="form-group">
                  <label>Assigned To:</label>
                  <input type="text" value={selectedPlayerName} disabled />
                </div>
              )}

              <div className="form-group">
                <label>Task Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="e.g., Dribbling Practice"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  placeholder="Detailed instructions..."
                  rows={4}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Date/Time</label>
                  <div className="date-input-wrapper">
                    <input
                      type="datetime-local"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      required
                    />
                    <button type="button" onClick={() => handleSetNow('startDate')} className="now-btn">Now</button>
                  </div>
                </div>

                <div className="form-group">
                  <label>Due Date/Time</label>
                  <div className="date-input-wrapper">
                    <input
                      type="datetime-local"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                >
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={handleCloseModal} className="cancel-btn">Cancel</button>
                <button type="submit" className="submit-btn">Save Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
