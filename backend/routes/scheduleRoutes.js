const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const {
    getTrainerSchedule,
    createTrainerSchedule,
    updateTrainerSchedule,
    deleteTrainerSchedule,
    getAvailableTrainers
} = require('../controllers/scheduleController');

router.get('/trainer-schedule', authenticateToken, requireRole('admin'), getTrainerSchedule);
router.post('/trainer-schedule', authenticateToken, requireRole('admin'), createTrainerSchedule);
router.put('/trainer-schedule/:id', authenticateToken, requireRole('admin'), updateTrainerSchedule);
router.delete('/trainer-schedule/:id', authenticateToken, requireRole('admin'), deleteTrainerSchedule);
router.get('/available-trainers', authenticateToken, requireRole('admin'), getAvailableTrainers);

module.exports = router;

