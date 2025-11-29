const { pool } = require('../config/database');

class ClassType {
    static async getAll() {
        const [classTypes] = await pool.execute('SELECT * FROM class_types WHERE is_active = TRUE');
        return classTypes;
    }

    static async findById(id) {
        const [classTypes] = await pool.execute(
            'SELECT * FROM class_types WHERE id = ?',
            [id]
        );
        return classTypes[0] || null;
    }

    static async create(classTypeData) {
        const { name, description, difficulty } = classTypeData;
        
        const [result] = await pool.execute(
            'INSERT INTO class_types (name, description, difficulty) VALUES (?, ?, ?)',
            [name, description, difficulty]
        );
        
        return result.insertId;
    }

    static async update(id, classTypeData) {
        const { name, description, difficulty, is_active } = classTypeData;
        
        const [result] = await pool.execute(
            'UPDATE class_types SET name = ?, description = ?, difficulty = ?, is_active = ? WHERE id = ?',
            [name, description, difficulty, is_active, id]
        );
        
        return result.affectedRows > 0;
    }
}

module.exports = ClassType;

