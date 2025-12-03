const { pool } = require('../config/database');

class TrainerSchedule {
    static async getAll() {
        const [schedule] = await pool.execute(`
            SELECT 
                ts.id,
                ts.trainer_id,
                ts.day_of_week,
                ts.start_time,
                ts.end_time,
                ts.slot_type,
                ts.max_slots,
                ts.created_by,
                u.name as trainer_name,
                t.specialization
            FROM trainer_schedule ts
            JOIN trainers t ON ts.trainer_id = t.id
            JOIN users u ON t.user_id = u.id
            WHERE ts.slot_type = 'personal'
            ORDER BY 
                FIELD(ts.day_of_week, 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'),
                ts.start_time
        `);
        return schedule;
    }

    static async findByTrainerId(trainerId) {
        const [schedule] = await pool.execute(`
            SELECT 
                id,
                trainer_id,
                day_of_week,
                start_time,
                end_time,
                slot_type,
                max_slots,
                created_by
            FROM trainer_schedule 
            WHERE trainer_id = ?
        `, [trainerId]);
        return schedule;
    }

    static async findById(id) {
        const [schedule] = await pool.execute(
            'SELECT id FROM trainer_schedule WHERE id = ?',
            [id]
        );
        return schedule[0] || null;
    }

    static async create(scheduleData) {
        const { trainer_id, day_of_week, start_time, end_time, slot_type, max_slots, created_by } = scheduleData;
        
        const [result] = await pool.execute(
            'INSERT INTO trainer_schedule (trainer_id, day_of_week, start_time, end_time, slot_type, max_slots, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [trainer_id, day_of_week, start_time, end_time, slot_type, max_slots, created_by]
        );
        
        return result.insertId;
    }

    static async update(id, scheduleData) {
        const { trainer_id, day_of_week, start_time, end_time, max_slots } = scheduleData;
        
        const [result] = await pool.execute(
            'UPDATE trainer_schedule SET trainer_id = ?, day_of_week = ?, start_time = ?, end_time = ?, max_slots = ? WHERE id = ?',
            [trainer_id, day_of_week, start_time, end_time, max_slots, id]
        );
        
        return result.affectedRows > 0;
    }

    static async delete(id) {
        const [schedule] = await pool.execute(
            'SELECT id FROM trainer_schedule WHERE id = ?',
            [id]
        );
        
        if (schedule.length === 0) {
            return false;
        }
        
        await pool.execute('DELETE FROM trainer_schedule WHERE id = ?', [id]);
        return true;
    }

    static async checkOverlapping(trainerId, dayOfWeek, startTime, endTime, excludeId = null) {
        let query = `
            SELECT id FROM trainer_schedule 
            WHERE trainer_id = ? AND day_of_week = ? 
            AND ((start_time <= ? AND end_time > ?) OR (start_time < ? AND end_time >= ?))
        `;
        const params = [trainerId, dayOfWeek, startTime, startTime, endTime, endTime];
        
        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }
        
        const [overlapping] = await pool.execute(query, params);
        return overlapping.length > 0;
    }

    static async replaceTrainerSchedule(trainerId, slots, adminId) {
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            await connection.execute(
                'DELETE FROM trainer_schedule WHERE trainer_id = ?',
                [trainerId]
            );

            if (slots.length > 0) {
                const placeholders = slots.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(', ');
                const values = [];
                
                slots.forEach(slot => {
                    values.push(
                        trainerId,
                        slot.day_of_week,
                        slot.start_time,
                        slot.end_time,
                        slot.slot_type || 'personal',
                        slot.max_slots || 1,
                        adminId || null
                    );
                });

                await connection.execute(
                    `INSERT INTO trainer_schedule 
                        (trainer_id, day_of_week, start_time, end_time, slot_type, max_slots, created_by) 
                     VALUES ${placeholders}`,
                    values
                );
            }

            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}

module.exports = TrainerSchedule;

