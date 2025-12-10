const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const {
    getTrainerReviews,
    canLeaveReview,
    createReview,
    updateReview,
    deleteReview
} = require('../controllers/reviewController');

router.get('/trainer/:trainerId', getTrainerReviews);

router.get('/can-leave/:trainerId', authenticateToken, requireRole('client'), canLeaveReview);

router.post('/create', authenticateToken, requireRole('client'), createReview);

router.put('/update', authenticateToken, requireRole('client'), updateReview);

router.delete('/delete', authenticateToken, requireRole('client'), deleteReview);

module.exports = router;

