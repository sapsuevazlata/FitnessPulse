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

// Получить отзывы тренера (публичный доступ)
router.get('/trainer/:trainerId', getTrainerReviews);

// Проверить, может ли пользователь оставить отзыв (требует авторизации)
router.get('/can-leave/:trainerId', authenticateToken, requireRole('client'), canLeaveReview);

// Создать отзыв (только для клиентов)
router.post('/create', authenticateToken, requireRole('client'), createReview);

// Обновить отзыв (только для клиентов)
router.put('/update', authenticateToken, requireRole('client'), updateReview);

// Удалить отзыв (только для клиентов)
router.delete('/delete', authenticateToken, requireRole('client'), deleteReview);

module.exports = router;

