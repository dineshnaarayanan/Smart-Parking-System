const ParkingSlot = require('../models/ParkingSlot');
const db = require('../config/db');
const { memoryStore } = require('../config/memoryStore');

const slotRepository = {
  async findAll(filter = {}) {
    if (db.isMock()) {
      let result = [...memoryStore.slots];
      if (filter.type) {
        result = result.filter(s => s.type === filter.type);
      }
      if (filter.floor !== undefined) {
        result = result.filter(s => s.floor === parseInt(filter.floor));
      }
      if (filter.status) {
        result = result.filter(s => s.status === filter.status);
      }
      return result;
    }
    return await ParkingSlot.find(filter);
  },

  async findById(id) {
    if (db.isMock()) {
      const slot = memoryStore.slots.find(s => s._id === id);
      return slot ? { ...slot } : null;
    }
    return await ParkingSlot.findById(id);
  },

  async create(slotData) {
    if (db.isMock()) {
      const newSlot = {
        _id: 'slot_' + Math.random().toString(36).substr(2, 9),
        spotNumber: slotData.spotNumber,
        floor: parseInt(slotData.floor),
        type: slotData.type || 'Regular',
        status: slotData.status || 'available',
        ratePerHour: parseFloat(slotData.ratePerHour)
      };
      // Check uniqueness
      const exists = memoryStore.slots.some(s => s.spotNumber.toLowerCase() === slotData.spotNumber.toLowerCase());
      if (exists) {
        throw new Error(`Slot number ${slotData.spotNumber} already exists`);
      }
      memoryStore.slots.push(newSlot);
      return { ...newSlot };
    }
    const slot = new ParkingSlot(slotData);
    return await slot.save();
  },

  async update(id, updateData) {
    if (db.isMock()) {
      const idx = memoryStore.slots.findIndex(s => s._id === id);
      if (idx === -1) return null;
      memoryStore.slots[idx] = {
        ...memoryStore.slots[idx],
        ...updateData
      };
      return { ...memoryStore.slots[idx] };
    }
    return await ParkingSlot.findByIdAndUpdate(id, updateData, { new: true });
  },

  async updateStatus(id, status) {
    return this.update(id, { status });
  }
};

module.exports = slotRepository;
