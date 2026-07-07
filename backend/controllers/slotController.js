const slotRepository = require('../repositories/slotRepository');

// @desc    Get all parking slots
// @route   GET /api/slots
// @access  Public
const getSlots = async (req, res, next) => {
  try {
    const { floor, type, status } = req.query;
    const filter = {};
    
    if (floor !== undefined) filter.floor = floor;
    if (type) filter.type = type;
    if (status) filter.status = status;

    const slots = await slotRepository.findAll(filter);
    res.json(slots);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a parking slot
// @route   POST /api/slots
// @access  Private/Admin
const createSlot = async (req, res, next) => {
  try {
    const { spotNumber, floor, type, ratePerHour } = req.body;

    if (!spotNumber || floor === undefined || !ratePerHour) {
      res.status(400);
      throw new Error('Please add all fields: spotNumber, floor, ratePerHour');
    }

    const slot = await slotRepository.create({
      spotNumber,
      floor,
      type: type || 'Regular',
      ratePerHour,
      status: 'available'
    });

    res.status(201).json(slot);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a parking slot
// @route   PUT /api/slots/:id
// @access  Private/Admin
const updateSlot = async (req, res, next) => {
  try {
    const { spotNumber, floor, type, ratePerHour, status } = req.body;
    const { id } = req.params;

    const slot = await slotRepository.findById(id);
    if (!slot) {
      res.status(404);
      throw new Error('Parking slot not found');
    }

    const updated = await slotRepository.update(id, {
      spotNumber,
      floor,
      type,
      ratePerHour,
      status
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSlots,
  createSlot,
  updateSlot
};
