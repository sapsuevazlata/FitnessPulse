const Booking = require('../models/Booking');
const UserSubscription = require('../models/UserSubscription');
const GroupSession = require('../models/GroupSession');

const getMyBookings = async (req, res) => {
    try {
        const userId = req.user.userId;
        const bookings = await Booking.getByUserId(userId);
        
        res.json({
            success: true,
            bookings: bookings
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера: ' + error.message
        });
    }
};

const bookGroupSession = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { session_id } = req.body;

        if (!session_id) {
            return res.status(400).json({
                success: false,
                error: 'Не указано занятие'
            });
        }

        const activeSubscriptions = await UserSubscription.getAllActiveByUserId(userId);
        
        let validSubscription = null;
        for (const sub of activeSubscriptions) {
            if ((sub.subscription_type === 'group' || sub.subscription_type === 'combo') && 
                sub.remaining_visits > 0) {
                validSubscription = sub;
                break;
            }
        }

        if (!validSubscription) {
            return res.status(400).json({
                success: false,
                error: 'Для записи на групповое занятие необходим абонемент типа "Групповые" или "Все включено" с оставшимися посещениями'
            });
        }

        const session = await GroupSession.findById(session_id);
        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Занятие не найдено'
            });
        }

        const bookingId = await Booking.create(userId, session_id, validSubscription.id);

        res.json({
            success: true,
            message: 'Вы успешно записаны на занятие',
            bookingId: bookingId,
            remainingVisits: validSubscription.remaining_visits - 1
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера: ' + error.message
        });
    }
};

const cancelBooking = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { booking_id } = req.body;

        if (!booking_id) {
            return res.status(400).json({
                success: false,
                error: 'Не указана запись для отмены'
            });
        }

        await Booking.cancel(booking_id, userId);

        res.json({
            success: true,
            message: 'Запись отменена'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера: ' + error.message
        });
    }
};

module.exports = {
    getMyBookings,
    bookGroupSession,
    cancelBooking
};

