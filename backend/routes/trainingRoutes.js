const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const {
    getMyTrainings,
    smartSearchTrainer,
    bookTraining,
    cancelTraining
} = require('../controllers/trainingController');

// Получить все записи клиента на тренировки
router.get('/my', authenticateToken, requireRole('client'), getMyTrainings);

// Умный подбор тренера
router.post('/smart-search', authenticateToken, requireRole('client'), smartSearchTrainer);

// Записаться на тренировку
router.post('/book', authenticateToken, requireRole('client'), bookTraining);

// Отменить запись на тренировку
router.post('/cancel', authenticateToken, requireRole('client'), cancelTraining);

module.exports = router;

