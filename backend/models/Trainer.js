const { pool } = require('../config/database');

class Trainer {
    static async getAll() {
        const [trainers] = await pool.execute(`
            SELECT 
                t.id,
                t.user_id,
                u.name,
                u.email,
                u.phone,
                t.experience,
                t.specialization,
                t.bio,
                t.rating
            FROM trainers t 
            JOIN users u ON t.user_id = u.id 
            ORDER BY t.id DESC
        `);
        return trainers;
    }

    static async getActive() {
        const [trainers] = await pool.execute(`
            SELECT 
                t.id,
                t.user_id,
                t.experience,
                t.specialization,
                t.bio,
                t.rating,
                u.name,
                u.email
            FROM trainers t
            JOIN users u ON t.user_id = u.id
            ORDER BY t.rating DESC
        `);
        return trainers;
    }

    static async findById(id) {
        const [trainers] = await pool.execute(
            'SELECT * FROM trainers WHERE id = ?',
            [id]
        );
        return trainers[0] || null;
    }

    static async findByUserId(userId) {
        const [trainers] = await pool.execute(
            'SELECT id FROM trainers WHERE user_id = ?',
            [userId]
        );
        return trainers[0] || null;
    }

    static async create(trainerData) {
        const { user_id, experience, specialization, bio } = trainerData;
        
        const [result] = await pool.execute(
            'INSERT INTO trainers (user_id, experience, specialization, bio) VALUES (?, ?, ?, ?)',
            [user_id, experience, specialization, bio]
        );
        
        return result.insertId;
    }

    static async update(id, trainerData) {
        const { experience, specialization, bio } = trainerData;
        
        const experienceValue = experience !== undefined ? experience : null;
        const specializationValue = specialization !== undefined ? specialization : null;
        const bioValue = bio !== undefined ? bio : null;
        
        const [result] = await pool.execute(
            'UPDATE trainers SET experience = ?, specialization = ?, bio = ? WHERE id = ?',
            [experienceValue, specializationValue, bioValue, id]
        );
        
        return result.affectedRows > 0;
    }

    static async delete(id) {
        const [trainerData] = await pool.execute(
            'SELECT user_id FROM trainers WHERE id = ?',
            [id]
        );
        
        if (trainerData.length === 0) {
            return null;
        }
        
        return trainerData[0].user_id;
    }

    static async getAvailableForTime(dayOfWeek, time) {
        const [trainers] = await pool.execute(`
            SELECT t.id, u.name, t.specialization
            FROM trainers t
            JOIN users u ON t.user_id = u.id
            AND t.id NOT IN (
                SELECT trainer_id FROM trainer_schedule 
                WHERE day_of_week = ? AND start_time = ?
            )
        `, [dayOfWeek, time]);
        
        return trainers;
    }
}

module.exports = Trainer;

