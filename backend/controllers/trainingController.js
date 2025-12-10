const PersonalBooking = require('../models/PersonalBooking');
const Trainer = require('../models/Trainer');
const UserSubscription = require('../models/UserSubscription');
const { getNextDateForDayOfWeek } = require('../utils/helpers');

const getMyTrainings = async (req, res) => {
    try {
        const userId = req.user.userId;
        const bookings = await PersonalBooking.getByUserId(userId);
        
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

const smartSearchTrainer = async (req, res) => {
    try {
        const { rating, experience } = req.body;
        
        let trainers = await Trainer.getActive();
        
        if (rating) {
            const minRating = parseFloat(rating);
            trainers = trainers.filter(t => t.rating && t.rating >= minRating);
        }
        
        if (experience) {
            trainers = trainers.filter(t => {
                if (!t.experience) return false;
                if (experience === '1-3') {
                    return t.experience.includes('1-3');
                } else if (experience === '3-5') {
                    return t.experience.includes('3-5');
                } else if (experience === '5+') {
                    return t.experience.includes('5+') || t.experience.includes('Более');
                }
                return true;
            });
        }
        
        trainers.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        
        res.json({
            success: true,
            trainers: trainers
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера: ' + error.message
        });
    }
};

const bookTraining = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { trainer_id, booking_date, booking_time, day_of_week, payment_method, subscription_id } = req.body;

        if (trainer_id) {
            if (!booking_date) {
                return res.status(400).json({
                    success: false,
                    error: 'Укажите дату тренировки'
                });
            }
            if (!booking_time) {
                return res.status(400).json({
                    success: false,
                    error: 'Укажите время тренировки'
                });
            }
            if (!day_of_week) {
                return res.status(400).json({
                    success: false,
                    error: 'Укажите день недели'
                });
            }
        } else {
            if (!booking_date || !booking_time) {
                return res.status(400).json({
                    success: false,
                    error: 'Укажите дату и время тренировки'
                });
            }
        }

        if (payment_method === 'subscription') {
            if (!subscription_id) {
                return res.status(400).json({
                    success: false,
                    error: 'Не указан абонемент'
                });
            }

            const activeSubscriptions = await UserSubscription.getAllActiveByUserId(userId);
            const subscription = activeSubscriptions.find(sub => 
                sub.id === parseInt(subscription_id) && 
                (sub.subscription_type === 'gym' || sub.subscription_type === 'combo') &&
                sub.remaining_visits > 0
            );

            if (!subscription) {
                return res.status(400).json({
                    success: false,
                    error: 'Абонемент не найден, неактивен или закончились посещения'
                });
            }
        }

        const { inventory_id } = req.body;
        
        const bookingData = {
            user_id: userId,
            trainer_id: trainer_id || null,
            booking_date: booking_date,
            booking_time: booking_time,
            payment_method: payment_method || 'qr_code',
            subscription_id: subscription_id || null,
            inventory_id: (inventory_id !== null && inventory_id !== undefined && inventory_id !== '') 
                ? parseInt(inventory_id) 
                : null
        };
        
        if (day_of_week) {
            bookingData.day_of_week = day_of_week;
        }
        
        const bookingId = await PersonalBooking.create(bookingData);

        res.json({
            success: true,
            bookingId: bookingId,
            message: 'Вы успешно записались на тренировку!'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message || 'Ошибка сервера',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

const cancelTraining = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { booking_id } = req.body;

        if (!booking_id) {
            return res.status(400).json({
                success: false,
                error: 'Не указана запись для отмены'
            });
        }

        await PersonalBooking.cancel(booking_id, userId);

        res.json({
            success: true,
            message: 'Запись успешно отменена'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message || 'Ошибка сервера'
        });
    }
};

module.exports = {
    getMyTrainings,
    smartSearchTrainer,
    bookTraining,
    cancelTraining
};

