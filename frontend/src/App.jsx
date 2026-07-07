import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Auth from './components/Auth';
import SlotGrid from './components/SlotGrid';
import BookingForm from './components/BookingForm';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';

export default function App() {
  const [user, setUser] = useState(null);
  const [slots, setSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [activeTab, setActiveTab] = useState('customer');
  const [theme, setTheme] = useState('light'); // Light mode by default
  const [notification, setNotification] = useState(null);

  // Initialize Theme and User
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') || 'light';
    setTheme(storedTheme);
    if (storedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      if (parsed.role === 'admin') {
        setActiveTab('admin');
      }
    }
  }, []);

  // Fetch Slots
  const fetchSlots = async () => {
    try {
      const response = await fetch('/api/slots');
      if (response.ok) {
        const data = await response.json();
        setSlots(data);
      }
    } catch (err) {
      showNotify('Failed to fetch slot status map', 'danger');
    }
  };

  // Fetch User Bookings
  const fetchBookings = async (token) => {
    try {
      const response = await fetch('/api/bookings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setBookings(data);
      }
    } catch (err) {
      showNotify('Failed to fetch reservations list', 'danger');
    }
  };

  // Reload data when user changes
  useEffect(() => {
    fetchSlots();
    if (user) {
      fetchBookings(user.token);
    }
  }, [user]);

  const showNotify = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    if (userData.role === 'admin') {
      setActiveTab('admin');
    } else {
      setActiveTab('customer');
    }
    showNotify(`Welcome back, ${userData.name}!`);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setBookings([]);
    setSelectedSlot(null);
    showNotify('Log out successful. See you again!');
  };

  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Booking Flow operations
  const handleBookSlot = async (bookingData) => {
    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.token}`
      },
      body: JSON.stringify(bookingData)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Booking operation failed');
    }

    showNotify(`Successfully booked space ${data.slot?.spotNumber || 'Parking spot'}!`);
    setSelectedSlot(null);
    fetchSlots();
    fetchBookings(user.token);
  };

  const handleCheckIn = async (bookingId) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}/checkin`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      showNotify('Check-in confirmed! Welcome to your space.');
      fetchSlots();
      fetchBookings(user.token);
    } catch (err) {
      showNotify(err.message, 'danger');
    }
  };

  const handleCheckOut = async (bookingId) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}/checkout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      showNotify('Check-out completed! Drive safely.');
      fetchSlots();
      fetchBookings(user.token);
    } catch (err) {
      showNotify(err.message, 'danger');
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      showNotify('Reservation cancelled successfully.');
      fetchSlots();
      fetchBookings(user.token);
    } catch (err) {
      showNotify(err.message, 'danger');
    }
  };

  if (!user) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  // Count available spots
  const availRegular = slots.filter((s) => s.type === 'Regular' && s.status === 'available').length;
  const availEV = slots.filter((s) => s.type === 'EV' && s.status === 'available').length;
  const availHandicapped = slots.filter((s) => s.type === 'Handicapped' && s.status === 'available').length;

  return (
    <div className="app-container">
      {/* Global Banner Notification */}
      {notification && (
        <div 
          className={`alert alert-${notification.type}`}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 1100,
            boxShadow: 'var(--shadow-lg)',
            maxWidth: '350px'
          }}
        >
          <span>{notification.message}</span>
        </div>
      )}

      <Navbar
        user={user}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {activeTab === 'admin' ? (
        <AdminDashboard
          token={user.token}
          slots={slots}
          onRefreshSlots={fetchSlots}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Customer KPIs */}
          <div className="kpi-row">
            <div className="kpi-card">
              <div className="kpi-data">
                <span className="kpi-label">Regular Spaces Available</span>
                <span className="kpi-value">{availRegular}</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-data">
                <span className="kpi-label">EV Spaces Available</span>
                <span className="kpi-value">{availEV}</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-data">
                <span className="kpi-label">Handicapped Spaces Available</span>
                <span className="kpi-value">{availHandicapped}</span>
              </div>
            </div>
          </div>

          {/* Customer Split View: Slot Map Grid vs Booking Actions */}
          <div className="dashboard-grid split">
            <SlotGrid
              slots={slots}
              selectedSlot={selectedSlot}
              onSelectSlot={setSelectedSlot}
              onRefresh={fetchSlots}
            />

            <div>
              {selectedSlot ? (
                <BookingForm
                  slot={selectedSlot}
                  onBook={handleBookSlot}
                  onCancel={() => setSelectedSlot(null)}
                />
              ) : (
                <div className="card">
                  <h3 className="card-title">Reservation Center</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                    Select an empty (Green) space from the parking layout map to make a booking, or view and manage your active permits below.
                  </p>
                  
                  <Dashboard
                    bookings={bookings}
                    onCheckIn={handleCheckIn}
                    onCheckOut={handleCheckOut}
                    onCancelBooking={handleCancelBooking}
                  />
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
