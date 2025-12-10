const { pool } = require('../config/database');
const User = require('../models/User');
const Stats = require('../models/Stats');

const getUsers = async (req, res) => {
    try {
        const users = await User.getAll();
        res.json({ success: true, users });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Ошибка сервера' });
    }
};

const deleteUser = async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        const userId = req.params.id;

        const [users] = await connection.execute('SELECT * FROM users WHERE id = ?', [userId]);
        
        if (users.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, error: 'Пользователь не найден' });
        }

        await connection.execute('DELETE FROM bookings WHERE user_id = ?', [userId]);
        await connection.execute('DELETE FROM personal_bookings WHERE user_id = ?', [userId]);
        await connection.execute('DELETE FROM reviews WHERE user_id = ?', [userId]);
        await connection.execute('DELETE FROM user_subscriptions WHERE user_id = ?', [userId]);

        try {
            const [scheduleResult] = await connection.execute('DELETE FROM trainer_schedule WHERE trainer_id IN (SELECT id FROM trainers WHERE user_id = ?)', [userId]);
        } catch (scheduleError) {
        }

        try {
            const [trainerRecords] = await connection.execute('SELECT id FROM trainers WHERE user_id = ?', [userId]);
            if (trainerRecords.length > 0) {
                const trainerId = trainerRecords[0].id;
                
                await connection.execute('DELETE FROM trainer_schedule WHERE trainer_id = ?', [trainerId]);
                await connection.execute('DELETE FROM group_sessions WHERE trainer_id = ?', [trainerId]);
                await connection.execute('DELETE FROM trainers WHERE id = ?', [trainerId]);
            }
        } catch (trainerError) {
        }

        const [userResult] = await connection.execute('DELETE FROM users WHERE id = ?', [userId]);

        await connection.commit();

        if (userResult.affectedRows > 0) {
            res.json({ 
                success: true, 
                message: 'Пользователь успешно удален' 
            });
        } else {
            res.status(500).json({ 
                success: false, 
                error: 'Не удалось удалить пользователя' 
            });
        }

    } catch (error) {
        await connection.rollback();
        
        res.status(500).json({ 
            success: false, 
            error: `Ошибка сервера: ${error.message}`
        });
    } finally {
        connection.release();
    }
};

const getStats = async (req, res) => {
    try {
        const stats = await Stats.getAdminStats();
        res.json({
            success: true,
            stats: stats
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Ошибка сервера: ' + error.message });
    }
};

const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        
        if (!user) {
            return res.status(404).json({ success: false, error: 'Пользователь не найден' });
        }

        res.json({ success: true, user: user });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Ошибка сервера' });
    }
};

const updateProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { name, email, phone, password } = req.body;

        if (email) {
            const emailExists = await User.checkEmailExists(email, userId);
            
            if (emailExists) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Пользователь с таким email уже существует' 
                });
            }
        }

        const updated = await User.update(userId, { name, email, phone, password });

        if (!updated) {
            return res.status(404).json({ success: false, error: 'Пользователь не найден' });
        }

        const user = await User.findById(userId);

        res.json({ 
            success: true, 
            message: 'Профиль успешно обновлен',
            user: user
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Ошибка сервера' });
    }
};

const getReportsStats = async (req, res) => {
    try {
        const [subscriptionsStats] = await pool.execute(`
            SELECT 
                DATE_FORMAT(purchase_date, '%Y-%m') as month,
                COUNT(*) as count
            FROM user_subscriptions
            WHERE purchase_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
            GROUP BY DATE_FORMAT(purchase_date, '%Y-%m')
            ORDER BY month ASC
        `);

        const [bookingsStats] = await pool.execute(`
            SELECT 
                DATE_FORMAT(booking_date, '%Y-%m') as month,
                COUNT(*) as count
            FROM bookings
            WHERE booking_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
            GROUP BY DATE_FORMAT(booking_date, '%Y-%m')
            ORDER BY month ASC
        `);

        const [personalBookingsStats] = await pool.execute(`
            SELECT 
                DATE_FORMAT(booking_date, '%Y-%m') as month,
                COUNT(*) as count
            FROM personal_bookings
            WHERE booking_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
            GROUP BY DATE_FORMAT(booking_date, '%Y-%m')
            ORDER BY month ASC
        `);

        res.json({
            success: true,
            subscriptions: subscriptionsStats,
            bookings: bookingsStats,
            personalBookings: personalBookingsStats
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Ошибка сервера: ' + error.message });
    }
};

module.exports = {
    getUsers,
    deleteUser,
    getStats,
    getProfile,
    updateProfile,
    getReportsStats
};
