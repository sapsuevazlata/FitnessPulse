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
        console.log('Успешное подключение к MySQL');
        const [tables] = await connection.execute('SHOW TABLES');
        console.log('Таблицы в базе:', tables.map(t => t.Tables_in_fitnesshub));
        connection.release();
    } catch (error) {
        console.log('Ошибка подключения к MySQL:', error.message);
    }
}

module.exports = { pool, testDB };

