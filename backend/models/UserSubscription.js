const { pool } = require('../config/database');

class UserSubscription {
    static async getActiveByUserId(userId) {
        const [subscriptions] = await pool.execute(`
            SELECT 
                us.*,
                st.name as subscription_name,
                st.type as subscription_type,
                st.description,
                st.price,
                st.visits_count,
                st.duration_days
            FROM user_subscriptions us
            JOIN subscription_types st ON us.subscription_type_id = st.id
            WHERE us.user_id = ? 
            AND us.status = 'active'
            AND (us.expires_at IS NULL OR us.expires_at > NOW())
            ORDER BY us.purchase_date DESC
        `, [userId]);
        
        const combo = subscriptions.find(sub => sub.subscription_type === 'combo');
        if (combo) {
            return combo;
        }
        
        return subscriptions[0] || null;
    }

    static async getAllActiveByUserId(userId) {
        const [subscriptions] = await pool.execute(`
            SELECT 
                us.*,
                st.name as subscription_name,
                st.type as subscription_type,
                st.description,
                st.price,
                st.visits_count,
                st.duration_days
            FROM user_subscriptions us
            JOIN subscription_types st ON us.subscription_type_id = st.id
            WHERE us.user_id = ? 
            AND us.status = 'active'
            AND (us.expires_at IS NULL OR us.expires_at > NOW())
            ORDER BY us.purchase_date DESC
        `, [userId]);
        
        return subscriptions;
    }

    static async getAllByUserId(userId) {
        const [subscriptions] = await pool.execute(`
            SELECT 
                us.*,
                st.name as subscription_name,
                st.type as subscription_type,
                st.description,
                st.price,
                st.visits_count,
                st.duration_days
            FROM user_subscriptions us
            JOIN subscription_types st ON us.subscription_type_id = st.id
            WHERE us.user_id = ?
            ORDER BY us.purchase_date DESC
        `, [userId]);
        
        return subscriptions;
    }

    static async create(userId, subscriptionTypeId) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const [subscriptions] = await connection.execute(
                'SELECT * FROM subscription_types WHERE id = ?',
                [subscriptionTypeId]
            );

            if (subscriptions.length === 0) {
                throw new Error('Абонемент не найден');
            }

            const newSubscription = subscriptions[0];
            const newType = newSubscription.type;

            const [activeSubscriptions] = await connection.execute(`
                SELECT us.*, st.type as subscription_type
                FROM user_subscriptions us
                JOIN subscription_types st ON us.subscription_type_id = st.id
                WHERE us.user_id = ? 
                AND us.status = 'active'
                AND (us.expires_at IS NULL OR us.expires_at > NOW())
            `, [userId]);

            let typesToDeactivate = [];

            if (newType === 'combo') {
                typesToDeactivate = ['group', 'gym', 'combo'];
            } else if (newType === 'group') {
                typesToDeactivate = ['group', 'combo'];
            } else if (newType === 'gym') {
                typesToDeactivate = ['gym', 'combo'];
            }

            if (typesToDeactivate.length > 0) {
                const placeholders = typesToDeactivate.map(() => '?').join(',');
                await connection.execute(`
                    UPDATE user_subscriptions us
                    JOIN subscription_types st ON us.subscription_type_id = st.id
                    SET us.status = 'expired'
                    WHERE us.user_id = ? 
                    AND us.status = 'active'
                    AND (us.expires_at IS NULL OR us.expires_at > NOW())
                    AND st.type IN (${placeholders})
                `, [userId, ...typesToDeactivate]);
            }

            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + newSubscription.duration_days);

            const [result] = await connection.execute(
                `INSERT INTO user_subscriptions 
                 (user_id, subscription_type_id, purchase_date, expires_at, status, remaining_visits) 
                 VALUES (?, ?, NOW(), ?, 'active', ?)`,
                [userId, subscriptionTypeId, expiresAt, newSubscription.visits_count]
            );

            await connection.commit();
            return result.insertId;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async updateStatus(userSubscriptionId, status) {
        const [result] = await pool.execute(
            'UPDATE user_subscriptions SET status = ? WHERE id = ?',
            [status, userSubscriptionId]
        );
        return result.affectedRows > 0;
    }

    static async decrementVisits(userSubscriptionId) {
        const [result] = await pool.execute(
            `UPDATE user_subscriptions 
             SET remaining_visits = remaining_visits - 1 
             WHERE id = ? AND remaining_visits > 0`,
            [userSubscriptionId]
        );
        return result.affectedRows > 0;
    }
}

module.exports = UserSubscription;

