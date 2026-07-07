// In-Memory Database Store for fallback execution
const bcrypt = require('bcryptjs');

const memoryStore = {
  users: [],
  slots: [],
  bookings: []
};

// Seed initial parking slots in memory if empty
function seedMemorySlots() {
  if (memoryStore.slots.length > 0) return;

  const types = ['Regular', 'EV', 'Handicapped'];
  let spotCounter = 101;

  // Floor 0, 1, 2
  for (let floor = 0; floor <= 2; floor++) {
    for (let i = 1; i <= 8; i++) {
      const type = i <= 2 ? 'EV' : (i === 3 ? 'Handicapped' : 'Regular');
      const rate = type === 'EV' ? 5.0 : (type === 'Handicapped' ? 2.0 : 3.0);
      
      memoryStore.slots.push({
        _id: `slot_${floor}_${i}`,
        spotNumber: `P-${floor}-${spotCounter++}`,
        floor: floor,
        type: type,
        status: 'available',
        ratePerHour: rate
      });
    }
  }
}

// Seed default admin in memory
async function seedMemoryAdmin() {
  const adminExists = memoryStore.users.some(u => u.role === 'admin');
  if (adminExists) return;

  const hashedPassword = await bcrypt.hash('admin123', 10);
  memoryStore.users.push({
    _id: 'user_admin',
    name: 'System Admin',
    email: 'admin@parking.com',
    password: hashedPassword,
    role: 'admin',
    createdAt: new Date()
  });
}

module.exports = {
  memoryStore,
  seedMemorySlots,
  seedMemoryAdmin
};
