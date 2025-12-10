const { pool } = require('../config/database');

class PersonalBooking {
    static async getByUserId(userId) {
        const [bookings] = await pool.execute(`
            SELECT 
                pb.*,
                t.id as trainer_id,
                u.name as trainer_name,
                t.specialization as trainer_specialization,
                t.rating as trainer_rating,
                i.id as inventory_id,
                i.name as inventory_name
            FROM personal_bookings pb
            LEFT JOIN trainers t ON pb.trainer_id = t.id
            LEFT JOIN users u ON t.user_id = u.id
            LEFT JOIN inventory i ON pb.inventory_id = i.id
            WHERE pb.user_id = ?
            ORDER BY pb.booking_date DESC, pb.booking_time DESC
        `, [userId]);
        
        return bookings;
    }

    static async getActiveByUserId(userId) {
        const today = new Date().toISOString().split('T')[0];
        const [bookings] = await pool.execute(`
            SELECT 
                pb.*,
                t.id as trainer_id,
                u.name as trainer_name,
                t.specialization as trainer_specialization,
                t.rating as trainer_rating,
                i.id as inventory_id,
                i.name as inventory_name
            FROM personal_bookings pb
            LEFT JOIN trainers t ON pb.trainer_id = t.id
            LEFT JOIN users u ON t.user_id = u.id
            LEFT JOIN inventory i ON pb.inventory_id = i.id
            WHERE pb.user_id = ?
            AND (pb.booking_date > ? OR (pb.booking_date = ? AND pb.booking_time >= TIME(NOW())))
            AND pb.status IN ('pending', 'confirmed')
            ORDER BY pb.booking_date ASC, pb.booking_time ASC
        `, [userId, today, today]);
        
        return bookings;
    }

    static async create(bookingData) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const { user_id, trainer_id, booking_date, booking_time, day_of_week, payment_method, subscription_id, inventory_id } = bookingData;
            
            // Преобразуем inventory_id в число, если он передан (проверяем на null и undefined)
            const inventoryId = (inventory_id !== null && inventory_id !== undefined && inventory_id !== '') 
                ? parseInt(inventory_id) 
                : null;

            if (trainer_id) {
                const [trainers] = await connection.execute(
                    'SELECT id FROM trainers WHERE id = ?',
                    [trainer_id]
                );

                if (trainers.length === 0) {
                    throw new Error('Тренер не найден');
                }

                let dayOfWeek = day_of_week || this.getDayOfWeek(booking_date);
                
                if (dayOfWeek) {
                    dayOfWeek = dayOfWeek.toLowerCase().trim();
                }
                
                let normalizedTime = booking_time;
                if (normalizedTime && normalizedTime.length === 5) {
                    normalizedTime = normalizedTime + ':00';
                }
                
                const [allTrainerSchedule] = await connection.execute(
                    `SELECT id, day_of_week, start_time, end_time, slot_type 
                     FROM trainer_schedule 
                     WHERE trainer_id = ?
                     ORDER BY day_of_week, start_time`,
                    [trainer_id]
                );
                
                if (allTrainerSchedule.length === 0) {
                    throw new Error('У тренера нет расписания. Обратитесь к администратору.');
                }
                
                const [allSchedule] = await connection.execute(
                    `SELECT id, start_time, end_time, day_of_week FROM trainer_schedule 
                     WHERE trainer_id = ? AND LOWER(day_of_week) = LOWER(?)
                     ORDER BY start_time`,
                    [trainer_id, dayOfWeek]
                );
                
                if (allSchedule.length === 0) {
                    
                    const availableDays = [...new Set(allTrainerSchedule.map(s => s.day_of_week))];
                    throw new Error(`Тренер не работает в ${dayOfWeek}. Доступные дни: ${availableDays.join(', ')}`);
                }
                
                const timeHHMM = normalizedTime ? normalizedTime.substring(0, 5) : booking_time.substring(0, 5);
                
                const matchingSlot = allSchedule.find(s => {
                    const slotStart = s.start_time.substring(0, 5);
                    return slotStart === timeHHMM;
                });
                
                const schedule = matchingSlot ? [matchingSlot] : [];

                if (schedule.length === 0) {
                    const timeHHMM = normalizedTime ? normalizedTime.substring(0, 5) : booking_time.substring(0, 5);
                    const matchingSlot = allSchedule.find(s => {
                        const slotStart = s.start_time.substring(0, 5);
                        return slotStart === timeHHMM;
                    });
                    
                    if (matchingSlot) {
                        schedule = [matchingSlot];
                    } else {
                        const availableTimes = allSchedule.map(s => {
                            const start = s.start_time.substring(0, 5);
                            const end = s.end_time.substring(0, 5);
                            return `${start}-${end}`;
                        }).join(', ');
                        throw new Error(`Тренер не работает в это время (${booking_time}). Доступное время: ${availableTimes}`);
                    }
                }

                const [existingBookings] = await connection.execute(
                    `SELECT id FROM personal_bookings 
                     WHERE trainer_id = ? 
                     AND booking_date = ? 
                     AND TIME(booking_time) = TIME(?) 
                     AND status IN ('pending', 'confirmed')`,
                    [trainer_id, booking_date, normalizedTime]
                );

                if (existingBookings.length > 0) {
                    throw new Error('Это время уже занято');
                }
            }

            if (payment_method === 'subscription' && subscription_id) {
                const [subscriptions] = await connection.execute(
                    `SELECT id, remaining_visits, status 
                     FROM user_subscriptions 
                     WHERE id = ? AND user_id = ?`,
                    [subscription_id, user_id]
                );

                if (subscriptions.length === 0) {
                    throw new Error('Абонемент не найден');
                }

                const subscription = subscriptions[0];
                if (subscription.status !== 'active' || subscription.remaining_visits <= 0) {
                    throw new Error('Абонемент неактивен или закончились посещения');
                }

                await connection.execute(
                    `UPDATE user_subscriptions 
                     SET remaining_visits = remaining_visits - 1 
                     WHERE id = ? AND user_id = ?`,
                    [subscription_id, user_id]
                );
            }

            let finalBookingTime = booking_time;
            if (finalBookingTime && finalBookingTime.length === 5) {
                finalBookingTime = finalBookingTime + ':00';
            }
            
            // Проверка существования инвентаря, если указан
            if (inventoryId) {
                const [inventoryItems] = await connection.execute(
                    'SELECT id FROM inventory WHERE id = ?',
                    [inventoryId]
                );
                
                if (inventoryItems.length === 0) {
                    throw new Error('Инвентарь не найден');
                }
            }
            
            const [result] = await connection.execute(
                `INSERT INTO personal_bookings 
                 (user_id, trainer_id, booking_date, booking_time, payment_method, subscription_id, inventory_id, status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [user_id, trainer_id, booking_date, finalBookingTime, payment_method, subscription_id || null, inventoryId, 'confirmed']
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
                `SELECT * FROM personal_bookings 
                 WHERE id = ? AND user_id = ?`,
                [bookingId, userId]
            );

            if (bookings.length === 0) {
                throw new Error('Запись не найдена');
            }

            const booking = bookings[0];

            if (booking.payment_method === 'subscription' && booking.subscription_id) {
                await connection.execute(
                    `UPDATE user_subscriptions 
                     SET remaining_visits = remaining_visits + 1 
                     WHERE id = ? AND user_id = ?`,
                    [booking.subscription_id, userId]
                );
            }

            await connection.execute(
                `UPDATE personal_bookings 
                 SET status = 'cancelled' 
                 WHERE id = ? AND user_id = ?`,
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

    static getDayOfWeek(dateString) {
        const date = new Date(dateString + 'T00:00:00');
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayName = days[date.getDay()];
        return dayName.toLowerCase();
    }

    static async getByTrainerId(trainerId) {
        const [bookings] = await pool.execute(`
            SELECT 
                pb.*,
                u.id as user_id,
                u.name as client_name,
                u.email as client_email,
                u.phone as client_phone,
                i.id as inventory_id,
                i.name as inventory_name
            FROM personal_bookings pb
            LEFT JOIN users u ON pb.user_id = u.id
            LEFT JOIN inventory i ON pb.inventory_id = i.id
            WHERE pb.trainer_id = ?
            ORDER BY pb.booking_date DESC, pb.booking_time DESC
        `, [trainerId]);
        
        return bookings;
    }
}

module.exports = PersonalBooking;

