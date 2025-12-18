import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { MdAdd, MdDelete, MdClose, MdCheckCircle, MdPending, MdCancel } from 'react-icons/md';
import { coachesService } from '../services/coaches.service';
import '../styles/coaches.css';

interface Coach {
  id: string;
  name: string;
  email: string;
  dateOfBirth: string;
  profession: string;
  pricePerSession?: number;
  availableDays: string[];
  availableHours: Record<string, { start: string; end: string }[]>;
  status: 'active' | 'pending_activation' | 'rejected';
  cvUrl?: string;
  profilePictureUrl?: string;
  passportPictureUrl?: string;
  createdAt: any;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const Coaches = () => {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCoach, setEditingCoach] = useState<Coach | null>(null);
  const [viewingCoach, setViewingCoach] = useState<Coach | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    dateOfBirth: '',
    profession: '',
    pricePerSession: '',
    availableDays: [] as string[],
    availableHours: {} as Record<string, { start: string; end: string }[]>,
    status: 'pending_activation',
  });
  const [files, setFiles] = useState({
    cv: null as File | null,
    profilePicture: null as File | null,
    passportPicture: null as File | null,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCoaches();
  }, [searchTerm, statusFilter]);

  const fetchCoaches = async () => {
    try {
      setLoading(true);
      const response = await coachesService.getAll(
        searchTerm || undefined,
        statusFilter !== 'all' ? statusFilter : undefined
      );
      setCoaches(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch coaches');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('password', formData.password);
      formDataToSend.append('dateOfBirth', formData.dateOfBirth);
      formDataToSend.append('profession', formData.profession);
      formDataToSend.append('pricePerSession', formData.pricePerSession);
      formDataToSend.append('status', formData.status);
      
      // Send arrays and objects as JSON strings
      formData.availableDays.forEach(day => {
        formDataToSend.append('availableDays[]', day);
      });
      formDataToSend.append('availableHours', JSON.stringify(formData.availableHours));

      if (files.cv) formDataToSend.append('cv', files.cv);
      if (files.profilePicture) formDataToSend.append('profilePicture', files.profilePicture);
      if (files.passportPicture) formDataToSend.append('passportPicture', files.passportPicture);

      console.log('Form Data being sent:');
      console.log('Name:', formData.name);
      console.log('Email:', formData.email);
      console.log('DOB:', formData.dateOfBirth);
      console.log('Profession:', formData.profession);
      console.log('Available Days:', formData.availableDays);
      console.log('Available Hours:', formData.availableHours);
      console.log('Available Hours JSON:', JSON.stringify(formData.availableHours, null, 2));
      console.log('Status:', formData.status);
      console.log('CV:', files.cv);
      console.log('Profile Picture:', files.profilePicture);
      console.log('Passport Picture:', files.passportPicture);

      const response = await coachesService.create(formDataToSend);
      console.log('Success response:', response);
      
      setShowModal(false);
      resetForm();
      fetchCoaches();
      alert('Coach created successfully!');
    } catch (err: any) {
      console.error('Error creating coach:', err);
      console.error('Error response:', err.response);
      console.error('Error data:', err.response?.data);
      
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create coach';
      alert(`Error: ${errorMessage}`);
      setError(errorMessage);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this coach?')) return;

    try {
      await coachesService.delete(id);
      fetchCoaches();
      alert('Coach deleted successfully!');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to delete coach';
      alert(`Error: ${errorMessage}`);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await coachesService.update(id, { status });
      fetchCoaches();
      alert('Status updated successfully!');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update status';
      alert(`Error: ${errorMessage}`);
    }
  };

  const handleView = (coach: Coach) => {
    setViewingCoach(coach);
  };

  const handleEdit = (coach: Coach) => {
    setEditingCoach(coach);
    setFormData({
      name: coach.name,
      email: coach.email,
      password: '',
      dateOfBirth: coach.dateOfBirth,
      profession: coach.profession,
      pricePerSession: coach.pricePerSession ? coach.pricePerSession.toString() : '',
      availableDays: coach.availableDays || [],
      availableHours: coach.availableHours || {},
      status: coach.status,
    });
    setShowModal(true);
  };

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingCoach) return;

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('dateOfBirth', formData.dateOfBirth);
      formDataToSend.append('profession', formData.profession);
      formDataToSend.append('pricePerSession', formData.pricePerSession);
      formDataToSend.append('status', formData.status);
      
      formData.availableDays.forEach(day => {
        formDataToSend.append('availableDays[]', day);
      });
      formDataToSend.append('availableHours', JSON.stringify(formData.availableHours));

      if (files.cv) formDataToSend.append('cv', files.cv);
      if (files.profilePicture) formDataToSend.append('profilePicture', files.profilePicture);
      if (files.passportPicture) formDataToSend.append('passportPicture', files.passportPicture);

      await coachesService.update(editingCoach.id, formDataToSend);
      setShowModal(false);
      setEditingCoach(null);
      resetForm();
      fetchCoaches();
      alert('Coach updated successfully!');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update coach';
      alert(`Error: ${errorMessage}`);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      dateOfBirth: '',
      profession: '',
      pricePerSession: '',
      availableDays: [],
      availableHours: {},
      status: 'pending_activation',
    });
    setFiles({
      cv: null,
      profilePicture: null,
      passportPicture: null,
    });
    setEditingCoach(null);
    setError('');
  };

  const toggleDay = (day: string) => {
    setFormData(prev => {
      const newDays = prev.availableDays.includes(day)
        ? prev.availableDays.filter(d => d !== day)
        : [...prev.availableDays, day];
      
      const newHours = { ...prev.availableHours };
      if (!newDays.includes(day)) {
        delete newHours[day];
      } else if (!newHours[day]) {
        newHours[day] = [{ start: '09:00', end: '17:00' }];
      }

      return { ...prev, availableDays: newDays, availableHours: newHours };
    });
  };

  const updateDayHours = (day: string, index: number, field: 'start' | 'end', value: string) => {
    setFormData(prev => {
      const newHours = { ...prev.availableHours };
      if (newHours[day] && newHours[day][index]) {
        newHours[day][index][field] = value;
        
        // If updating end time and there's a next slot, update its start time
        if (field === 'end' && newHours[day][index + 1]) {
          newHours[day][index + 1].start = value;
        }
      }
      return { ...prev, availableHours: newHours };
    });
  };

  const addTimeSlot = (day: string) => {
    setFormData(prev => {
      const newHours = { ...prev.availableHours };
      if (!newHours[day]) {
        newHours[day] = [];
      }
      
      // Get the last slot's end time to use as the new slot's start time
      const lastSlot = newHours[day][newHours[day].length - 1];
      if (!lastSlot) {
        newHours[day].push({ start: '09:00', end: '17:00' });
        return { ...prev, availableHours: newHours };
      }
      
      const newStartTime = lastSlot.end;
      const firstSlotStart = newHours[day][0]?.start || '00:00';
      
      // Convert to minutes for comparison
      const [startH, startM] = newStartTime.split(':').map(Number);
      const [firstH, firstM] = firstSlotStart.split(':').map(Number);
      const newStartMinutes = startH * 60 + startM;
      const firstStartMinutes = firstH * 60 + firstM;
      
      // Check if we've wrapped around (new start is before or equal to first start)
      if (newStartMinutes <= firstStartMinutes && newHours[day].length > 0) {
        alert('Cannot add more time slots. The schedule has reached the end of the day.');
        return prev;
      }
      
      // Calculate end time (default 2 hours after start, but max 23:59)
      const endMinutes = Math.min(newStartMinutes + 120, 23 * 60 + 59);
      const endHours = Math.floor(endMinutes / 60);
      const endMins = endMinutes % 60;
      const newEndTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
      
      // Create new array to ensure immutability
      const updatedSlots = [...newHours[day], { start: newStartTime, end: newEndTime }];
      
      return { ...prev, availableHours: { ...prev.availableHours, [day]: updatedSlots } };
    });
  };

  const removeTimeSlot = (day: string, index: number) => {
    setFormData(prev => {
      const newHours = { ...prev.availableHours };
      if (newHours[day]) {
        newHours[day].splice(index, 1);
      }
      return { ...prev, availableHours: newHours };
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <MdCheckCircle className="status-icon active" />;
      case 'pending_activation':
        return <MdPending className="status-icon pending" />;
      case 'rejected':
        return <MdCancel className="status-icon rejected" />;
      default:
        return null;
    }
  };

  return (
    <div className="coaches-container">
      <div className="coaches-header">
        <div>
          <h1>Coaches Management</h1>
          <p className="subtitle">Manage your coaching staff</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <MdAdd size={20} />
          Add Coach
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="search-filter-bar">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by name, email, or profession..."
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

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="loading">Loading coaches...</div>
      ) : (
        <div className="coaches-grid">
          {coaches.map(coach => (
            <div key={coach.id} className="coach-card">
              <div className="coach-card-header">
                {coach.profilePictureUrl ? (
                  <img src={coach.profilePictureUrl} alt={coach.name} className="coach-avatar" />
                ) : (
                  <div className="coach-avatar-placeholder">{coach.name.charAt(0)}</div>
                )}
                <div className="coach-info">
                  <h3>{coach.name}</h3>
                  <p>{coach.email}</p>
                </div>
                {getStatusIcon(coach.status)}
              </div>

              <div className="coach-details">
                <div className="detail-row">
                  <span className="label">Date of Birth:</span>
                  <span>{new Date(coach.dateOfBirth).toLocaleDateString()}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Profession:</span>
                  <span>{coach.profession}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Price Per Session:</span>
                  <span className="price-tag">${coach.pricePerSession || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Available Days:</span>
                  <span>{coach.availableDays.join(', ')}</span>
                </div>
                {coach.cvUrl && (
                  <a href={coach.cvUrl} target="_blank" rel="noopener noreferrer" className="cv-link">
                    View CV
                  </a>
                )}
              </div>

              <div className="coach-actions">
                <button className="btn-icon view" onClick={() => handleView(coach)}>
                  View
                </button>
                <button className="btn-icon edit" onClick={() => handleEdit(coach)}>
                  Edit
                </button>
                <select
                  value={coach.status}
                  onChange={(e) => handleUpdateStatus(coach.id, e.target.value)}
                  className="status-select"
                >
                  <option value="active">Active</option>
                  <option value="pending_activation">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
                <button className="btn-icon delete" onClick={() => handleDelete(coach.id)}>
                  <MdDelete size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); resetForm(); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingCoach ? 'Edit Coach' : 'Add New Coach'}</h2>
              <button className="btn-close" onClick={() => { setShowModal(false); resetForm(); }}>
                <MdClose size={24} />
              </button>
            </div>

            <form onSubmit={editingCoach ? handleUpdate : handleSubmit} className="coach-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Date of Birth *</label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled={!!editingCoach}
                  />
                </div>
                {!editingCoach && (
                  <div className="form-group">
                    <label>Password *</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                  </div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Profession (Sports) *</label>
                  <input
                    type="text"
                    value={formData.profession}
                    onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                    placeholder="e.g., Football, Basketball"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Price Per Session ($) *</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.pricePerSession}
                    onChange={(e) => setFormData({ ...formData, pricePerSession: e.target.value })}
                    placeholder="e.g., 50"
                    required
                  />
                  <small style={{ color: '#64748b', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    Maximum: $100 per session
                  </small>
                </div>
              </div>

              {/* Days Selector */}
              <div className="form-group">
                <label>Available Days *</label>
                <div className="days-selector">
                  {DAYS_OF_WEEK.map(day => (
                    <button
                      key={day}
                      type="button"
                      className={`day-btn ${formData.availableDays.includes(day) ? 'selected' : ''}`}
                      onClick={() => toggleDay(day)}
                    >
                      {day.substring(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time slots for selected days */}
              {formData.availableDays.length > 0 && (
                <div className="form-group">
                  <label>Available Hours *</label>
                  <div className="time-slots-container">
                    {formData.availableDays.map(day => (
                      <div key={day} className="day-time-slot">
                        <div className="day-label">{day}</div>
                        {formData.availableHours[day]?.map((slot, index) => (
                          <div key={index} className="time-slot-row">
                            <input
                              type="time"
                              value={slot.start}
                              onChange={(e) => updateDayHours(day, index, 'start', e.target.value)}
                              required
                            />
                            <span>to</span>
                            <input
                              type="time"
                              value={slot.end}
                              onChange={(e) => updateDayHours(day, index, 'end', e.target.value)}
                              required
                            />
                            {formData.availableHours[day].length > 1 && (
                              <button
                                type="button"
                                className="btn-remove-slot"
                                onClick={() => removeTimeSlot(day, index)}
                              >
                                ×
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          className="btn-add-slot"
                          onClick={() => addTimeSlot(day)}
                        >
                          + Add Time Slot
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>CV (PDF) {!editingCoach && '*'}</label>
                  <div className="file-input-wrapper">
                    <label className="file-input-label">
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setFiles({ ...files, cv: e.target.files?.[0] || null })}
                        required={!editingCoach}
                      />
                      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="12" y1="18" x2="12" y2="12"></line>
                        <line x1="9" y1="15" x2="15" y2="15"></line>
                      </svg>
                      <span className="file-label-text">
                        {files.cv ? files.cv.name : 'Click to upload CV (PDF)'}
                      </span>
                      <span className="file-label-hint">PDF files only</span>
                    </label>
                    {editingCoach && editingCoach.cvUrl && (
                      <a href={editingCoach.cvUrl} target="_blank" rel="noopener noreferrer" className="current-file-link">
                        📄 View Current CV
                      </a>
                    )}
                  </div>
                </div>
                <div className="form-group">
                  <label>Profile Picture {!editingCoach && '*'}</label>
                  <div className="file-input-wrapper">
                    <label className="file-input-label">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setFiles({ ...files, profilePicture: e.target.files?.[0] || null })}
                        required={!editingCoach}
                      />
                      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21 15 16 10 5 21"></polyline>
                      </svg>
                      <span className="file-label-text">
                        {files.profilePicture ? files.profilePicture.name : 'Click to upload Profile Picture'}
                      </span>
                      <span className="file-label-hint">JPG, PNG, GIF accepted</span>
                    </label>
                    {editingCoach && editingCoach.profilePictureUrl && (
                      <a href={editingCoach.profilePictureUrl} target="_blank" rel="noopener noreferrer" className="current-file-link">
                        🖼️ View Current Picture
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Passport Picture {!editingCoach && '*'}</label>
                <div className="file-input-wrapper">
                  <label className="file-input-label">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFiles({ ...files, passportPicture: e.target.files?.[0] || null })}
                      required={!editingCoach}
                    />
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                    <span className="file-label-text">
                      {files.passportPicture ? files.passportPicture.name : 'Click to upload Passport Picture'}
                    </span>
                    <span className="file-label-hint">JPG, PNG, GIF accepted</span>
                  </label>
                  {editingCoach && editingCoach.passportPictureUrl && (
                    <a href={editingCoach.passportPictureUrl} target="_blank" rel="noopener noreferrer" className="current-file-link">
                      📷 View Current Picture
                    </a>
                  )}
                </div>
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

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => { setShowModal(false); resetForm(); }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingCoach ? 'Update Coach' : 'Create Coach'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Coach Modal */}
      {viewingCoach && (
        <div className="modal-overlay" onClick={() => setViewingCoach(null)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Coach Details</h2>
              <button className="btn-close" onClick={() => setViewingCoach(null)}>
                <MdClose size={24} />
              </button>
            </div>

            <div className="view-coach-details">
              <div className="view-section">
                <h3>Personal Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="label">Full Name:</span>
                    <span className="value">{viewingCoach.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Email:</span>
                    <span className="value">{viewingCoach.email}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Date of Birth:</span>
                    <span className="value">{new Date(viewingCoach.dateOfBirth).toLocaleDateString()}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Profession:</span>
                    <span className="value">{viewingCoach.profession}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Price Per Session:</span>
                    <span className="value price-tag">${viewingCoach.pricePerSession || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Status:</span>
                    <span className={`status-badge ${viewingCoach.status}`}>
                      {viewingCoach.status === 'active' && <MdCheckCircle />}
                      {viewingCoach.status === 'pending_activation' && <MdPending />}
                      {viewingCoach.status === 'rejected' && <MdCancel />}
                      {viewingCoach.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="view-section">
                <h3>Schedule</h3>
                <div className="schedule-view">
                  {viewingCoach.availableDays && viewingCoach.availableDays.length > 0 ? (
                    viewingCoach.availableDays.map(day => (
                      <div key={day} className="day-schedule">
                        <strong>{day}:</strong>
                        <div className="time-slots-view">
                          {viewingCoach.availableHours[day]?.map((slot, idx) => (
                            <span key={idx} className="time-slot-badge">
                              {slot.start} - {slot.end}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p>No schedule available</p>
                  )}
                </div>
              </div>

              <div className="view-section">
                <h3>Documents & Photos</h3>
                <div className="documents-grid">
                  {viewingCoach.cvUrl && (
                    <a href={viewingCoach.cvUrl} target="_blank" rel="noopener noreferrer" className="doc-link">
                      📄 View CV
                    </a>
                  )}
                  {viewingCoach.profilePictureUrl && (
                    <div className="photo-preview">
                      <p>Profile Picture:</p>
                      <img src={viewingCoach.profilePictureUrl} alt="Profile" />
                    </div>
                  )}
                  {viewingCoach.passportPictureUrl && (
                    <div className="photo-preview">
                      <p>Passport Picture:</p>
                      <img src={viewingCoach.passportPictureUrl} alt="Passport" />
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setViewingCoach(null)}>
                  Close
                </button>
                <button className="btn-primary" onClick={() => { handleEdit(viewingCoach); setViewingCoach(null); }}>
                  Edit Coach
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Coaches;
