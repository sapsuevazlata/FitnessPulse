const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root', 
    password: '1350Zlata0531!',
    database: 'fitnesshub'
});

async function testDB() {
    try {
        const connection = await pool.getConnection();
        await connection.execute('SHOW TABLES');
        connection.release();
    } catch (error) {
        // Ошибка подключения к БД
    }
}

module.exports = { pool, testDB };

