const GroupSession = require('../models/GroupSession');
const { formatTimeSimply } = require('../utils/helpers');

const getAllGroupSessions = async (req, res) => {
    try {
        const sessions = await GroupSession.getAll();
        
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
            trainer_name: session.trainer_name || null
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

const getGroupSessionById = async (req, res) => {
    try {
        const { id } = req.params;
        const session = await GroupSession.findById(id);
        
        if (!session) {
            return res.status(404).json({ 
                success: false, 
                error: 'Занятие не найдено' 
            });
        }
        
        const formattedSession = {
            ...session,
            time: formatTimeSimply(session.time)
        };
        
        res.json({ 
            success: true, 
            session: formattedSession 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка сервера: ' + error.message 
        });
    }
};

const createGroupSession = async (req, res) => {
    try {
        const { name, description, days, time, max_participants, duration, trainer_id } = req.body;
        
        if (!name || !days || !time || !max_participants || !duration) {
            return res.status(400).json({ 
                success: false, 
                error: 'Все поля обязательны' 
            });
        }

        if (trainer_id) {
            const hasGroupConflict = await GroupSession.checkTrainerTimeConflict(trainer_id, days, time, duration);
            if (hasGroupConflict) {
                return res.status(400).json({
                    success: false,
                    error: 'Тренер уже занят в это время другим групповым занятием'
                });
            }

            const hasScheduleConflict = await GroupSession.checkTrainerScheduleConflict(trainer_id, days, time, duration);
            if (hasScheduleConflict) {
                return res.status(400).json({
                    success: false,
                    error: 'Тренер уже занят в это время персональной тренировкой'
                });
            }
        }

        const sessionId = await GroupSession.create({ name, description, days, time, max_participants, duration, trainer_id });
        
        res.json({ 
            success: true, 
            message: 'Групповое занятие создано',
            sessionId: sessionId
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка сервера: ' + error.message 
        });
    }
};

const updateGroupSession = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, days, time, max_participants, duration, trainer_id } = req.body;
        
        if (trainer_id) {
            const hasGroupConflict = await GroupSession.checkTrainerTimeConflict(trainer_id, days, time, duration, id);
            if (hasGroupConflict) {
                return res.status(400).json({
                    success: false,
                    error: 'Тренер уже занят в это время другим групповым занятием'
                });
            }

            const hasScheduleConflict = await GroupSession.checkTrainerScheduleConflict(trainer_id, days, time, duration);
            if (hasScheduleConflict) {
                return res.status(400).json({
                    success: false,
                    error: 'Тренер уже занят в это время персональной тренировкой'
                });
            }
        }
        
        const updated = await GroupSession.update(id, { name, description, days, time, max_participants, duration, trainer_id });
        
        if (!updated) {
            return res.status(404).json({ 
                success: false, 
                error: 'Занятие не найдено' 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Занятие обновлено'
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка сервера: ' + error.message 
        });
    }
};

const deleteGroupSession = async (req, res) => {
    try {
        const { id } = req.params;
        const session = await GroupSession.delete(id);
        
        if (!session) {
            return res.status(404).json({ success: false, error: 'Занятие не найдено' });
        }
        
        res.json({ 
            success: true, 
            message: 'Занятие удалено',
            session: session
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Ошибка сервера' });
    }
};

const getGroupSessionsList = async (req, res) => {
    try {
        const sessions = await GroupSession.getList();
        res.json({ success: true, sessions });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Ошибка сервера' });
    }
};

module.exports = {
    getAllGroupSessions,
    getGroupSessionById,
    createGroupSession,
    updateGroupSession,
    deleteGroupSession,
    getGroupSessionsList
};
