const { pool } = require('../config/database');

class PersonalBooking {
    // Получить все записи пользователя
    static async getByUserId(userId) {
        const [bookings] = await pool.execute(`
            SELECT 
                pb.*,
                t.id as trainer_id,
                u.name as trainer_name,
                t.specialization as trainer_specialization,
                t.rating as trainer_rating
            FROM personal_bookings pb
            LEFT JOIN trainers t ON pb.trainer_id = t.id
            LEFT JOIN users u ON t.user_id = u.id
            WHERE pb.user_id = ?
            ORDER BY pb.booking_date DESC, pb.booking_time DESC
        `, [userId]);
        
        return bookings;
    }

    // Получить активные записи пользователя (будущие)
    static async getActiveByUserId(userId) {
        const today = new Date().toISOString().split('T')[0];
        const [bookings] = await pool.execute(`
            SELECT 
                pb.*,
                t.id as trainer_id,
                u.name as trainer_name,
                t.specialization as trainer_specialization,
                t.rating as trainer_rating
            FROM personal_bookings pb
            LEFT JOIN trainers t ON pb.trainer_id = t.id
            LEFT JOIN users u ON t.user_id = u.id
            WHERE pb.user_id = ?
            AND (pb.booking_date > ? OR (pb.booking_date = ? AND pb.booking_time >= TIME(NOW())))
            AND pb.status IN ('pending', 'confirmed')
            ORDER BY pb.booking_date ASC, pb.booking_time ASC
        `, [userId, today, today]);
        
        return bookings;
    }

    // Создать запись на тренировку
    static async create(bookingData) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const { user_id, trainer_id, booking_date, booking_time, day_of_week, payment_method, subscription_id, equipment } = bookingData;

            // Если указан тренер, проверяем доступность времени
            if (trainer_id) {
                // Проверяем, что тренер существует
                const [trainers] = await connection.execute(
                    'SELECT id FROM trainers WHERE id = ?',
                    [trainer_id]
                );

                if (trainers.length === 0) {
                    throw new Error('Тренер не найден');
                }

                // Проверяем расписание тренера
                // Используем переданный day_of_week, если он есть, иначе вычисляем из даты
                let dayOfWeek = day_of_week || this.getDayOfWeek(booking_date);
                
                // Нормализуем день недели (всегда lowercase)
                if (dayOfWeek) {
                    dayOfWeek = dayOfWeek.toLowerCase().trim();
                }
                
                // Нормализуем время: если формат HH:MM, добавляем :00
                let normalizedTime = booking_time;
                if (normalizedTime && normalizedTime.length === 5) {
                    normalizedTime = normalizedTime + ':00';
                }
                
                // Сначала проверяем, есть ли вообще расписание у тренера
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
                
                // Получаем все слоты для этого дня недели (проверяем с учетом регистра)
                const [allSchedule] = await connection.execute(
                    `SELECT id, start_time, end_time, day_of_week FROM trainer_schedule 
                     WHERE trainer_id = ? AND LOWER(day_of_week) = LOWER(?)
                     ORDER BY start_time`,
                    [trainer_id, dayOfWeek]
                );
                
                if (allSchedule.length === 0) {
                    // Показываем доступные дни недели
                    const availableDays = [...new Set(allTrainerSchedule.map(s => s.day_of_week))];
                    throw new Error(`Тренер не работает в ${dayOfWeek}. Доступные дни: ${availableDays.join(', ')}`);
                }
                
                // Проверяем, есть ли слот, у которого start_time совпадает с выбранным временем
                // Сравниваем только HH:MM (первые 5 символов), игнорируя секунды
                // Используем простой способ - получаем все слоты и сравниваем в JavaScript
                const timeHHMM = normalizedTime ? normalizedTime.substring(0, 5) : booking_time.substring(0, 5);
                
                // Ищем слот, у которого start_time совпадает с выбранным временем (только HH:MM)
                const matchingSlot = allSchedule.find(s => {
                    const slotStart = s.start_time.substring(0, 5);
                    return slotStart === timeHHMM;
                });
                
                const schedule = matchingSlot ? [matchingSlot] : [];

                if (schedule.length === 0) {
                    // Попробуем найти слот вручную, сравнивая только HH:MM
                    const timeHHMM = normalizedTime ? normalizedTime.substring(0, 5) : booking_time.substring(0, 5);
                    const matchingSlot = allSchedule.find(s => {
                        const slotStart = s.start_time.substring(0, 5);
                        return slotStart === timeHHMM;
                    });
                    
                    if (matchingSlot) {
                        // Используем найденный слот
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

                // Проверяем, нет ли уже записи на это время
                // Нормализуем время для сравнения
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

            // Если оплата абонементом, проверяем и уменьшаем количество посещений
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

                // Уменьшаем количество посещений
                await connection.execute(
                    `UPDATE user_subscriptions 
                     SET remaining_visits = remaining_visits - 1 
                     WHERE id = ? AND user_id = ?`,
                    [subscription_id, user_id]
                );
            }

            // Нормализуем время перед вставкой в БД
            let finalBookingTime = booking_time;
            if (finalBookingTime && finalBookingTime.length === 5) {
                finalBookingTime = finalBookingTime + ':00';
            }
            
            // Создаем запись со статусом confirmed (подтверждена сразу)
            // Проверяем, существует ли поле equipment в таблице
            // Если equipment передано, пытаемся добавить его, но не падаем, если поля нет
            try {
                // Базовые поля
                const baseFields = ['user_id', 'trainer_id', 'booking_date', 'booking_time', 'payment_method', 'subscription_id', 'status'];
                const baseValues = [user_id, trainer_id, booking_date, finalBookingTime, payment_method, subscription_id || null, 'confirmed'];
                
                // Добавляем equipment, если указано
                if (equipment) {
                    baseFields.push('equipment');
                    baseValues.push(equipment);
                }
                
                const placeholders = baseFields.map(() => '?').join(', ');
                const fieldsList = baseFields.join(', ');
                
                const insertQuery = `INSERT INTO personal_bookings (${fieldsList}) VALUES (${placeholders})`;
                
                const [result] = await connection.execute(insertQuery, baseValues);
                await connection.commit();
                return result.insertId;
            } catch (insertError) {
                // Если ошибка связана с полем equipment (поле не существует), пробуем без него
                if (equipment && insertError.message && (
                    insertError.message.includes('equipment') || 
                    insertError.message.includes('Unknown column') ||
                    insertError.code === 'ER_BAD_FIELD_ERROR'
                )) {
                    const [result] = await connection.execute(
                        `INSERT INTO personal_bookings 
                         (user_id, trainer_id, booking_date, booking_time, payment_method, subscription_id, status) 
                         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [user_id, trainer_id, booking_date, finalBookingTime, payment_method, subscription_id || null, 'confirmed']
                    );
                    await connection.commit();
                    return result.insertId;
                }
                throw insertError;
            }
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // Отменить запись
    static async cancel(bookingId, userId) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Получаем информацию о записи
            const [bookings] = await connection.execute(
                `SELECT * FROM personal_bookings 
                 WHERE id = ? AND user_id = ?`,
                [bookingId, userId]
            );

            if (bookings.length === 0) {
                throw new Error('Запись не найдена');
            }

            const booking = bookings[0];

            // Если оплата была абонементом, возвращаем посещение
            if (booking.payment_method === 'subscription' && booking.subscription_id) {
                await connection.execute(
                    `UPDATE user_subscriptions 
                     SET remaining_visits = remaining_visits + 1 
                     WHERE id = ? AND user_id = ?`,
                    [booking.subscription_id, userId]
                );
            }

            // Обновляем статус записи
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

    // Получить день недели из даты
    static getDayOfWeek(dateString) {
        // Преобразуем дату в формат YYYY-MM-DD и создаем объект Date
        // Важно: dateString может быть в формате YYYY-MM-DD
        const date = new Date(dateString + 'T00:00:00');
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayName = days[date.getDay()];
        // Преобразуем в формат, используемый в БД (lowercase)
        return dayName.toLowerCase();
    }

    // Получить все записи к тренеру (индивидуальные тренировки)
    static async getByTrainerId(trainerId) {
        const [bookings] = await pool.execute(`
            SELECT 
                pb.*,
                u.id as user_id,
                u.name as client_name,
                u.email as client_email,
                u.phone as client_phone
            FROM personal_bookings pb
            LEFT JOIN users u ON pb.user_id = u.id
            WHERE pb.trainer_id = ?
            ORDER BY pb.booking_date DESC, pb.booking_time DESC
        `, [trainerId]);
        
        return bookings;
    }
}

module.exports = PersonalBooking;

