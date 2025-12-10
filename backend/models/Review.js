const { pool } = require('../config/database');

class Review {
    static async getByTrainerId(trainerId) {
        const [reviews] = await pool.execute(`
            SELECT 
                r.*,
                u.name as user_name
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            WHERE r.trainer_id = ?
            ORDER BY r.id DESC
        `, [trainerId]);
        
        return reviews;
    }

    static async getByUserAndTrainer(userId, trainerId) {
        const [reviews] = await pool.execute(
            'SELECT * FROM reviews WHERE user_id = ? AND trainer_id = ?',
            [userId, trainerId]
        );
        
        return reviews[0] || null;
    }

    static async hasBookingWithTrainer(userId, trainerId) {
        const [personalBookings] = await pool.execute(
            `SELECT id FROM personal_bookings 
             WHERE user_id = ? AND trainer_id = ? 
             AND status IN ('completed', 'confirmed', 'pending')
             LIMIT 1`,
            [userId, trainerId]
        );
        
        if (personalBookings.length > 0) {
            return true;
        }
        
        const [groupBookings] = await pool.execute(
            `SELECT b.id 
             FROM bookings b
             JOIN group_sessions gs ON b.session_id = gs.id
             WHERE b.user_id = ? AND gs.trainer_id = ?
             LIMIT 1`,
            [userId, trainerId]
        );
        
        return groupBookings.length > 0;
    }

    static async create(reviewData) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const { user_id, trainer_id, rating, comment } = reviewData;

            const existingReview = await this.getByUserAndTrainer(user_id, trainer_id);
            if (existingReview) {
                throw new Error('Вы уже оставили отзыв этому тренеру');
            }

            const [result] = await connection.execute(
                `INSERT INTO reviews (user_id, trainer_id, rating, comment) 
                 VALUES (?, ?, ?, ?)`,
                [user_id, trainer_id, rating, comment || null]
            );

            await this.updateTrainerRating(trainer_id, connection);

            await connection.commit();
            return result.insertId;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async updateTrainerRating(trainerId, connection = null) {
        const conn = connection || pool;
        
        const [reviews] = await conn.execute(
            'SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM reviews WHERE trainer_id = ?',
            [trainerId]
        );

        if (reviews.length > 0 && reviews[0].count > 0) {
            const avgRating = parseFloat(reviews[0].avg_rating).toFixed(1);
            await conn.execute(
                'UPDATE trainers SET rating = ? WHERE id = ?',
                [avgRating, trainerId]
            );
        }
    }

    static async update(reviewId, userId, reviewData) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const { rating, comment } = reviewData;

            const [reviews] = await connection.execute(
                'SELECT trainer_id FROM reviews WHERE id = ? AND user_id = ?',
                [reviewId, userId]
            );

            if (reviews.length === 0) {
                throw new Error('Отзыв не найден');
            }

            const trainerId = reviews[0].trainer_id;

            await connection.execute(
                `UPDATE reviews 
                 SET rating = ?, comment = ? 
                 WHERE id = ? AND user_id = ?`,
                [rating, comment || null, reviewId, userId]
            );

            await this.updateTrainerRating(trainerId, connection);

            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async delete(reviewId, userId) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const [reviews] = await connection.execute(
                'SELECT trainer_id FROM reviews WHERE id = ? AND user_id = ?',
                [reviewId, userId]
            );

            if (reviews.length === 0) {
                throw new Error('Отзыв не найден');
            }

            const trainerId = reviews[0].trainer_id;

            await connection.execute(
                'DELETE FROM reviews WHERE id = ? AND user_id = ?',
                [reviewId, userId]
            );

            await this.updateTrainerRating(trainerId, connection);

            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}

module.exports = Review;

