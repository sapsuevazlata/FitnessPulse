const Trainer = require('../models/Trainer');
const Subscription = require('../models/Subscription');
const GroupSession = require('../models/GroupSession');
const { formatTimeSimply } = require('../utils/helpers');

const getTrainers = async (req, res) => {
    try {
        const trainers = await Trainer.getActive();
        res.json({ success: true, trainers });
    } catch (error) {
        console.error('Ошибка получения тренеров:', error);
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
        console.error('Ошибка получения абонементов:', error);
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
            is_active: Boolean(session.is_active),
            trainer_id: session.trainer_id || null,
            trainer_name: session.trainer_name || 'Тренер',
            created_at: session.created_at,
            updated_at: session.updated_at
        }));
        
        res.json({ 
            success: true, 
            sessions: formattedSessions
        });
        
    } catch (error) {
        console.error('Ошибка получения групповых занятий для клиентов:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка сервера: ' + error.message
        });
    }
};

module.exports = { getTrainers, getSubscriptions, getGroupSessions };

