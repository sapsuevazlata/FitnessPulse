const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const {
    getMyTrainings,
    smartSearchTrainer,
    bookTraining,
    cancelTraining
} = require('../controllers/trainingController');

router.get('/my', authenticateToken, requireRole('client'), getMyTrainings);

router.post('/smart-search', authenticateToken, requireRole('client'), smartSearchTrainer);

router.post('/book', authenticateToken, requireRole('client'), bookTraining);

router.post('/cancel', authenticateToken, requireRole('client'), cancelTraining);

module.exports = router;

