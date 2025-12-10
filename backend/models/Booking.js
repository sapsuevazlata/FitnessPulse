const { pool } = require('../config/database');

class Booking {
    static async getByUserId(userId) {
        const [bookings] = await pool.execute(`
            SELECT 
                b.*,
                gs.name as session_name,
                gs.description as session_description,
                gs.days as session_days,
                gs.time as session_time,
                gs.duration as session_duration,
                u.name as trainer_name
            FROM bookings b
            JOIN group_sessions gs ON b.session_id = gs.id
            LEFT JOIN trainers t ON gs.trainer_id = t.id
            LEFT JOIN users u ON t.user_id = u.id
            WHERE b.user_id = ?
            ORDER BY b.booking_date DESC, gs.time ASC
        `, [userId]);
        
        return bookings;
    }

    static async create(userId, sessionId, subscriptionId) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const [sessions] = await connection.execute(
                `SELECT gs.*, 
                 (SELECT COUNT(*) FROM bookings WHERE session_id = gs.id) as current_bookings
                 FROM group_sessions gs 
                 WHERE gs.id = ?`,
                [sessionId]
            );

            if (sessions.length === 0) {
                throw new Error('Занятие не найдено');
            }

            const session = sessions[0];
            if (session.current_bookings >= session.max_participants) {
                throw new Error('Нет свободных мест на это занятие');
            }

            const [existingBookings] = await connection.execute(
                'SELECT id FROM bookings WHERE user_id = ? AND session_id = ?',
                [userId, sessionId]
            );

            if (existingBookings.length > 0) {
                throw new Error('Вы уже записаны на это занятие');
            }

            if (subscriptionId) {
                const [updateResult] = await connection.execute(
                    `UPDATE user_subscriptions 
                     SET remaining_visits = remaining_visits - 1 
                     WHERE id = ? AND user_id = ? AND remaining_visits > 0`,
                    [subscriptionId, userId]
                );

                if (updateResult.affectedRows === 0) {
                    throw new Error('Не удалось использовать посещение из абонемента');
                }
            }

            const [result] = await connection.execute(
                `INSERT INTO bookings (user_id, session_id, subscription_id, booking_date) 
                 VALUES (?, ?, ?, NOW())`,
                [userId, sessionId, subscriptionId || null]
            );

            await connection.execute(
                `UPDATE group_sessions 
                 SET current_participants = current_participants + 1 
                 WHERE id = ?`,
                [sessionId]
            );

            await connection.commit();
            return result.insertId;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async cancel(bookingId, userId) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const [bookings] = await connection.execute(
                `SELECT b.*, gs.id as session_id 
                 FROM bookings b
                 JOIN group_sessions gs ON b.session_id = gs.id
                 WHERE b.id = ? AND b.user_id = ?`,
                [bookingId, userId]
            );

            if (bookings.length === 0) {
                throw new Error('Запись не найдена');
            }

            const booking = bookings[0];

            if (booking.subscription_id) {
                await connection.execute(
                    `UPDATE user_subscriptions 
                     SET remaining_visits = remaining_visits + 1 
                     WHERE id = ? AND user_id = ?`,
                    [booking.subscription_id, userId]
                );
            }

            await connection.execute(
                `UPDATE group_sessions 
                 SET current_participants = GREATEST(0, current_participants - 1) 
                 WHERE id = ?`,
                [booking.session_id]
            );

            await connection.execute(
                'DELETE FROM bookings WHERE id = ? AND user_id = ?',
                [bookingId, userId]
            );

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

module.exports = Booking;

