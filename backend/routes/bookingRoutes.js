const express = require('express');
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  getAllBookings,
  cancelBooking,
  checkIn,
  checkOut,
  getAnalytics
} = require('../controllers/bookingController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, createBooking)
  .get(protect, getMyBookings);

router.get('/all', protect, isAdmin, getAllBookings);
router.get('/analytics', protect, isAdmin, getAnalytics);

router.post('/:id/cancel', protect, cancelBooking);
router.post('/:id/checkin', protect, checkIn);
router.post('/:id/checkout', protect, checkOut);

module.exports = router;
