const { pool } = require('../config/database');

class Stats {
    static async getAdminStats() {
        const [[{totalClients}]] = await pool.execute(
            "SELECT COUNT(*) as totalClients FROM users WHERE role = 'client'"
        );
        
        const [[{totalTrainers}]] = await pool.execute(
            "SELECT COUNT(*) as totalTrainers FROM trainers"
        );
        
        const [[{todaySessions}]] = await pool.execute(
            "SELECT COUNT(*) as todaySessions FROM group_sessions"
        );
        
        const [[{monthlyRevenue}]] = await pool.execute(`
            SELECT COALESCE(SUM(st.price), 0) as monthlyRevenue 
            FROM user_subscriptions us 
            JOIN subscription_types st ON us.subscription_type_id = st.id 
            WHERE MONTH(us.purchase_date) = MONTH(CURDATE()) 
            AND YEAR(us.purchase_date) = YEAR(CURDATE())
            AND us.status = 'active'
        `);

        return {
            totalClients: parseInt(totalClients),
            activeTrainers: parseInt(totalTrainers),
            todaySessions: parseInt(todaySessions),
            monthlyRevenue: parseFloat(monthlyRevenue)
        };
    }
}

module.exports = Stats;

