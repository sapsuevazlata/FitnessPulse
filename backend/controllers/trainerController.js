const User = require('../models/User');
const Trainer = require('../models/Trainer');
const GroupSession = require('../models/GroupSession');
const TrainerSchedule = require('../models/TrainerSchedule');
const { formatTimeSimply } = require('../utils/helpers');
const { pool } = require('../config/database');

const getAllTrainers = async (req, res) => {
    try {
        const trainers = await Trainer.getAll();
        res.json({ success: true, trainers });
        
    } catch (error) {
        res.status(500).json({ success: false, error: 'Ошибка сервера: ' + error.message });
    }
};

const createTrainer = async (req, res) => {
    try {
        const { name, email, password, phone, experience, specialization, bio } = req.body;
        
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, error: 'Обязательные поля: имя, email, пароль' });
        }

        const userId = await User.create({ name, email, password, phone, role: 'trainer' });
        const trainerId = await Trainer.create({ user_id: userId, experience, specialization, bio });

        res.json({ 
            success: true, 
            message: 'Тренер успешно создан',
            trainer: {
                id: trainerId,
                user_id: userId,
                name,
                email,
                phone,
                experience,
                specialization,
                bio
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Ошибка сервера: ' + error.message });
    }
};

const updateTrainer = async (req, res) => {
    try {
        const trainerId = req.params.id;
        const { name, email, phone, experience, specialization, bio, password } = req.body;

        const trainer = await Trainer.findById(trainerId);

        if (!trainer) {
            return res.status(404).json({ success: false, error: 'Тренер не найден' });
        }

        await User.update(trainer.user_id, { name, email, phone, password });
        await Trainer.update(trainerId, { experience, specialization, bio });

        res.json({ success: true, message: 'Тренер успешно обновлен' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Ошибка сервера' });
    }
};

const deleteTrainer = async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const trainerId = req.params.id;
        
        const [trainerData] = await connection.execute(
            'SELECT user_id FROM trainers WHERE id = ?',
            [trainerId]
        );

        if (trainerData.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, error: 'Тренер не найден' });
        }
        
        const userId = trainerData[0].user_id;

        const [futureBookings] = await connection.execute(`
            SELECT COUNT(*) as count 
            FROM personal_bookings 
            WHERE trainer_id = ? 
            AND booking_date >= CURDATE()
            AND status != 'cancelled'
        `, [trainerId]);

        if (futureBookings[0].count > 0) {
            await connection.rollback();
            return res.status(400).json({ 
                success: false, 
                error: 'Тренера нельзя удалить, пока у него есть будущие тренировки, которые еще не проведены' 
            });
        }

        const [activeSessions] = await connection.execute(`
            SELECT COUNT(*) as count 
            FROM group_sessions 
            WHERE trainer_id = ?
        `, [trainerId]);

        if (activeSessions[0].count > 0) {
            await connection.rollback();
            return res.status(400).json({ 
                success: false, 
                error: 'Тренера нельзя удалить, пока у него есть будущие тренировки, которые еще не проведены' 
            });
        }

        await connection.execute('DELETE FROM trainer_schedule WHERE trainer_id = ?', [trainerId]);
        await connection.execute('DELETE FROM reviews WHERE trainer_id = ?', [trainerId]);
        await connection.execute('DELETE FROM trainers WHERE id = ?', [trainerId]);
        await connection.execute('DELETE FROM users WHERE id = ?', [userId]);

        await connection.commit();
        res.json({ success: true, message: 'Тренер успешно удален' });
    } catch (error) {
        await connection.rollback();
        
        if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.code === '23000' || error.sqlMessage?.includes('foreign key')) {
            return res.status(400).json({ 
                success: false, 
                error: 'Тренера нельзя удалить, пока у него есть будущие тренировки, которые еще не проведены' 
            });
        }
        
        res.status(500).json({ success: false, error: 'Ошибка сервера: ' + error.message });
    } finally {
        connection.release();
    }
};

const getTrainerGroupSessions = async (req, res) => {
    try {
        const userId = req.user.userId;
        const trainer = await Trainer.findByUserId(userId);
        
        if (!trainer) {
            return res.status(404).json({ success: false, error: 'Тренер не найден' });
        }
        
        const sessions = await GroupSession.findByTrainerId(trainer.id);
        
        const formattedSessions = sessions.map(session => ({
            ...session,
            time: formatTimeSimply(session.time),
            current_participants: session.current_participants || 0
        }));
        
        res.json({ 
            success: true, 
            sessions: formattedSessions 
        });
        
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка сервера: ' + error.message 
        });
    }
};

const getTrainerSchedule = async (req, res) => {
    try {
        const userId = req.user.userId;
        const trainer = await Trainer.findByUserId(userId);
        
        if (!trainer) {
            return res.status(404).json({ success: false, error: 'Тренер не найден' });
        }
        
        const schedule = await TrainerSchedule.findByTrainerId(trainer.id);
        res.json({ success: true, schedule });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Ошибка сервера' });
    }
};

const getTrainerProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ success: false, error: 'Пользователь не найден' });
        }
        
        const trainer = await Trainer.findByUserId(userId);
        let trainerData = null;
        if (trainer) {
            const trainerFull = await Trainer.findById(trainer.id);
            trainerData = {
                experience: trainerFull?.experience || null,
                specialization: trainerFull?.specialization || null,
                bio: trainerFull?.bio || null
            };
        }
        
        res.json({ 
            success: true, 
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                ...trainerData
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Ошибка сервера' });
    }
};

const updateTrainerProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { name, email, phone, password, experience, specialization, bio } = req.body;

        if (email) {
            const emailExists = await User.checkEmailExists(email, userId);
            
            if (emailExists) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Пользователь с таким email уже существует' 
                });
            }
        }

        const userUpdateData = {};
        if (name !== undefined) userUpdateData.name = name || null;
        if (email !== undefined) userUpdateData.email = email || null;
        if (phone !== undefined) userUpdateData.phone = phone || null;
        if (password !== undefined && password) userUpdateData.password = password;

        if (Object.keys(userUpdateData).length > 0) {
            const updated = await User.update(userId, userUpdateData);
            if (!updated) {
                return res.status(404).json({ success: false, error: 'Пользователь не найден' });
            }
        }

        const trainer = await Trainer.findByUserId(userId);
        if (trainer) {
            const trainerUpdateData = {};
            if (experience !== undefined) trainerUpdateData.experience = experience || null;
            if (specialization !== undefined) trainerUpdateData.specialization = specialization || null;
            if (bio !== undefined) trainerUpdateData.bio = bio || null;

            if (Object.keys(trainerUpdateData).length > 0) {
                await Trainer.update(trainer.id, trainerUpdateData);
            }
        }

        const user = await User.findById(userId);
        const trainerFull = trainer ? await Trainer.findById(trainer.id) : null;

        res.json({ 
            success: true, 
            message: 'Профиль успешно обновлен',
            user: {
                ...user,
                experience: trainerFull?.experience || null,
                specialization: trainerFull?.specialization || null,
                bio: trainerFull?.bio || null
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Ошибка сервера: ' + error.message });
    }
};

const getTrainerStats = async (req, res) => {
    try {
        const userId = req.user.userId;
        const trainer = await Trainer.findByUserId(userId);
        
        if (!trainer) {
            return res.status(404).json({ success: false, error: 'Тренер не найден' });
        }

        const PersonalBooking = require('../models/PersonalBooking');
        const { pool } = require('../config/database');

        // Получаем статистику записей за последние 6 месяцев
        const [stats] = await pool.execute(`
            SELECT 
                DATE_FORMAT(booking_date, '%Y-%m') as month,
                COUNT(*) as count
            FROM personal_bookings
            WHERE trainer_id = ?
            AND booking_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
            GROUP BY DATE_FORMAT(booking_date, '%Y-%m')
            ORDER BY month ASC
        `, [trainer.id]);

        res.json({ 
            success: true, 
            stats: stats 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Ошибка сервера' });
    }
};

const getTrainerClients = async (req, res) => {
    try {
        const userId = req.user.userId;
        
        const trainer = await Trainer.findByUserId(userId);
        
        if (!trainer) {
            return res.status(404).json({ success: false, error: 'Тренер не найден' });
        }

        const PersonalBooking = require('../models/PersonalBooking');
        const bookings = await PersonalBooking.getByTrainerId(trainer.id);

        res.json({ 
            success: true, 
            bookings: bookings 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Ошибка сервера: ' + error.message });
    }
};

module.exports = {
    getAllTrainers,
    createTrainer,
    updateTrainer,
    deleteTrainer,
    getTrainerGroupSessions,
    getTrainerSchedule,
    getTrainerProfile,
    updateTrainerProfile,
    getTrainerStats,
    getTrainerClients
};

