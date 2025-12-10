const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const {
    getMyBookings,
    bookGroupSession,
    cancelBooking
} = require('../controllers/bookingController');

router.get('/my', authenticateToken, requireRole('client'), getMyBookings);


router.post('/book', authenticateToken, requireRole('client'), bookGroupSession);

router.post('/cancel', authenticateToken, requireRole('client'), cancelBooking);

module.exports = router;

