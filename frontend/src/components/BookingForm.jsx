import React, { useState, useEffect } from 'react';

export default function BookingForm({ slot, onBook, onCancel }) {
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [durationHours, setDurationHours] = useState(1);
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Set default dates on load
  useEffect(() => {
    const now = new Date();
    // Format to YYYY-MM-DDTHH:MM local string
    const formatLocalDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    setStartTime(formatLocalDate(now));
    
    // Default end time is 1 hour later
    const end = new Date(now.getTime() + 60 * 60 * 1000);
    setEndTime(formatLocalDate(end));
  }, []);

  // Update duration and cost when times change
  useEffect(() => {
    if (!startTime || !endTime) return;
    
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      setEstimatedCost(0);
      setDurationHours(0);
      return;
    }

    const diffMs = end - start;
    const hours = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60)));
    setDurationHours(hours);
    setEstimatedCost(hours * slot.ratePerHour);
  }, [startTime, endTime, slot.ratePerHour]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      setError('Check-out time must be after check-in time');
      return;
    }

    const now = new Date();
    if (end < now) {
      setError('Booking cannot end in the past');
      return;
    }

    setLoading(true);
    try {
      await onBook({
        slotId: slot._id,
        startTime: start.toISOString(),
        endTime: end.toISOString()
      });
    } catch (err) {
      setError(err.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ border: '1px solid var(--primary)' }}>
      <h3 className="card-title" style={{ color: 'var(--primary)' }}>
        Create Booking for {slot.spotNumber}
      </h3>

      {error && (
        <div className="alert alert-danger" style={{ padding: '0.75rem' }}>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Check-In Time</label>
            <input
              type="datetime-local"
              className="form-input"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              style={{ fontSize: '0.8rem' }}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Check-Out Time</label>
            <input
              type="datetime-local"
              className="form-input"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              style={{ fontSize: '0.8rem' }}
              required
            />
          </div>
        </div>

        {/* Dynamic Details Box */}
        <div style={{ background: 'var(--background)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Hourly Rate</span>
            <span style={{ fontWeight: 600 }}>₹{slot.ratePerHour}/hour</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Calculated Duration</span>
            <span style={{ fontWeight: 600 }}>{durationHours} {durationHours === 1 ? 'hour' : 'hours'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', borderTop: '1px dashed var(--border)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
            <span style={{ fontWeight: 700 }}>Estimated Cost</span>
            <span style={{ fontWeight: 800, color: 'var(--success)' }}>₹{estimatedCost.toFixed(2)}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={loading || durationHours <= 0}>
            {loading ? (
              <div className="spinner" style={{ width: '16px', height: '16px', borderLeftColor: '#fff' }} />
            ) : (
              <span>Confirm Booking</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
