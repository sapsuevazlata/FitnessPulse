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
        const [sessions] = await pool.execute(`
            SELECT 
                gs.*,
                u.name as trainer_name,
                t.id as trainer_id
            FROM group_sessions gs
            LEFT JOIN trainers t ON gs.trainer_id = t.id
            LEFT JOIN users u ON t.user_id = u.id
            WHERE gs.is_active = TRUE
            ORDER BY gs.name
        `);
        return sessions;
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
        const { name, description, days, time, max_participants, duration, is_active, trainer_id } = sessionData;
        
        const mysqlTime = time && time.length === 5 ? time + ':00' : time;
        const selectedDays = Array.isArray(days) ? days.join(',') : days;
        
        const [result] = await pool.execute(
            `UPDATE group_sessions 
             SET name = ?, description = ?, days = ?, time = ?, 
                 max_participants = ?, duration = ?, is_active = ?, trainer_id = ?
             WHERE id = ?`,
            [name, description, selectedDays, mysqlTime, max_participants, duration, is_active, trainer_id || null, id]
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
            WHERE is_active = TRUE
            ORDER BY name
        `);
        return sessions;
    }
}

module.exports = GroupSession;

