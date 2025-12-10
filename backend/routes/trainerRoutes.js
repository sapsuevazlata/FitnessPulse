const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const {
    getAllTrainers,
    createTrainer,
    updateTrainer,
    deleteTrainer,
    getTrainerGroupSessions,
    getTrainerSchedule,
    getTrainerProfile,
    updateTrainerProfile,
    getTrainerStats,
    getTrainerClients
} = require('../controllers/trainerController');

router.get('/group-sessions', authenticateToken, requireRole('trainer'), getTrainerGroupSessions);
router.get('/schedule', authenticateToken, requireRole('trainer'), getTrainerSchedule);
router.get('/profile', authenticateToken, requireRole('trainer'), getTrainerProfile);
router.put('/profile', authenticateToken, requireRole('trainer'), updateTrainerProfile);
router.get('/stats', authenticateToken, requireRole('trainer'), getTrainerStats);
router.get('/clients', authenticateToken, requireRole('trainer'), getTrainerClients);

router.get('/', authenticateToken, requireRole('admin'), getAllTrainers);
router.post('/', authenticateToken, requireRole('admin'), createTrainer);
router.put('/:id', authenticateToken, requireRole('admin'), updateTrainer);
router.delete('/:id', authenticateToken, requireRole('admin'), deleteTrainer);

module.exports = router;

