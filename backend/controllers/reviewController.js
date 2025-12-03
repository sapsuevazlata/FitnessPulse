const Review = require('../models/Review');

// Получить отзывы тренера
const getTrainerReviews = async (req, res) => {
    try {
        const { trainerId } = req.params;
        
        const reviews = await Review.getByTrainerId(trainerId);

        // Считаем количество и средний рейтинг
        let count = reviews.length;
        let avgRating = null;
        if (count > 0) {
            const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
            avgRating = (sum / count).toFixed(1);
        }
        
        res.json({
            success: true,
            reviews: reviews,
            count,
            avgRating
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера: ' + error.message
        });
    }
};

// Проверить, может ли пользователь оставить отзыв
const canLeaveReview = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { trainerId } = req.params;
        
        // Проверяем, есть ли запись к тренеру
        const hasBooking = await Review.hasBookingWithTrainer(userId, parseInt(trainerId));
        
        // Проверяем, есть ли уже отзыв
        const existingReview = await Review.getByUserAndTrainer(userId, parseInt(trainerId));
        
        res.json({
            success: true,
            canLeaveReview: hasBooking && !existingReview,
            hasBooking: hasBooking,
            hasReview: !!existingReview
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера: ' + error.message
        });
    }
};

// Создать отзыв
const createReview = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { trainer_id, rating, comment } = req.body;

        if (!trainer_id || !rating) {
            return res.status(400).json({
                success: false,
                error: 'Укажите тренера и оценку'
            });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                error: 'Оценка должна быть от 1 до 5'
            });
        }

        // Проверяем, есть ли запись к тренеру (любой статус, так как подтверждения нет)
        const hasBooking = await Review.hasBookingWithTrainer(userId, trainer_id);
        if (!hasBooking) {
            return res.status(403).json({
                success: false,
                error: 'Вы можете оставить отзыв только тренеру, у которого была запись на персональную или групповую тренировку'
            });
        }

        // Проверяем, нет ли уже отзыва
        const existingReview = await Review.getByUserAndTrainer(userId, trainer_id);
        if (existingReview) {
            return res.status(400).json({
                success: false,
                error: 'Вы уже оставили отзыв этому тренеру'
            });
        }

        // Создаем отзыв
        const reviewId = await Review.create({
            user_id: userId,
            trainer_id: trainer_id,
            rating: rating,
            comment: comment || null
        });

        res.json({
            success: true,
            reviewId: reviewId,
            message: 'Отзыв успешно добавлен'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message || 'Ошибка сервера'
        });
    }
};

// Обновить отзыв
const updateReview = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { review_id, rating, comment } = req.body;

        if (!review_id || !rating) {
            return res.status(400).json({
                success: false,
                error: 'Укажите отзыв и оценку'
            });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                error: 'Оценка должна быть от 1 до 5'
            });
        }

        await Review.update(review_id, userId, { rating, comment });

        res.json({
            success: true,
            message: 'Отзыв успешно обновлен'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message || 'Ошибка сервера'
        });
    }
};

// Удалить отзыв
const deleteReview = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { review_id } = req.body;

        if (!review_id) {
            return res.status(400).json({
                success: false,
                error: 'Не указан отзыв для удаления'
            });
        }

        await Review.delete(review_id, userId);

        res.json({
            success: true,
            message: 'Отзыв успешно удален'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message || 'Ошибка сервера'
        });
    }
};

module.exports = {
    getTrainerReviews,
    canLeaveReview,
    createReview,
    updateReview,
    deleteReview
};

