const { pool } = require('../config/database');

class Inventory {
    // Получить весь инвентарь
    static async getAll() {
        const [items] = await pool.execute(
            'SELECT id, name FROM inventory ORDER BY name'
        );
        return items;
    }

    // Получить инвентарь по ID
    static async findById(id) {
        const [items] = await pool.execute(
            'SELECT id, name FROM inventory WHERE id = ?',
            [id]
        );
        return items[0] || null;
    }

    // Получить инвентарь по массиву ID
    static async findByIds(ids) {
        if (!ids || ids.length === 0) {
            return [];
        }
        const placeholders = ids.map(() => '?').join(', ');
        const [items] = await pool.execute(
            `SELECT id, name FROM inventory WHERE id IN (${placeholders})`,
            ids
        );
        return items;
    }
}

module.exports = Inventory;

