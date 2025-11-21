import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { MdAdd, MdEdit, MdDelete, MdClose, MdCheckCircle, MdPending, MdCancel, MdBlock } from 'react-icons/md';
import { subscriptionsService } from '../services/subscriptions.service';
import { playersService } from '../services/players.service';
import { coachesService } from '../services/coaches.service';
import '../styles/subscriptions.css';

interface Subscription {
  id: string;
  playerId: string;
  coachId: string;
  playerName?: string;
  playerEmail?: string;
  coachName?: string;
  coachEmail?: string;
  status: 'active' | 'pending' | 'rejected' | 'stopped';
  startDate: string;
  endDate: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Player {
  id: string;
  name: string;
  email: string;
}

interface Coach {
  id: string;
  name: string;
  email: string;
}

const Subscriptions = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [viewingSubscription, setViewingSubscription] = useState<Subscription | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState<{
    playerId: string;
    coachId: string;
    status: 'active' | 'pending' | 'rejected' | 'stopped';
    startDate: string;
    endDate: string;
  }>({
    playerId: '',
    coachId: '',
    status: 'active',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchPlayers();
    fetchCoaches();
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchSubscriptions();
    }, 300); // Wait 300ms after user stops typing

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, statusFilter]);

  const fetchPlayers = async () => {
    try {
      const response = await playersService.getAll(undefined, 'active');
      setPlayers(response.data || []);
    } catch (err) {
      console.error('Error fetching players:', err);
      setPlayers([]);
    }
  };

  const fetchCoaches = async () => {
    try {
      const response = await coachesService.getAll(undefined, 'active');
      setCoaches(response.data || []);
    } catch (err) {
      console.error('Error fetching coaches:', err);
      setCoaches([]);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const data = await subscriptionsService.getAll(
        searchTerm || undefined,
        statusFilter !== 'all' ? statusFilter : undefined
      );
      setSubscriptions(data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await subscriptionsService.create(formData);
      await fetchSubscriptions();
      setShowModal(false);
      resetForm();
    } catch (err) {
      console.error('Error creating subscription:', err);
    }
  };

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingSubscription) return;

    try {
      await subscriptionsService.update(editingSubscription.id, formData);
      await fetchSubscriptions();
      setShowModal(false);
      setEditingSubscription(null);
      resetForm();
    } catch (err) {
      console.error('Error updating subscription:', err);
    }
  };

  const handleEdit = (subscription: Subscription) => {
    setEditingSubscription(subscription);
    setFormData({
      playerId: subscription.playerId,
      coachId: subscription.coachId,
      status: subscription.status,
      startDate: subscription.startDate.split('T')[0],
      endDate: subscription.endDate.split('T')[0],
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this subscription?')) {
      try {
        await subscriptionsService.delete(id);
        await fetchSubscriptions();
      } catch (err) {
        console.error('Error deleting subscription:', err);
      }
    }
  };

  const handleView = (subscription: Subscription) => {
    setViewingSubscription(subscription);
  };

  const resetForm = () => {
    setFormData({
      playerId: '',
      coachId: '',
      status: 'active',
      startDate: '',
      endDate: '',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <MdCheckCircle className="status-icon active" />;
      case 'pending':
        return <MdPending className="status-icon pending" />;
      case 'rejected':
        return <MdCancel className="status-icon rejected" />;
      case 'stopped':
        return <MdBlock className="status-icon stopped" />;
      default:
        return null;
    }
  };

  return (
    <div className="subscriptions-container">
      <div className="subscriptions-header">
        <h1>Subscriptions Management</h1>
        <button className="btn-add" onClick={() => setShowModal(true)}>
          <MdAdd /> Add Subscription
        </button>
      </div>

      <div className="search-filter-bar">
        <input
          type="text"
          placeholder="Search by Player ID or Coach ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="status-filter"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
          <option value="stopped">Stopped</option>
        </select>
      </div>

      <div className="subscriptions-grid">
        {loading ? (
          <div className="loading">Loading subscriptions...</div>
        ) : subscriptions.length === 0 ? (
          <p className="no-data">No subscriptions found</p>
        ) : (
          subscriptions.map((subscription) => (
            <div key={subscription.id} className="subscription-card">
              <div className="card-header">
                {getStatusIcon(subscription.status)}
                <span className={`status-badge ${subscription.status}`}>
                  {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                </span>
              </div>
              <div className="card-body">
                <div className="detail-row">
                  <span className="label">Player:</span>
                  <span className="player-name">{subscription.playerName || subscription.playerId}</span>
                </div>
                {subscription.playerEmail && (
                  <div className="detail-row">
                    <span className="label">Player Email:</span>
                    <span className="player-email">{subscription.playerEmail}</span>
                  </div>
                )}
                <div className="detail-row">
                  <span className="label">Coach:</span>
                  <span className="coach-name">{subscription.coachName || subscription.coachId}</span>
                </div>
                {subscription.coachEmail && (
                  <div className="detail-row">
                    <span className="label">Coach Email:</span>
                    <span className="coach-email">{subscription.coachEmail}</span>
                  </div>
                )}
                <div className="detail-row">
                  <span className="label">Start Date:</span>
                  <span>{new Date(subscription.startDate).toLocaleDateString()}</span>
                </div>
                <div className="detail-row">
                  <span className="label">End Date:</span>
                  <span>{new Date(subscription.endDate).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="card-actions">
                <button className="btn-view" onClick={() => handleView(subscription)}>
                  View
                </button>
                <button className="btn-edit" onClick={() => handleEdit(subscription)}>
                  <MdEdit /> Edit
                </button>
                <button className="btn-delete" onClick={() => handleDelete(subscription.id)}>
                  <MdDelete /> Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); setEditingSubscription(null); resetForm(); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingSubscription ? 'Edit Subscription' : 'Add New Subscription'}</h2>
              <button
                className="btn-close"
                onClick={() => {
                  setShowModal(false);
                  setEditingSubscription(null);
                  resetForm();
                }}
              >
                <MdClose />
              </button>
            </div>
            <form onSubmit={editingSubscription ? handleUpdate : handleSubmit}>
              <div className="form-group">
                <label>Player *</label>
                <select
                  value={formData.playerId}
                  onChange={(e) => setFormData({ ...formData, playerId: e.target.value })}
                  required
                >
                  <option value="">Select a player</option>
                  {Array.isArray(players) && players.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.name} - {player.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Coach *</label>
                <select
                  value={formData.coachId}
                  onChange={(e) => setFormData({ ...formData, coachId: e.target.value })}
                  required
                >
                  <option value="">Select a coach</option>
                  {Array.isArray(coaches) && coaches.map((coach) => (
                    <option key={coach.id} value={coach.id}>
                      {coach.name} - {coach.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Status *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  required
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                  <option value="stopped">Stopped (Needs Renew)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Start Date *</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>End Date *</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn-submit">
                  {editingSubscription ? 'Update' : 'Create'} Subscription
                </button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => {
                    setShowModal(false);
                    setEditingSubscription(null);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewingSubscription && (
        <div className="modal-overlay" onClick={() => setViewingSubscription(null)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Subscription Details</h2>
              <button className="btn-close" onClick={() => setViewingSubscription(null)}>
                <MdClose />
              </button>
            </div>
            <div className="view-content">
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="label">Player:</span>
                  <span className="value">{viewingSubscription.playerName || viewingSubscription.playerId}</span>
                </div>
                {viewingSubscription.playerEmail && (
                  <div className="detail-item">
                    <span className="label">Player Email:</span>
                    <span className="value">{viewingSubscription.playerEmail}</span>
                  </div>
                )}
                <div className="detail-item">
                  <span className="label">Coach:</span>
                  <span className="value">{viewingSubscription.coachName || viewingSubscription.coachId}</span>
                </div>
                {viewingSubscription.coachEmail && (
                  <div className="detail-item">
                    <span className="label">Coach Email:</span>
                    <span className="value">{viewingSubscription.coachEmail}</span>
                  </div>
                )}
                <div className="detail-item">
                  <span className="label">Status:</span>
                  <span className={`status-badge ${viewingSubscription.status}`}>
                    {getStatusIcon(viewingSubscription.status)}
                    {viewingSubscription.status.charAt(0).toUpperCase() + viewingSubscription.status.slice(1)}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="label">Start Date:</span>
                  <span className="value">{new Date(viewingSubscription.startDate).toLocaleDateString()}</span>
                </div>
                <div className="detail-item">
                  <span className="label">End Date:</span>
                  <span className="value">{new Date(viewingSubscription.endDate).toLocaleDateString()}</span>
                </div>
                {viewingSubscription.createdAt && (
                  <div className="detail-item">
                    <span className="label">Created At:</span>
                    <span className="value">{new Date(viewingSubscription.createdAt).toLocaleString()}</span>
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

export default Subscriptions;
