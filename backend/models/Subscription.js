const { pool } = require('../config/database');

class Subscription {
    static async getAll() {
        const [subscriptions] = await pool.execute(`
            SELECT * FROM subscription_types ORDER BY type, price
        `);
        return subscriptions;
    }

    static async getActive() {
        const [subscriptions] = await pool.execute(`
            SELECT * FROM subscription_types 
            WHERE is_active = TRUE 
            ORDER BY price ASC
        `);
        return subscriptions;
    }

    static async findById(id) {
        const [subscriptions] = await pool.execute(
            'SELECT * FROM subscription_types WHERE id = ?',
            [id]
        );
        return subscriptions[0] || null;
    }

    static async create(subscriptionData) {
        const { name, type, description, price, visits_count, duration_days, is_active = true } = subscriptionData;
        const isActiveTinyint = is_active ? 1 : 0;
        
        const [result] = await pool.execute(
            'INSERT INTO subscription_types (name, type, description, price, visits_count, duration_days, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, type, description, price, visits_count, duration_days, isActiveTinyint]
        );
        
        return result.insertId;
    }

    static async update(id, subscriptionData) {
        const { name, type, description, price, visits_count, duration_days, is_active } = subscriptionData;
        const isActiveTinyint = is_active ? 1 : 0;
        
        const [result] = await pool.execute(
            'UPDATE subscription_types SET name = ?, type = ?, description = ?, price = ?, visits_count = ?, duration_days = ?, is_active = ? WHERE id = ?',
            [name, type, description, price, visits_count, duration_days, isActiveTinyint, id]
        );
        
        return result.affectedRows > 0;
    }

    static async delete(id) {
        const [subscriptions] = await pool.execute(
            'SELECT * FROM subscription_types WHERE id = ?',
            [id]
        );
        
        if (subscriptions.length === 0) {
            return null;
        }
        
        await pool.execute('DELETE FROM subscription_types WHERE id = ?', [id]);
        return subscriptions[0];
    }
}

module.exports = Subscription;

