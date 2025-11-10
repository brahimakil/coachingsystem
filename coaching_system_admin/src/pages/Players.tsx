import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { MdAdd, MdDelete, MdClose, MdCheckCircle, MdPending, MdCancel } from 'react-icons/md';
import { playersService } from '../services/players.service';
import '../styles/players.css';

interface Player {
  id: string;
  name: string;
  email: string;
  dateOfBirth: string;
  status: 'active' | 'pending_activation' | 'rejected';
  createdAt: any;
}

const Players = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [viewingPlayer, setViewingPlayer] = useState<Player | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    dateOfBirth: '',
    status: 'pending_activation',
  });

  useEffect(() => {
    fetchPlayers();
  }, [searchTerm, statusFilter]);

  const fetchPlayers = async () => {
    try {
      const response = await playersService.getAll(
        searchTerm || undefined,
        statusFilter !== 'all' ? statusFilter : undefined
      );
      setPlayers(response.data || []);
    } catch (err) {
      console.error('Error fetching players:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      console.log('Creating player:', formData);
      
      await playersService.create(formData);
      setShowModal(false);
      resetForm();
      fetchPlayers();
      alert('Player created successfully!');
    } catch (err: any) {
      console.error('Error creating player:', err);
      console.error('Error response:', err.response);
      
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create player';
      alert(`Error: ${errorMessage}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this player?')) return;

    try {
      await playersService.delete(id);
      fetchPlayers();
      alert('Player deleted successfully!');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to delete player';
      alert(`Error: ${errorMessage}`);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await playersService.update(id, { status });
      fetchPlayers();
      alert('Status updated successfully!');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update status';
      alert(`Error: ${errorMessage}`);
    }
  };

  const handleView = (player: Player) => {
    setViewingPlayer(player);
  };

  const handleEdit = (player: Player) => {
    setEditingPlayer(player);
    setFormData({
      name: player.name,
      email: player.email,
      password: '',
      dateOfBirth: player.dateOfBirth,
      status: player.status,
    });
    setShowModal(true);
  };

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingPlayer) return;

    try {
      const updateData: any = {
        name: formData.name,
        dateOfBirth: formData.dateOfBirth,
        status: formData.status,
      };

      await playersService.update(editingPlayer.id, updateData);
      setShowModal(false);
      setEditingPlayer(null);
      resetForm();
      fetchPlayers();
      alert('Player updated successfully!');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update player';
      alert(`Error: ${errorMessage}`);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      dateOfBirth: '',
      status: 'pending_activation',
    });
    setEditingPlayer(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <MdCheckCircle size={20} />;
      case 'pending_activation':
        return <MdPending size={20} />;
      case 'rejected':
        return <MdCancel size={20} />;
      default:
        return null;
    }
  };

  if (loading) {
    return <div className="players-container">Loading...</div>;
  }

  return (
    <div className="players-container">
      <div className="players-header">
        <div>
          <h1>Players Management</h1>
          <p className="subtitle">Manage all registered players</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <MdAdd size={20} />
          Add Player
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="search-filter-bar">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-box">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending_activation">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {players.length === 0 ? (
        <div className="empty-state">
          <p>No players yet. Add your first player!</p>
        </div>
      ) : (
        <div className="players-grid">
          {players.map((player) => (
            <div key={player.id} className="player-card">
              <div className="player-header">
                <h3>{player.name}</h3>
                <span className={`status-badge ${player.status}`}>
                  {getStatusIcon(player.status)}
                  {player.status === 'active' && 'Active'}
                  {player.status === 'pending_activation' && 'Pending'}
                  {player.status === 'rejected' && 'Rejected'}
                </span>
              </div>

              <div className="player-details">
                <div className="detail-row">
                  <span className="label">Email:</span>
                  <span>{player.email}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Date of Birth:</span>
                  <span>{new Date(player.dateOfBirth).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="player-actions">
                <button className="btn-icon view" onClick={() => handleView(player)}>
                  View
                </button>
                <button className="btn-icon edit" onClick={() => handleEdit(player)}>
                  Edit
                </button>
                <select
                  value={player.status}
                  onChange={(e) => handleUpdateStatus(player.id, e.target.value)}
                  className="status-select"
                >
                  <option value="active">Active</option>
                  <option value="pending_activation">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
                <button className="btn-icon delete" onClick={() => handleDelete(player.id)}>
                  <MdDelete size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); resetForm(); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingPlayer ? 'Edit Player' : 'Add New Player'}</h2>
              <button className="btn-close" onClick={() => { setShowModal(false); resetForm(); }}>
                <MdClose size={24} />
              </button>
            </div>

            <form onSubmit={editingPlayer ? handleUpdate : handleSubmit} className="player-form">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled={!!editingPlayer}
                  />
                </div>
                {!editingPlayer && (
                  <div className="form-group">
                    <label>Password *</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      minLength={6}
                    />
                  </div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Date of Birth *</label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    required
                  >
                    <option value="pending_activation">Pending Activation</option>
                    <option value="active">Active</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => { setShowModal(false); resetForm(); }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingPlayer ? 'Update Player' : 'Create Player'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Player Modal */}
      {viewingPlayer && (
        <div className="modal-overlay" onClick={() => setViewingPlayer(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Player Details</h2>
              <button className="btn-close" onClick={() => setViewingPlayer(null)}>
                <MdClose size={24} />
              </button>
            </div>

            <div className="view-player-details">
              <div className="view-section">
                <h3>Personal Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="label">Full Name:</span>
                    <span className="value">{viewingPlayer.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Email:</span>
                    <span className="value">{viewingPlayer.email}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Date of Birth:</span>
                    <span className="value">{new Date(viewingPlayer.dateOfBirth).toLocaleDateString()}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Status:</span>
                    <span className={`status-badge ${viewingPlayer.status}`}>
                      {viewingPlayer.status === 'active' && <MdCheckCircle />}
                      {viewingPlayer.status === 'pending_activation' && <MdPending />}
                      {viewingPlayer.status === 'rejected' && <MdCancel />}
                      {viewingPlayer.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setViewingPlayer(null)}>
                  Close
                </button>
                <button className="btn-primary" onClick={() => { handleEdit(viewingPlayer); setViewingPlayer(null); }}>
                  Edit Player
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Players;
