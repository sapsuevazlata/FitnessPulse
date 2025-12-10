const { pool } = require('../config/database');

class GroupSession {
    static async getAll() {
        const [sessions] = await pool.execute(`
            SELECT 
                gs.*,
                u.name as trainer_name,
                t.id as trainer_id
            FROM group_sessions gs
            LEFT JOIN trainers t ON gs.trainer_id = t.id
            LEFT JOIN users u ON t.user_id = u.id
            ORDER BY gs.id DESC
        `);
        return sessions;
    }

    static async getActive() {
        return this.getAll();
    }

    static async findById(id) {
        const [sessions] = await pool.execute(`
            SELECT 
                gs.*,
                u.name as trainer_name,
                t.id as trainer_id
            FROM group_sessions gs
            LEFT JOIN trainers t ON gs.trainer_id = t.id
            LEFT JOIN users u ON t.user_id = u.id
            WHERE gs.id = ?
        `, [id]);
        return sessions[0] || null;
    }

    static async findByTrainerId(trainerId) {
        const [sessions] = await pool.execute(`
            SELECT 
                gs.*,
                u.name as trainer_name
            FROM group_sessions gs
            LEFT JOIN trainers t ON gs.trainer_id = t.id
            LEFT JOIN users u ON t.user_id = u.id
            WHERE gs.trainer_id = ?
            ORDER BY gs.name
        `, [trainerId]);
        return sessions;
    }

    static async create(sessionData) {
        const { name, description, days, time, max_participants, duration, trainer_id } = sessionData;
        
        const mysqlTime = time.length === 5 ? time + ':00' : time;
        const selectedDays = Array.isArray(days) ? days.join(',') : days;
        
        const [result] = await pool.execute(
            `INSERT INTO group_sessions 
             (name, description, days, time, max_participants, duration, trainer_id) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [name, description, selectedDays, mysqlTime, max_participants, duration, trainer_id || null]
        );
        
        return result.insertId;
    }

    static async update(id, sessionData) {
        const { name, description, days, time, max_participants, duration, trainer_id } = sessionData;
        
        const mysqlTime = time && time.length === 5 ? time + ':00' : time;
        const selectedDays = Array.isArray(days) ? days.join(',') : days;
        
        const [result] = await pool.execute(
            `UPDATE group_sessions 
             SET name = ?, description = ?, days = ?, time = ?, 
                 max_participants = ?, duration = ?, trainer_id = ?
             WHERE id = ?`,
            [name, description, selectedDays, mysqlTime, max_participants, duration, trainer_id || null, id]
        );
        
        return result.affectedRows > 0;
    }

    static async delete(id) {
        const [sessions] = await pool.execute(
            'SELECT * FROM group_sessions WHERE id = ?',
            [id]
        );
        
        if (sessions.length === 0) {
            return null;
        }
        
        await pool.execute('DELETE FROM group_sessions WHERE id = ?', [id]);
        return sessions[0];
    }

    static async getList() {
        const [sessions] = await pool.execute(`
            SELECT id, name, time, duration, days 
            FROM group_sessions 
            ORDER BY name
        `);
        return sessions;
    }

    static async checkTrainerTimeConflict(trainerId, days, time, duration = 60, excludeId = null) {
        if (!trainerId) return false;
        
        const daysArray = Array.isArray(days) ? days : (days ? days.split(',') : []);
        if (daysArray.length === 0) return false;
        
        const mysqlTime = time.length === 5 ? time + ':00' : time;
        
        let query = `
            SELECT id FROM group_sessions 
            WHERE trainer_id = ? 
            AND (
        `;
        const params = [trainerId];
        
        daysArray.forEach((day, index) => {
            if (index > 0) query += ' OR ';
            query += `FIND_IN_SET(?, days) > 0`;
            params.push(day);
        });
        
        query += `) AND (
            (time <= ? AND ADDTIME(time, SEC_TO_TIME(? * 60)) > ?) 
            OR 
            (time < ? AND ADDTIME(time, SEC_TO_TIME(? * 60)) >= ?)
            OR
            (? <= time AND ADDTIME(?, SEC_TO_TIME(? * 60)) > time)
        )`;
        
        params.push(mysqlTime, duration, mysqlTime, mysqlTime, duration, mysqlTime, mysqlTime, mysqlTime, duration);
        
        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }
        
        const [conflicts] = await pool.execute(query, params);
        return conflicts.length > 0;
    }

    static async checkTrainerScheduleConflict(trainerId, days, time, duration = 60) {
        if (!trainerId) return false;
        
        const daysArray = Array.isArray(days) ? days : (days ? days.split(',') : []);
        if (daysArray.length === 0) return false;
        
        const mysqlTime = time.length === 5 ? time + ':00' : time;
        
        const [hours, minutes] = mysqlTime.split(':').map(Number);
        const startMinutes = hours * 60 + minutes;
        const endMinutes = startMinutes + duration;
        const endHours = Math.floor(endMinutes / 60);
        const endMins = endMinutes % 60;
        const endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}:00`;
        
        let query = `
            SELECT id FROM trainer_schedule 
            WHERE trainer_id = ? 
            AND day_of_week IN (${daysArray.map(() => '?').join(',')})
            AND (
                (start_time <= ? AND end_time > ?) 
                OR 
                (start_time < ? AND end_time >= ?)
                OR
                (? <= start_time AND ? >= start_time)
            )
        `;
        const params = [trainerId, ...daysArray, mysqlTime, mysqlTime, endTime, endTime, mysqlTime, endTime];
        
        const [conflicts] = await pool.execute(query, params);
        return conflicts.length > 0;
    }
}

module.exports = GroupSession;

