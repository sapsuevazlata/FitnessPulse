const User = require('../models/User');
const Trainer = require('../models/Trainer');
const GroupSession = require('../models/GroupSession');
const TrainerSchedule = require('../models/TrainerSchedule');
const { formatTimeSimply } = require('../utils/helpers');

const getAllTrainers = async (req, res) => {
    try {
        const trainers = await Trainer.getAll();
        res.json({ success: true, trainers });
        
    } catch (error) {
        console.error('Ошибка получения тренеров для админа:', error);
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
        console.error('Ошибка создания тренера:', error);
        res.status(500).json({ success: false, error: 'Ошибка сервера: ' + error.message });
    }
};

const updateTrainer = async (req, res) => {
    try {
        const trainerId = req.params.id;
        const { name, email, phone, experience, specialization, bio, is_active, password } = req.body;

        const trainer = await Trainer.findById(trainerId);

        if (!trainer) {
            return res.status(404).json({ success: false, error: 'Тренер не найден' });
        }

        await User.update(trainer.user_id, { name, email, phone, password });
        await Trainer.update(trainerId, { experience, specialization, bio, is_active });

        res.json({ success: true, message: 'Тренер успешно обновлен' });
    } catch (error) {
        console.error('Ошибка обновления тренера:', error);
        res.status(500).json({ success: false, error: 'Ошибка сервера' });
    }
};

const deleteTrainer = async (req, res) => {
    try {
        const trainerId = req.params.id;
        const userId = await Trainer.delete(trainerId);

        if (!userId) {
            return res.status(404).json({ success: false, error: 'Тренер не найден' });
        }

        await User.delete(userId);
        res.json({ success: true, message: 'Тренер успешно удален' });
    } catch (error) {
        console.error('Ошибка удаления тренера:', error);
        res.status(500).json({ success: false, error: 'Ошибка сервера' });
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
            is_active: Boolean(session.is_active),
            current_participants: session.current_participants || 0
        }));
        
        res.json({ 
            success: true, 
            sessions: formattedSessions 
        });
        
    } catch (error) {
        console.error('Ошибка получения group_sessions тренера:', error);
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
        console.error('Ошибка получения расписания:', error);
        res.status(500).json({ success: false, error: 'Ошибка сервера' });
    }
};

module.exports = {
    getAllTrainers,
    createTrainer,
    updateTrainer,
    deleteTrainer,
    getTrainerGroupSessions,
    getTrainerSchedule
};

