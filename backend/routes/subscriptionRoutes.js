const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const {
    getAllSubscriptions,
    createSubscription,
    updateSubscription,
    deleteSubscription
} = require('../controllers/subscriptionController');

router.get('/', authenticateToken, requireRole('admin'), getAllSubscriptions);
router.post('/', authenticateToken, requireRole('admin'), createSubscription);
router.put('/:id', authenticateToken, requireRole('admin'), updateSubscription);
router.delete('/:id', authenticateToken, requireRole('admin'), deleteSubscription);

module.exports = router;

