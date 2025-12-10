const TrainerSchedule = require('../models/TrainerSchedule');
const Trainer = require('../models/Trainer');
const { getDayOfWeek } = require('../utils/helpers');

const VALID_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const normalizeDay = (value) => {
    if (!value || typeof value !== 'string') return null;
    const day = value.toLowerCase();
    return VALID_DAYS.includes(day) ? day : null;
};

const normalizeTime = (value) => {
    if (!value || typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (/^\d{2}:\d{2}$/.test(trimmed)) {
        return `${trimmed}:00`;
    }
    if (/^\d{2}:\d{2}:\d{2}$/.test(trimmed)) {
        return trimmed;
    }
    return null;
};

const addOneHour = (timeString) => {
    const parts = timeString.split(':');
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1] || 0, 10);
    const date = new Date(2000, 0, 1, hours, minutes);
    date.setHours(date.getHours() + 1);
    return date.toTimeString().substring(0, 8); 
};

const getTrainerSchedule = async (req, res) => {
    try {
        const { trainer_id } = req.query;
        
        let schedule;
        if (trainer_id) {
            schedule = await TrainerSchedule.findByTrainerId(trainer_id);
        } else {
            schedule = await TrainerSchedule.getAll();
        }
        
        res.json({ success: true, schedule });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Ошибка сервера' });
    }
};

const createTrainerSchedule = async (req, res) => {
    try {
        const adminId = req.user?.userId;
        const { trainer_id, slots } = req.body;

        if (!adminId) {
            return res.status(401).json({
                success: false,
                error: 'Не авторизован'
            });
        }

        if (!trainer_id) {
            return res.status(400).json({
                success: false,
                error: 'Не указан тренер'
            });
        }

        if (!Array.isArray(slots)) {
            return res.status(400).json({
                success: false,
                error: 'Ожидался массив slots'
            });
        }

        const normalizedSlots = [];
        const deduplicationSet = new Set();

        slots.forEach((slot) => {
            const day = normalizeDay(slot.day_of_week);
            const start = normalizeTime(slot.start_time);

            if (!day || !start) {
                return;
            }

            const key = `${day}-${start}`;
            if (deduplicationSet.has(key)) {
                return;
            }
            deduplicationSet.add(key);

            const end = addOneHour(start);

            normalizedSlots.push({
                day_of_week: day,
                start_time: start,
                end_time: end,
                slot_type: 'personal',
                max_slots: slot.max_slots || 1
            });
        });

        if (normalizedSlots.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Нет валидных слотов для сохранения'
            });
        }

        await TrainerSchedule.replaceTrainerSchedule(trainer_id, normalizedSlots, adminId);

        res.json({
            success: true,
            message: 'Расписание тренера обновлено',
            slots: normalizedSlots.length
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка сервера: ' + error.message 
        });
    }
};

const updateTrainerSchedule = async (req, res) => {
    try {
        const scheduleId = req.params.id;
        const { trainer_id, day_of_week, start_time, end_time, max_slots } = req.body;

        const schedule = await TrainerSchedule.findById(scheduleId);

        if (!schedule) {
            return res.status(404).json({ 
                success: false, 
                error: 'Персональный слот расписания не найден' 
            });
        }

        const day = normalizeDay(day_of_week);
        const start = normalizeTime(start_time);
        const end = normalizeTime(end_time);

        if (!day || !start || !end) {
            return res.status(400).json({
                success: false,
                error: 'Некорректные данные слота'
            });
        }

        const updated = await TrainerSchedule.update(scheduleId, { trainer_id, day_of_week: day, start_time: start, end_time: end, max_slots });

        if (!updated) {
            return res.status(404).json({ 
                success: false, 
                error: 'Слот не найден' 
            });
        }

        res.json({ 
            success: true, 
            message: 'Персональный слот расписания обновлен'
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка сервера: ' + error.message 
        });
    }
};

const deleteTrainerSchedule = async (req, res) => {
    try {
        const scheduleId = req.params.id;
        const deleted = await TrainerSchedule.delete(scheduleId);

        if (!deleted) {
            return res.status(404).json({ 
                success: false, 
                error: 'Слот не найден' 
            });
        }

        res.json({ 
            success: true, 
            message: 'Слот удален' 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка сервера' 
        });
    }
};

const getAvailableTrainers = async (req, res) => {
    try {
        const { date, time } = req.query;
        const trainers = await Trainer.getAvailableForTime(getDayOfWeek(date), time);
        res.json({ success: true, trainers });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Ошибка сервера' });
    }
};

module.exports = {
    getTrainerSchedule,
    createTrainerSchedule,
    updateTrainerSchedule,
    deleteTrainerSchedule,
    getAvailableTrainers
};
