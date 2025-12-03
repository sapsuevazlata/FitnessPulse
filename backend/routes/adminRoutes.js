const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const {
    getStats,
    getProfile,
    updateProfile,
    getReportsStats
} = require('../controllers/adminController');
const {
    getAllSubscriptions,
    createSubscription,
    updateSubscription,
    deleteSubscription
} = require('../controllers/subscriptionController');
const {
    getTrainerSchedule,
    createTrainerSchedule,
    updateTrainerSchedule,
    deleteTrainerSchedule,
    getAvailableTrainers
} = require('../controllers/scheduleController');
const { getGroupSessionsList } = require('../controllers/groupSessionController');

router.get('/subscriptions', authenticateToken, requireRole('admin'), getAllSubscriptions);
router.post('/subscriptions', authenticateToken, requireRole('admin'), createSubscription);
router.put('/subscriptions/:id', authenticateToken, requireRole('admin'), updateSubscription);
router.delete('/subscriptions/:id', authenticateToken, requireRole('admin'), deleteSubscription);

router.get('/stats', authenticateToken, requireRole('admin'), getStats);
router.get('/trainer-schedule', authenticateToken, requireRole('admin'), getTrainerSchedule);
router.post('/trainer-schedule', authenticateToken, requireRole('admin'), createTrainerSchedule);
router.put('/trainer-schedule/:id', authenticateToken, requireRole('admin'), updateTrainerSchedule);
router.delete('/trainer-schedule/:id', authenticateToken, requireRole('admin'), deleteTrainerSchedule);
router.get('/available-trainers', authenticateToken, requireRole('admin'), getAvailableTrainers);
router.get('/group-sessions-list', authenticateToken, requireRole('admin'), getGroupSessionsList);
router.get('/profile', authenticateToken, requireRole('admin'), getProfile);
router.put('/profile', authenticateToken, requireRole('admin'), updateProfile);
router.get('/reports', authenticateToken, requireRole('admin'), getReportsStats);

module.exports = router;

