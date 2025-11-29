const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const {
    getAllTrainers,
    createTrainer,
    updateTrainer,
    deleteTrainer,
    getTrainerGroupSessions,
    getTrainerSchedule
} = require('../controllers/trainerController');

router.get('/', authenticateToken, requireRole('admin'), getAllTrainers);
router.post('/', authenticateToken, requireRole('admin'), createTrainer);
router.put('/:id', authenticateToken, requireRole('admin'), updateTrainer);
router.delete('/:id', authenticateToken, requireRole('admin'), deleteTrainer);

router.get('/group-sessions', authenticateToken, requireRole('trainer'), getTrainerGroupSessions);
router.get('/schedule', authenticateToken, requireRole('trainer'), getTrainerSchedule);

module.exports = router;

