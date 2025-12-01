import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { MdEmail, MdLock, MdPerson, MdWork, MdCalendarToday, MdAttachMoney } from 'react-icons/md';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    dateOfBirth: '',
    profession: '',
    pricePerSession: '',
    availableDays: [] as string[],
    availableHours: {} as Record<string, { start: string; end: string }[]>
  });

  const [files, setFiles] = useState({
    cv: null as File | null,
    profilePicture: null as File | null,
    passportPicture: null as File | null,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
      if (newHours[day]?.[index]) {
        newHours[day][index][field] = value;
        
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
      
      const lastSlot = newHours[day][newHours[day].length - 1];
      if (!lastSlot) {
        newHours[day].push({ start: '09:00', end: '17:00' });
        return { ...prev, availableHours: newHours };
      }
      
      const newStartTime = lastSlot.end;
      const firstSlotStart = newHours[day][0]?.start || '00:00';
      
      const [startH, startM] = newStartTime.split(':').map(Number);
      const [firstH, firstM] = firstSlotStart.split(':').map(Number);
      const newStartMinutes = startH * 60 + startM;
      const firstStartMinutes = firstH * 60 + firstM;
      
      if (newStartMinutes <= firstStartMinutes && newHours[day].length > 0) {
        alert('Cannot add more time slots. The schedule has reached the end of the day.');
        return prev;
      }
      
      const endMinutes = Math.min(newStartMinutes + 120, 23 * 60 + 59);
      const endHours = Math.floor(endMinutes / 60);
      const endMins = endMinutes % 60;
      const newEndTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
      
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.availableDays.length === 0) {
      setError('Please select at least one available day');
      return;
    }

    // Validate files are uploaded
    if (!files.cv) {
      setError('Please upload your CV (PDF)');
      return;
    }

    if (!files.profilePicture) {
      setError('Please upload your profile picture');
      return;
    }

    if (!files.passportPicture) {
      setError('Please upload your passport picture');
      return;
    }

    setLoading(true);

    try {
      // Create FormData for multipart upload
      const formDataToSend = new FormData();
      formDataToSend.append('email', formData.email);
      formDataToSend.append('password', formData.password);
      formDataToSend.append('name', formData.name);
      formDataToSend.append('dateOfBirth', formData.dateOfBirth);
      formDataToSend.append('profession', formData.profession);
      formDataToSend.append('pricePerSession', formData.pricePerSession);
      
      // Append arrays and objects as JSON
      formData.availableDays.forEach(day => {
        formDataToSend.append('availableDays[]', day);
      });
      formDataToSend.append('availableHours', JSON.stringify(formData.availableHours));
      
      // Append files
      if (files.cv) formDataToSend.append('cv', files.cv);
      if (files.profilePicture) formDataToSend.append('profilePicture', files.profilePicture);
      if (files.passportPicture) formDataToSend.append('passportPicture', files.passportPicture);

      console.log('Submitting coach registration...');
      console.log('Available Days:', formData.availableDays);
      console.log('Available Hours:', formData.availableHours);
      console.log('Files:', {
        cv: files.cv?.name,
        profilePicture: files.profilePicture?.name,
        passportPicture: files.passportPicture?.name,
      });

      await authService.register(formDataToSend);
      navigate('/login', { state: { message: 'Application submitted successfully. Please wait for approval.' } });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card glass-panel register-card">
        <div className="auth-header">
          <h1>Join as Coach</h1>
          <p>Step {step} of 3</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {step === 1 && (
            <>
              <div className="form-group">
                <label>Full Name</label>
                <div className="input-wrapper">
                  <MdPerson className="input-icon" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Mohammad Karrit"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <div className="input-wrapper">
                  <MdEmail className="input-icon" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="karritcoach@example.com"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Password</label>
                  <div className="input-wrapper">
                    <MdLock className="input-icon" />
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Min. 6 chars"
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Confirm</label>
                  <div className="input-wrapper">
                    <MdLock className="input-icon" />
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Repeat password"
                      required
                    />
                  </div>
                </div>
              </div>

              <button type="button" className="btn-primary auth-submit" onClick={() => setStep(2)}>
                Next Step
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label>Date of Birth</label>
                  <div className="input-wrapper">
                    <MdCalendarToday className="input-icon" />
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Price / Session ($)</label>
                  <div className="input-wrapper">
                    <MdAttachMoney className="input-icon" />
                    <input
                      type="number"
                      name="pricePerSession"
                      value={formData.pricePerSession}
                      onChange={handleChange}
                      placeholder="50"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Profession / Speciality</label>
                <div className="input-wrapper">
                  <MdWork className="input-icon" />
                  <input
                    type="text"
                    name="profession"
                    value={formData.profession}
                    onChange={handleChange}
                    placeholder="e.g. Senior Football Coach"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Available Days</label>
                <div className="days-grid">
                  {DAYS_OF_WEEK.map(day => (
                    <button
                      key={day}
                      type="button"
                      className={`day-chip ${formData.availableDays.includes(day) ? 'active' : ''}`}
                      onClick={() => toggleDay(day)}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time slots for selected days */}
              {formData.availableDays.length > 0 && (
                <div className="form-group">
                  <label>Available Hours for Each Day</label>
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
                <button type="button" className="btn-secondary" onClick={() => setStep(1)}>
                  Back
                </button>
                <button type="button" className="btn-primary" onClick={() => setStep(3)}>
                  Next Step
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="form-group">
                <label>CV (PDF) *</label>
                <div className="file-input-wrapper">
                  <label className="file-input-label">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setFiles({ ...files, cv: e.target.files?.[0] || null })}
                      required
                    />
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                </div>
              </div>

              <div className="form-group">
                <label>Profile Picture *</label>
                <div className="file-input-wrapper">
                  <label className="file-input-label">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFiles({ ...files, profilePicture: e.target.files?.[0] || null })}
                      required
                    />
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                    <span className="file-label-text">
                      {files.profilePicture ? files.profilePicture.name : 'Click to upload Profile Picture'}
                    </span>
                    <span className="file-label-hint">JPG, PNG, GIF accepted</span>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>Passport Picture *</label>
                <div className="file-input-wrapper">
                  <label className="file-input-label">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFiles({ ...files, passportPicture: e.target.files?.[0] || null })}
                      required
                    />
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                    <span className="file-label-text">
                      {files.passportPicture ? files.passportPicture.name : 'Click to upload Passport Picture'}
                    </span>
                    <span className="file-label-hint">JPG, PNG, GIF accepted</span>
                  </label>
                </div>
              </div>

              <div className="form-row">
                <button type="button" className="btn-secondary" onClick={() => setStep(2)}>
                  Back
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </>
          )}
        </form>

        <div className="auth-footer">
          <p>
            Already have an account? <Link to="/login">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
