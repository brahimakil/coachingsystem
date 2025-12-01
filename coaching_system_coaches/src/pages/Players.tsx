import React, { useState, useEffect } from 'react';
import { 
  MdCheck, 
  MdClose, 
  MdRefresh, 
  MdEmail, 
  MdFileDownload, 
  MdWarning,
  MdSearch,
  MdEdit,
  MdPlayArrow,
  MdStop
} from 'react-icons/md';
import { useAuth } from '../contexts/AuthContext';
import { 
  getPlayers, 
  updateEnrollmentStatus,
  updateSubscription,
  exportPlayersToExcel,
  openGmailToPlayer,
  Player
} from '../services/players.service';
import '../styles/players.css';

const Players: React.FC = () => {
  const { user } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    const userId = user?.uid || user?.id;
    if (userId) {
      loadPlayers(userId);
    }
  }, [user]);

  useEffect(() => {
    // Apply filters
    let filtered = players;

    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.enrollmentStatus === statusFilter);
    }

    setFilteredPlayers(filtered);
  }, [players, searchTerm, statusFilter]);

  const loadPlayers = async (coachId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPlayers(coachId);
      setPlayers(data);
      setFilteredPlayers(data);
    } catch (error: any) {
      console.error('Failed to load players', error);
      setError(error.message || 'Failed to load players');
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollmentStatusChange = async (subscriptionId: string, newStatus: Player['enrollmentStatus']) => {
    try {
      await updateEnrollmentStatus(subscriptionId, newStatus);
      // Reload players to get updated data
      const userId = user?.uid || user?.id;
      if (userId) {
        await loadPlayers(userId);
      }
    } catch (error: any) {
      console.error('Failed to update enrollment status', error);
      setError(error.message || 'Failed to update enrollment status');
    }
  };

  const handleExportAll = () => {
    exportPlayersToExcel(filteredPlayers);
  };

  const handleEditPlayer = (player: Player) => {
    setEditingPlayer(player);
    setShowEditModal(true);
  };

  const handleUpdatePlayer = async (data: { startDate: string; endDate: string; status: string }) => {
    if (!editingPlayer) return;

    try {
      await updateSubscription(editingPlayer.subscriptionId, data);
      setShowEditModal(false);
      setEditingPlayer(null);
      
      // Reload players
      const userId = user?.uid || user?.id;
      if (userId) {
        await loadPlayers(userId);
      }
    } catch (error: any) {
      console.error('Failed to update enrollment', error);
      setError(error.message || 'Failed to update enrollment');
    }
  };

  const isExpiringSoon = (endDate: string): boolean => {
    const end = new Date(endDate);
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return end >= now && end <= sevenDaysFromNow;
  };

  if (loading) {
    return (
      <div className="players-page">
        <div className="loading-spinner">Loading players...</div>
      </div>
    );
  }

  return (
    <div className="players-page">
      <div className="page-header">
        <div>
          <h1>My Players</h1>
          <p className="page-subtitle">Manage your player enrollments and subscriptions</p>
        </div>
        <button className="btn-export" onClick={handleExportAll}>
          <MdFileDownload /> Export All
        </button>
      </div>

      {error && (
        <div className="error-banner">
          <MdWarning /> {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Filters */}
      <div className="players-filters">
        <div className="search-box">
          <MdSearch />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          className="status-filter"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="stopped">Stopped</option>
          <option value="rejected">Rejected</option>
        </select>

        <div className="players-count">
          {filteredPlayers.length} player{filteredPlayers.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="table-container">
        <table className="players-table">
          <thead>
            <tr>
              <th>Player</th>
              <th>Enrollment Date</th>
              <th>End Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPlayers.length === 0 ? (
              <tr>
                <td colSpan={5} className="no-data">
                  No players found
                </td>
              </tr>
            ) : (
              filteredPlayers.map((player) => (
                <tr key={player.subscriptionId}>
                  <td>
                    <div className="player-cell">
                      <div className="player-avatar">
                        {player.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="player-info">
                        <span className="player-name">{player.name}</span>
                        <span className="player-email">{player.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>{new Date(player.enrollmentDate).toLocaleDateString()}</td>
                  <td>
                    <div className="end-date-cell">
                      {new Date(player.endDate).toLocaleDateString()}
                      {player.enrollmentStatus === 'active' && isExpiringSoon(player.endDate) && (
                        <span className="expiring-badge" title="Expiring within 7 days">
                          <MdWarning /> Soon
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge status-${player.enrollmentStatus}`}>
                      {player.enrollmentStatus}
                    </span>
                  </td>
                  <td>
                    <div className="actions-cell">
                      {player.enrollmentStatus === 'pending' && (
                        <>
                          <button 
                            className="icon-action-btn approve" 
                            title="Approve Enrollment"
                            onClick={() => handleEnrollmentStatusChange(player.subscriptionId, 'active')}
                          >
                            <MdCheck />
                          </button>
                          <button 
                            className="icon-action-btn reject" 
                            title="Reject Enrollment"
                            onClick={() => handleEnrollmentStatusChange(player.subscriptionId, 'rejected')}
                          >
                            <MdClose />
                          </button>
                        </>
                      )}
                      {player.enrollmentStatus === 'active' && (
                        <button 
                          className="icon-action-btn reject" 
                          title="Stop Enrollment"
                          onClick={() => handleEnrollmentStatusChange(player.subscriptionId, 'stopped')}
                        >
                          <MdStop />
                        </button>
                      )}
                      {player.enrollmentStatus === 'stopped' && (
                        <button 
                          className="icon-action-btn approve" 
                          title="Reactivate Enrollment"
                          onClick={() => handleEnrollmentStatusChange(player.subscriptionId, 'active')}
                        >
                          <MdPlayArrow />
                        </button>
                      )}
                      <button 
                        className="icon-action-btn" 
                        title="Edit Enrollment"
                        onClick={() => handleEditPlayer(player)}
                      >
                        <MdEdit />
                      </button>
                      <button 
                        className="icon-action-btn" 
                        title="Email Player"
                        onClick={() => openGmailToPlayer(player.email, player.name)}
                      >
                        <MdEmail />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {showEditModal && editingPlayer && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Enrollment - {editingPlayer.name}</h2>
              <button 
                className="modal-close"
                onClick={() => setShowEditModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleUpdatePlayer({
                  startDate: formData.get('startDate') as string,
                  endDate: formData.get('endDate') as string,
                  status: formData.get('status') as string
                });
              }}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="startDate">Start Date</label>
                    <input
                      id="startDate"
                      name="startDate"
                      type="date"
                      defaultValue={editingPlayer.enrollmentDate.split('T')[0]}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="endDate">End Date</label>
                    <input
                      id="endDate"
                      name="endDate"
                      type="date"
                      defaultValue={editingPlayer.endDate.split('T')[0]}
                      required
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="status">Enrollment Status</label>
                  <select
                    id="status"
                    name="status"
                    defaultValue={editingPlayer.enrollmentStatus}
                    required
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="stopped">Stopped</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-primary">
                    Save Changes
                  </button>
                  <button 
                    type="button" 
                    className="btn-secondary"
                    onClick={() => setShowEditModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Players;
