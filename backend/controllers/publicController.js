const Trainer = require('../models/Trainer');
const Subscription = require('../models/Subscription');
const GroupSession = require('../models/GroupSession');
const TrainerSchedule = require('../models/TrainerSchedule');
const { formatTimeSimply } = require('../utils/helpers');

const getTrainers = async (req, res) => {
    try {
        const trainers = await Trainer.getActive();
        res.json({ success: true, trainers });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Ошибка сервера: ' + error.message });
    }
};

const getSubscriptions = async (req, res) => {
    try {
        const subscriptions = await Subscription.getActive();
        res.json({ 
            success: true, 
            subscriptions 
        });
        
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка сервера: ' + error.message 
        });
    }
};

const getGroupSessions = async (req, res) => {
    try {
        const sessions = await GroupSession.getActive();
        
        const formattedSessions = sessions.map(session => ({
            id: session.id,
            name: session.name,
            description: session.description || '',
            days: session.days || '',
            time: formatTimeSimply(session.time),
            duration: session.duration || 60,
            max_participants: session.max_participants || 10,
            current_participants: session.current_participants || 0,
            trainer_id: session.trainer_id || null,
            trainer_name: session.trainer_name || 'Тренер'
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
        const { trainer_id } = req.query;
        
        if (!trainer_id) {
            return res.status(400).json({
                success: false,
                error: 'Не указан trainer_id'
            });
        }

        const schedule = await TrainerSchedule.findByTrainerId(trainer_id);
        
        res.json({ 
            success: true, 
            schedule: schedule || [] 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка сервера: ' + error.message 
        });
    }
};

module.exports = { getTrainers, getSubscriptions, getGroupSessions, getTrainerSchedule };

