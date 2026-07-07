import React, { useState } from 'react';

export default function SlotGrid({ slots, selectedSlot, onSelectSlot, onRefresh }) {
  const [filterType, setFilterType] = useState('All');

  // Filter slots based on selected type
  const filteredSlots = slots.filter((slot) => {
    if (filterType === 'All') return true;
    return slot.type === filterType;
  });

  // Group slots by floor
  const slotsByFloor = filteredSlots.reduce((acc, slot) => {
    const floor = slot.floor;
    if (!acc[floor]) acc[floor] = [];
    acc[floor].push(slot);
    return acc;
  }, {});

  const getStatusLabel = (status) => {
    if (status === 'available') return 'Available';
    if (status === 'reserved') return 'Reserved';
    return 'Occupied';
  };

  const getSpotTextLabel = (type) => {
    if (type === 'EV') return <span style={{ color: 'var(--ev-color)', fontSize: '0.7rem', fontWeight: 600 }}>(EV)</span>;
    if (type === 'Handicapped') return <span style={{ color: 'var(--info)', fontSize: '0.7rem', fontWeight: 600 }}>(H)</span>;
    return null;
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 className="card-title" style={{ marginBottom: '0.25rem' }}>Real-time Slot Map</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Click on an available space to create a booking.</p>
        </div>
        <button className="btn btn-secondary" onClick={onRefresh} title="Refresh Status">
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Row */}
      <div className="filter-row">
        <button
          className={`filter-pill ${filterType === 'All' ? 'active' : ''}`}
          onClick={() => setFilterType('All')}
        >
          All Slots
        </button>
        <button
          className={`filter-pill ${filterType === 'Regular' ? 'active' : ''}`}
          onClick={() => setFilterType('Regular')}
        >
          Regular
        </button>
        <button
          className={`filter-pill ${filterType === 'EV' ? 'active' : ''}`}
          onClick={() => setFilterType('EV')}
        >
          EV Charging
        </button>
        <button
          className={`filter-pill ${filterType === 'Handicapped' ? 'active' : ''}`}
          onClick={() => setFilterType('Handicapped')}
        >
          Handicapped
        </button>
      </div>

      {/* Legend */}
      <div className="chart-legend" style={{ justifyContent: 'flex-start', margin: '0 0 1.5rem 0' }}>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: 'var(--success)' }}></div>
          <span>Available</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: 'var(--warning)' }}></div>
          <span>Reserved</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: 'var(--danger)' }}></div>
          <span>Occupied</span>
        </div>
        <div className="legend-item" style={{ borderLeft: '1px solid var(--border)', paddingLeft: '0.75rem' }}>
          <span style={{ color: 'var(--ev-color)', fontWeight: 700, fontSize: '0.75rem' }}>EV</span>
          <span>EV Charging</span>
        </div>
        <div className="legend-item">
          <span style={{ color: 'var(--info)', fontWeight: 700, fontSize: '0.75rem' }}>H</span>
          <span>Handicapped</span>
        </div>
      </div>

      <div className="slot-grid-container">
        {Object.keys(slotsByFloor).length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            No parking slots found matching the criteria.
          </div>
        ) : (
          Object.keys(slotsByFloor).sort().map((floor) => (
            <div key={floor} className="floor-section">
              <h4 className="floor-title">
                Floor {floor} {parseInt(floor) === 0 ? '(Ground Floor)' : ''}
              </h4>
              <div className="spots-grid">
                {slotsByFloor[floor]
                  .sort((a, b) => a.spotNumber.localeCompare(b.spotNumber))
                  .map((slot) => {
                    const isSelected = selectedSlot && selectedSlot._id === slot._id;
                    const spotClass = `parking-spot ${slot.status} ${isSelected ? 'selected' : ''}`;

                    return (
                      <div
                        key={slot._id}
                        className={spotClass}
                        onClick={() => {
                          if (slot.status === 'available') {
                            onSelectSlot(slot);
                          }
                        }}
                        style={{
                          opacity: slot.status !== 'available' && !isSelected ? 0.75 : 1,
                          cursor: slot.status === 'available' ? 'pointer' : 'not-allowed'
                        }}
                      >
                        <div className="spot-header">
                          <span className="spot-number">{slot.spotNumber}</span>
                          {getSpotTextLabel(slot.type)}
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '0.5rem' }}>
                          <span className="spot-price">₹{slot.ratePerHour}/hr</span>
                          <span 
                            className="spot-badge" 
                            style={{ 
                              color: isSelected ? 'var(--primary)' : `var(--${slot.status === 'available' ? 'success' : (slot.status === 'reserved' ? 'warning' : 'danger')})`,
                              fontWeight: 700 
                            }}
                          >
                            {isSelected ? 'Selected' : getStatusLabel(slot.status)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
