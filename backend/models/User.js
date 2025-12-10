const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
    static async findByEmail(email) {
        const [users] = await pool.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
        return users[0] || null;
    }

    static async findById(id) {
        const [users] = await pool.execute(
            'SELECT id, name, email, phone, role FROM users WHERE id = ?',
            [id]
        );
        return users[0] || null;
    }

    static async create(userData) {
        const { name, email, password, phone, role = 'client' } = userData;
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const phoneValue = (phone && String(phone).trim()) || null;
        
        const [result] = await pool.execute(
            'INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)',
            [name, email, hashedPassword, phoneValue, role]
        );
        
        return result.insertId;
    }

    static async update(id, userData) {
        const { name, email, phone, password } = userData;
        
        const nameValue = name !== undefined ? name : null;
        const emailValue = email !== undefined ? email : null;
        const phoneValue = phone !== undefined ? phone : null;
        
        let updateQuery = 'UPDATE users SET name = ?, email = ?, phone = ?';
        let queryParams = [nameValue, emailValue, phoneValue];

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateQuery += ', password = ?';
            queryParams.push(hashedPassword);
        }

        updateQuery += ' WHERE id = ?';
        queryParams.push(id);

        const [result] = await pool.execute(updateQuery, queryParams);
        return result.affectedRows > 0;
    }

    static async delete(id) {
        const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }

    static async getAll() {
        const [users] = await pool.execute(`
            SELECT id, name, email, phone, role 
            FROM users 
            ORDER BY id DESC
        `);
        return users;
    }

    static async checkEmailExists(email, excludeId = null) {
        let query = 'SELECT id FROM users WHERE email = ?';
        const params = [email];
        
        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }
        
        const [users] = await pool.execute(query, params);
        return users.length > 0;
    }
}

module.exports = User;

