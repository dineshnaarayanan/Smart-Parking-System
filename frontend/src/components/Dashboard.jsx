import React, { useState, useEffect } from 'react';

// Timer Component for Active Booking Countdown
function BookingCountdown({ endTime }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(endTime) - new Date();
      if (difference <= 0) {
        setTimeLeft('Time Expired');
        return;
      }

      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      const parts = [];
      if (hours > 0) parts.push(`${hours}h`);
      parts.push(`${minutes}m`);
      parts.push(`${seconds}s`);
      setTimeLeft(parts.join(' '));
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  return (
    <span style={{ display: 'inline-block', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
      {timeLeft}
    </span>
  );
}

export default function Dashboard({ bookings, onCheckIn, onCheckOut, onCancelBooking }) {
  const [selectedTicket, setSelectedTicket] = useState(null);

  const activeBookings = bookings.filter((b) => b.status === 'active');
  const pastBookings = bookings.filter((b) => b.status !== 'active');

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Active Bookings Section */}
      <div>
        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          Active Reservations ({activeBookings.length})
        </h3>
        
        {activeBookings.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
            No active reservations. Find an empty spot on the grid to book.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {activeBookings.map((booking) => {
              const hasCheckedIn = !!booking.checkInTime;
              const slot = booking.slot || {};

              return (
                <div key={booking._id} className="card" style={{ borderLeft: `4px solid ${hasCheckedIn ? 'var(--danger)' : 'var(--warning)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <span className={`badge ${hasCheckedIn ? 'badge-occupied' : 'badge-reserved'}`} style={{ marginBottom: '0.5rem' }}>
                        {hasCheckedIn ? 'Checked-In' : 'Reserved'}
                      </span>
                      <h4 style={{ fontSize: '1.15rem' }}>
                        Spot {slot.spotNumber} (Floor {slot.floor})
                      </h4>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Time Left</div>
                      <BookingCountdown endTime={booking.endTime} />
                    </div>
                  </div>

                  <div style={{ background: 'var(--background)', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', marginBottom: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-secondary)', display: 'block' }}>From</span>
                      <strong>{formatDate(booking.startTime)}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Until</span>
                      <strong>{formatDate(booking.endTime)}</strong>
                    </div>
                    {hasCheckedIn && (
                      <div style={{ gridColumn: 'span 2', borderTop: '1px solid var(--border)', paddingTop: '0.4rem', marginTop: '0.2rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Checked in: </span>
                        <strong>{formatDate(booking.checkInTime)}</strong>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button className="btn btn-secondary" onClick={() => setSelectedTicket(booking)}>
                      <span>Ticket</span>
                    </button>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {!hasCheckedIn ? (
                        <>
                          <button className="btn btn-danger btn-ghost" onClick={() => onCancelBooking(booking._id)}>
                            Cancel
                          </button>
                          <button className="btn btn-primary" onClick={() => onCheckIn(booking._id)}>
                            Check-In
                          </button>
                        </>
                      ) : (
                        <button className="btn btn-danger" onClick={() => onCheckOut(booking._id)}>
                          Check-Out
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Booking History Section */}
      <div>
        <h3 className="card-title">Booking History</h3>
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Spot Number</th>
                <th>Floor</th>
                <th>Checked In</th>
                <th>Checked Out</th>
                <th>Duration / Cost</th>
                <th>Status</th>
                <th>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {pastBookings.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    No booking history available.
                  </td>
                </tr>
              ) : (
                pastBookings.map((booking) => {
                  const slot = booking.slot || {};
                  return (
                    <tr key={booking._id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{booking._id.substr(-8)}</td>
                      <td>{slot.spotNumber || 'N/A'}</td>
                      <td>Floor {slot.floor ?? '-'}</td>
                      <td>{formatDate(booking.checkInTime || booking.startTime)}</td>
                      <td>{formatDate(booking.checkOutTime || booking.endTime)}</td>
                      <td>
                        <strong>₹{booking.totalPrice?.toFixed(2)}</strong>
                      </td>
                      <td>
                        <span className={`badge ${booking.status === 'completed' ? 'badge-available' : 'badge-occupied'}`}>
                          {booking.status === 'completed' ? 'Completed' : 'Cancelled'}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-secondary btn-ghost" style={{ padding: '0.2rem 0.5rem' }} onClick={() => setSelectedTicket(booking)}>
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ticket Modal Overlay */}
      {selectedTicket && (
        <div className="modal-backdrop" onClick={() => setSelectedTicket(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedTicket(null)}>X</button>
            <h3 className="modal-title" style={{ textAlign: 'center' }}>Parking Permit Ticket</h3>
            
            <div className="ticket-container">
              <div className="ticket-header">
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-display)' }}>SMARTPARK</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>Permit ID: {selectedTicket._id}</div>
              </div>

              <div className="ticket-row">
                <span>Spot Number</span>
                <strong style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>{selectedTicket.slot?.spotNumber || 'N/A'}</strong>
              </div>
              <div className="ticket-row">
                <span>Floor Level</span>
                <strong>Floor {selectedTicket.slot?.floor ?? '-'}</strong>
              </div>
              <div className="ticket-row">
                <span>Vehicle Type Allowed</span>
                <span className="badge badge-handicapped" style={{ fontSize: '0.7rem' }}>
                  {selectedTicket.slot?.type || 'Regular'}
                </span>
              </div>
              <div className="ticket-row" style={{ marginTop: '0.5rem' }}>
                <span>Scheduled From</span>
                <strong>{formatDate(selectedTicket.startTime)}</strong>
              </div>
              <div className="ticket-row">
                <span>Scheduled Until</span>
                <strong>{formatDate(selectedTicket.endTime)}</strong>
              </div>
              
              {selectedTicket.checkInTime && (
                <div className="ticket-row">
                  <span>Actual Check-In</span>
                  <strong>{formatDate(selectedTicket.checkInTime)}</strong>
                </div>
              )}
              {selectedTicket.checkOutTime && (
                <div className="ticket-row">
                  <span>Actual Check-Out</span>
                  <strong>{formatDate(selectedTicket.checkOutTime)}</strong>
                </div>
              )}

              <div className="ticket-row total">
                <span>Amount Paid</span>
                <span>₹{selectedTicket.totalPrice?.toFixed(2)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setSelectedTicket(null)}>
                Close
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handlePrint}>
                Print Ticket
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
