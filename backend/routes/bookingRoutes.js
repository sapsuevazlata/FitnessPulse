const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const {
    getMyBookings,
    bookGroupSession,
    cancelBooking
} = require('../controllers/bookingController');

// Получить все записи клиента
router.get('/my', authenticateToken, requireRole('client'), getMyBookings);

// Записаться на групповое занятие
router.post('/book', authenticateToken, requireRole('client'), bookGroupSession);

// Отменить запись
router.post('/cancel', authenticateToken, requireRole('client'), cancelBooking);

module.exports = router;

