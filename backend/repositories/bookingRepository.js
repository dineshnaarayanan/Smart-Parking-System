const Booking = require('../models/Booking');
const db = require('../config/db');
const { memoryStore } = require('../config/memoryStore');

function populateMemoryBooking(booking) {
  if (!booking) return null;
  const populated = { ...booking };
  
  const slotObj = memoryStore.slots.find(s => s._id === String(booking.slot));
  populated.slot = slotObj ? { ...slotObj } : booking.slot;
  
  const userObj = memoryStore.users.find(u => u._id === String(booking.user));
  if (userObj) {
    const { password, ...userWithoutPassword } = userObj;
    populated.user = userWithoutPassword;
  } else {
    populated.user = booking.user;
  }
  
  return populated;
}

const bookingRepository = {
  async findByQuery(query = {}) {
    if (db.isMock()) {
      let result = [...memoryStore.bookings];
      if (query.user) {
        result = result.filter(b => String(b.user) === String(query.user));
      }
      if (query.slot) {
        result = result.filter(b => String(b.slot) === String(query.slot));
      }
      if (query.status) {
        result = result.filter(b => b.status === query.status);
      }
      // Populate and sort by createdAt descending
      return result.map(populateMemoryBooking).sort((a, b) => b.createdAt - a.createdAt);
    }
    return await Booking.find(query)
      .populate('slot')
      .populate('user', '-password')
      .sort({ createdAt: -1 });
  },

  async findById(id) {
    if (db.isMock()) {
      const booking = memoryStore.bookings.find(b => b._id === id);
      return booking ? populateMemoryBooking(booking) : null;
    }
    return await Booking.findById(id).populate('slot').populate('user', '-password');
  },

  async create(bookingData) {
    if (db.isMock()) {
      const newBooking = {
        _id: 'booking_' + Math.random().toString(36).substr(2, 9),
        slot: bookingData.slot,
        user: bookingData.user,
        startTime: new Date(bookingData.startTime),
        endTime: new Date(bookingData.endTime),
        status: bookingData.status || 'active',
        totalPrice: parseFloat(bookingData.totalPrice),
        createdAt: new Date(),
        checkInTime: bookingData.checkInTime ? new Date(bookingData.checkInTime) : null,
        checkOutTime: bookingData.checkOutTime ? new Date(bookingData.checkOutTime) : null
      };
      memoryStore.bookings.push(newBooking);
      return populateMemoryBooking(newBooking);
    }
    const booking = new Booking(bookingData);
    const saved = await booking.save();
    return await Booking.findById(saved._id).populate('slot').populate('user', '-password');
  },

  async update(id, updateData) {
    if (db.isMock()) {
      const idx = memoryStore.bookings.findIndex(b => b._id === id);
      if (idx === -1) return null;
      
      // Update fields
      const original = memoryStore.bookings[idx];
      memoryStore.bookings[idx] = {
        ...original,
        ...updateData,
        // Ensure dates are parsed
        startTime: updateData.startTime ? new Date(updateData.startTime) : original.startTime,
        endTime: updateData.endTime ? new Date(updateData.endTime) : original.endTime,
        checkInTime: updateData.checkInTime ? new Date(updateData.checkInTime) : original.checkInTime,
        checkOutTime: updateData.checkOutTime ? new Date(updateData.checkOutTime) : original.checkOutTime
      };
      
      return populateMemoryBooking(memoryStore.bookings[idx]);
    }
    return await Booking.findByIdAndUpdate(id, updateData, { new: true })
      .populate('slot')
      .populate('user', '-password');
  }
};

module.exports = bookingRepository;
