const { pool } = require('../config/database');

class Subscription {
    static async getAll() {
        const [subscriptions] = await pool.execute(`
            SELECT * FROM subscription_types ORDER BY type, price
        `);
        return subscriptions;
    }

    static async getActive() {
        return this.getAll();
    }

    static async findById(id) {
        const [subscriptions] = await pool.execute(
            'SELECT * FROM subscription_types WHERE id = ?',
            [id]
        );
        return subscriptions[0] || null;
    }

    static async create(subscriptionData) {
        const { name, type, description, price, visits_count, duration_days } = subscriptionData;
        
        const [result] = await pool.execute(
            'INSERT INTO subscription_types (name, type, description, price, visits_count, duration_days) VALUES (?, ?, ?, ?, ?, ?)',
            [name, type, description, price, visits_count, duration_days]
        );
        
        return result.insertId;
    }

    static async update(id, subscriptionData) {
        const { name, type, description, price, visits_count, duration_days } = subscriptionData;
        
        const [result] = await pool.execute(
            'UPDATE subscription_types SET name = ?, type = ?, description = ?, price = ?, visits_count = ?, duration_days = ? WHERE id = ?',
            [name, type, description, price, visits_count, duration_days, id]
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

