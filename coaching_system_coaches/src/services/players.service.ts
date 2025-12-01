import api from './api';

export interface Subscription {
  id: string;
  playerId: string;
  playerName: string;
  playerEmail: string;
  coachId: string;
  coachName: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'pending' | 'rejected' | 'stopped';
  createdAt: string;
  updatedAt: string;
}

export interface Player {
  id: string;
  name: string;
  email: string;
  position?: string;
  enrollmentStatus: 'active' | 'pending' | 'rejected' | 'stopped';
  avatar?: string;
  enrollmentDate: string;
  subscriptionId: string;
  endDate: string;
}

/**
 * Fetch all subscriptions (enrollments) for the current coach
 */
export const getPlayers = async (coachId: string): Promise<Player[]> => {
  try {
    // Trigger automatic expiration check
    await api.post('/subscriptions/expire-check');
    
    // Fetch subscriptions for this coach
    const response = await api.get(`/subscriptions?coachId=${coachId}`);
    const subscriptions: Subscription[] = response.data || [];

    // Transform subscriptions to player enrollment format
    const players: Player[] = subscriptions.map(sub => ({
      id: sub.playerId,
      name: sub.playerName,
      email: sub.playerEmail,
      position: 'Player', // Position not stored in subscription, can be fetched from player details if needed
      enrollmentStatus: sub.status,
      enrollmentDate: sub.startDate,
      subscriptionId: sub.id,
      endDate: sub.endDate
    }));

    return players;
  } catch (error) {
    console.error('Error fetching players:', error);
    throw error;
  }
};

/**
 * Update enrollment (subscription) status
 */
export const updateEnrollmentStatus = async (
  subscriptionId: string, 
  status: 'active' | 'pending' | 'rejected' | 'stopped'
): Promise<Subscription> => {
  try {
    const response = await api.patch(`/subscriptions/${subscriptionId}`, { status });
    return response.data;
  } catch (error) {
    console.error('Error updating enrollment status:', error);
    throw error;
  }
};

/**
 * Update subscription (enrollment) with full details including dates and status
 */
export const updateSubscription = async (
  subscriptionId: string, 
  data: { startDate: string; endDate: string; status: string }
): Promise<Subscription> => {
  try {
    // Only send the fields we want to update (exclude playerId, coachId, etc.)
    const updateData = {
      startDate: data.startDate,
      endDate: data.endDate,
      status: data.status as 'active' | 'pending' | 'rejected' | 'stopped'
    };
    
    const response = await api.patch(`/subscriptions/${subscriptionId}`, updateData);
    return response.data;
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
};

/**
 * Export players to Excel format (returns CSV data)
 */
export const exportPlayersToExcel = (players: Player[]): void => {
  // Create CSV content
  const headers = ['Name', 'Email', 'Position', 'Enrollment Date', 'End Date', 'Status'];
  const rows = players.map(p => [
    p.name,
    p.email,
    p.position || 'Player',
    new Date(p.enrollmentDate).toLocaleDateString(),
    new Date(p.endDate).toLocaleDateString(),
    p.enrollmentStatus
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `players_export_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  link.remove();
};

/**
 * Open Gmail to compose email to player
 */
export const openGmailToPlayer = (email: string, name: string): void => {
  const subject = encodeURIComponent(`Training Update - ${name}`);
  const body = encodeURIComponent(`Hi ${name},\n\n`);
  window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
};
