import api from './api';

export interface Task {
  id: string;
  coachId: string;
  playerId: string;
  playerName: string;
  playerEmail: string;
  subscriptionId: string;
  title: string;
  description: string;
  status: 'pending' | 'completed' | 'cancelled';
  startDate: string;
  dueDate: string;
  submission?: {
    videos?: string[];
    notes?: string;
    status: 'pending' | 'submitted' | 'approved' | 'rejected' | 'not_submitted';
    submittedAt?: string;
    textResponse?: string;
    mediaUrls?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface Player {
  id: string;
  name: string;
  email: string;
}

export interface Subscription {
  id: string;
  playerId: string;
  playerName: string;
  status: string;
  startDate?: string;
  endDate?: string;
}

export interface CreateTaskDto {
  coachId: string;
  playerId: string;
  subscriptionId: string;
  title: string;
  description: string;
  status: 'pending' | 'completed' | 'cancelled';
  startDate: string;
  dueDate: string;
  submission?: {
    videos?: string[];
    notes?: string;
    status: 'pending' | 'submitted' | 'approved' | 'rejected' | 'not_submitted';
    submittedAt?: string;
    textResponse?: string;
    mediaUrls?: string[];
  };
}

/**
 * Fetch all tasks for a coach
 */
export const getTasks = async (coachId: string): Promise<Task[]> => {
  try {
    const response = await api.get(`/tasks?coachId=${coachId}`);
    return response.data || [];
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }
};

/**
 * Get active subscriptions for coach (to assign tasks)
 */
export const getActiveSubscriptions = async (coachId: string): Promise<Subscription[]> => {
  try {
    const response = await api.get(`/subscriptions?coachId=${coachId}&status=active`);
    const subscriptions = response.data || [];
    
    return subscriptions.map((sub: any) => ({
      id: sub.id,
      playerId: sub.playerId,
      playerName: sub.playerName || sub.playerId,
      status: sub.status,
      startDate: sub.startDate,
      endDate: sub.endDate
    }));
  } catch (error) {
    console.error('Error fetching active subscriptions:', error);
    throw error;
  }
};

/**
 * Get active players (those with active enrollments)
 */
export const getActivePlayers = async (coachId: string): Promise<Player[]> => {
  try {
    const response = await api.get(`/subscriptions?coachId=${coachId}&status=active`);
    const subscriptions = response.data || [];
    
    // Extract unique players
    const playersMap = new Map<string, Player>();
    subscriptions.forEach((sub: any) => {
      if (!playersMap.has(sub.playerId)) {
        playersMap.set(sub.playerId, {
          id: sub.playerId,
          name: sub.playerName || sub.playerId,
          email: sub.playerEmail || ''
        });
      }
    });
    
    return Array.from(playersMap.values());
  } catch (error) {
    console.error('Error fetching active players:', error);
    throw error;
  }
};

/**
 * Check if a task conflict exists (same player + coach + overlapping dates)
 */
export const checkTaskConflict = async (
  coachId: string, 
  playerId: string, 
  startDate: string,
  dueDate: string
): Promise<boolean> => {
  try {
    const tasks = await getTasks(coachId);
    
    const newStart = new Date(startDate);
    const newEnd = new Date(dueDate);
    
    // Check if any task overlaps with the new task dates
    const conflict = tasks.some(task => {
      if (task.playerId !== playerId) return false;
      
      const taskStart = new Date(task.startDate);
      const taskEnd = new Date(task.dueDate);
      
      // Check for any overlap
      return (
        (newStart >= taskStart && newStart <= taskEnd) || // New start is within existing
        (newEnd >= taskStart && newEnd <= taskEnd) ||     // New end is within existing
        (newStart <= taskStart && newEnd >= taskEnd)      // New completely contains existing
      );
    });
    
    return conflict;
  } catch (error) {
    console.error('Error checking task conflict:', error);
    return false;
  }
};

/**
 * Create a new task
 */
export const createTask = async (taskData: CreateTaskDto): Promise<Task> => {
  try {
    const response = await api.post('/tasks', taskData);
    return response.data;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
};

/**
 * Update task status
 */
export const updateTaskStatus = async (
  taskId: string, 
  status: 'pending' | 'completed' | 'cancelled'
): Promise<Task> => {
  try {
    const response = await api.patch(`/tasks/${taskId}`, { status });
    return response.data;
  } catch (error) {
    console.error('Error updating task status:', error);
    throw error;
  }
};

/**
 * Delete a task
 */
export const deleteTask = async (taskId: string): Promise<void> => {
  try {
    await api.delete(`/tasks/${taskId}`);
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};
