const mongoose = require('mongoose');

const parkingSlotSchema = new mongoose.Schema({
  spotNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  floor: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['Regular', 'EV', 'Handicapped'],
    default: 'Regular'
  },
  status: {
    type: String,
    enum: ['available', 'reserved', 'occupied'],
    default: 'available'
  },
  ratePerHour: {
    type: Number,
    required: true
  }
});

module.exports = mongoose.model('ParkingSlot', parkingSlotSchema);
