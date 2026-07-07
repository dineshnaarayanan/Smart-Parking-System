import React, { useState, useEffect } from 'react';

export default function AdminDashboard({ token, slots, onRefreshSlots }) {
  const [analytics, setAnalytics] = useState(null);
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add Spot Form States
  const [spotNumber, setSpotNumber] = useState('');
  const [floor, setFloor] = useState(0);
  const [type, setType] = useState('Regular');
  const [ratePerHour, setRatePerHour] = useState(3.0);
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState('');

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch analytics
      const analyticRes = await fetch('/api/bookings/analytics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const analyticData = await analyticRes.json();

      // Fetch all bookings
      const bookingsRes = await fetch('/api/bookings/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const bookingsData = await bookingsRes.json();

      if (!analyticRes.ok || !bookingsRes.ok) {
        throw new Error('Failed to load admin analytics');
      }

      setAnalytics(analyticData);
      setAllBookings(bookingsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAdminData();
    }
  }, [token]);

  const handleAddSlot = async (e) => {
    e.preventDefault();
    setFormSuccess('');
    setError('');
    setFormLoading(true);

    try {
      const response = await fetch('/api/slots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ spotNumber, floor, type, ratePerHour })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create slot');
      }

      setFormSuccess(`Slot ${data.spotNumber} created successfully!`);
      setSpotNumber('');
      onRefreshSlots(); // Refresh slot map
      fetchAdminData(); // Refresh analytics
    } catch (err) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleSlotStatus = async (slotId, currentStatus) => {
    const nextStatus = currentStatus === 'available' ? 'occupied' : 'available'; // Block/Unblock
    try {
      const response = await fetch(`/api/slots/${slotId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });

      if (response.ok) {
        onRefreshSlots();
        fetchAdminData();
      }
    } catch (err) {
      console.error('Failed to toggle slot state:', err);
    }
  };

  const handleForceCancel = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        fetchAdminData();
        onRefreshSlots();
      }
    } catch (err) {
      console.error('Failed to cancel booking:', err);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem' }}>
        <div className="spinner" />
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading administrative panel...</p>
      </div>
    );
  }

  const { summary = {}, typeDistribution = {}, bookingTrends = [] } = analytics || {};

  // Resolve Max Revenue for Scaling Chart Bars
  const maxRevenue = bookingTrends.reduce((max, t) => Math.max(max, t.revenue), 1) || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* KPI Cards Row */}
      <div className="kpi-row">
        <div className="kpi-card">
          <div className="kpi-data">
            <span className="kpi-label">Total Revenue</span>
            <span className="kpi-value">₹{summary.totalRevenue?.toFixed(2) || '0.00'}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-data">
            <span className="kpi-label">Occupancy Rate</span>
            <span className="kpi-value">{summary.occupancyRate || 0}%</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-data">
            <span className="kpi-label">Active Spots</span>
            <span className="kpi-value">{summary.occupiedSlots + summary.reservedSlots || 0} / {summary.totalSlots || 0}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-data">
            <span className="kpi-label">Total Bookings</span>
            <span className="kpi-value">{summary.totalBookings || 0}</span>
          </div>
        </div>
      </div>

      {/* Main Administrative Columns split: Charts vs Slot Manager */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        
        {/* Analytics Charts */}
        <div className="card">
          <h3 className="card-title">
            Weekly Revenue Analytics
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Daily income metrics scaled dynamically.</p>

          <div className="chart-container">
            {bookingTrends.map((trend) => {
              // Calculate percentage height
              const heightPct = Math.max(10, Math.round((trend.revenue / maxRevenue) * 90));
              return (
                <div key={trend.day} className="chart-bar-wrapper">
                  <div className="chart-bar-tooltip">₹{trend.revenue.toFixed(2)}</div>
                  <div className="chart-bar" style={{ height: `${heightPct}%` }}></div>
                  <span className="chart-label">{trend.day.substr(0, 3)}</span>
                </div>
              );
            })}
          </div>

          {/* Slices of vehicle type breakdown */}
          <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
            <h4 style={{ fontSize: '0.9rem', marginBottom: '0.75rem' }}>Spot Type Capacity Allocation</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {Object.entries(typeDistribution).map(([typeName, count]) => {
                const percentage = summary.totalSlots ? Math.round((count / summary.totalSlots) * 100) : 0;
                let colorVar = 'var(--primary)';
                if (typeName === 'EV') colorVar = 'var(--ev-color)';
                if (typeName === 'Handicapped') colorVar = 'var(--info)';
                
                return (
                  <div key={typeName} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '120px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: colorVar }}></div>
                      <span>{typeName}</span>
                    </div>
                    {/* Horizontal Progress Bar */}
                    <div style={{ flex: 1, height: '6px', background: 'var(--background)', borderRadius: '999px', margin: '0 1rem', overflow: 'hidden' }}>
                      <div style={{ width: `${percentage}%`, height: '100%', backgroundColor: colorVar, borderRadius: '999px' }}></div>
                    </div>
                    <span style={{ fontWeight: 600, width: '45px', textAlign: 'right' }}>{count} ({percentage}%)</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Slot Administration Panel */}
        <div className="card">
          <h3 className="card-title">
            Add Parking Space
          </h3>

          {formSuccess && (
            <div className="alert alert-success" style={{ padding: '0.75rem' }}>
              <span>{formSuccess}</span>
            </div>
          )}

          <form onSubmit={handleAddSlot}>
            <div className="form-group">
              <label className="form-label">Spot ID / Number</label>
              <input
                type="text"
                className="form-input"
                placeholder="P-0-109"
                value={spotNumber}
                onChange={(e) => setSpotNumber(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Floor</label>
                <select className="form-input" value={floor} onChange={(e) => setFloor(parseInt(e.target.value))}>
                  <option value="0">Floor 0 (Ground)</option>
                  <option value="1">Floor 1</option>
                  <option value="2">Floor 2</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Vehicle Type</label>
                <select className="form-input" value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="Regular">Regular</option>
                  <option value="EV">EV Charging</option>
                  <option value="Handicapped">Handicapped</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Hourly Rate (₹)</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                className="form-input"
                value={ratePerHour}
                onChange={(e) => setRatePerHour(parseFloat(e.target.value))}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.7rem' }} disabled={formLoading}>
              {formLoading ? <div className="spinner" style={{ width: '16px', height: '16px', borderLeftColor: '#fff' }} /> : 'Provision Slot'}
            </button>
          </form>

          {/* Slot Locker List */}
          <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Slot Maintenance Actions</h4>
            <div style={{ maxHeight: '160px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
              {slots.map((s) => (
                <div key={s._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', borderBottom: '1px solid var(--border)', fontSize: '0.8rem' }}>
                  <span>{s.spotNumber} (Floor {s.floor})</span>
                  <button 
                    className={`btn ${s.status === 'occupied' ? 'btn-danger' : 'btn-secondary'}`} 
                    style={{ padding: '0.15rem 0.5rem', fontSize: '0.75rem', boxShadow: 'none' }}
                    onClick={() => handleToggleSlotStatus(s._id, s.status)}
                    disabled={s.status === 'reserved'}
                  >
                    {s.status === 'occupied' ? 'Unlock' : 'Block Slot'}
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Bookings Tracker Table */}
      <div className="card">
        <h3 className="card-title">Live Bookings Logs</h3>
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Permit ID</th>
                <th>User Details</th>
                <th>Spot</th>
                <th>From / Until</th>
                <th>Total Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {allBookings.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    No bookings logged in the system.
                  </td>
                </tr>
              ) : (
                allBookings.map((b) => {
                  const user = b.user || {};
                  const slot = b.slot || {};
                  return (
                    <tr key={b._id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{b._id.substr(-8)}</td>
                      <td>
                        <strong>{user.name || 'Unknown'}</strong>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{user.email || 'N/A'}</div>
                      </td>
                      <td>{slot.spotNumber || 'N/A'}</td>
                      <td>
                        <span style={{ fontSize: '0.75rem' }}>{new Date(b.startTime).toLocaleString()}</span>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>{new Date(b.endTime).toLocaleString()}</div>
                      </td>
                      <td>₹{b.totalPrice?.toFixed(2)}</td>
                      <td>
                        <span className={`badge ${b.status === 'active' ? 'badge-reserved' : (b.status === 'completed' ? 'badge-available' : 'badge-occupied')}`}>
                          {b.status}
                        </span>
                      </td>
                      <td>
                        {b.status === 'active' ? (
                          <button className="btn btn-danger btn-ghost" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleForceCancel(b._id)}>
                            Force Cancel
                          </button>
                        ) : '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
