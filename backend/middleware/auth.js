const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, error: 'Токен отсутствует' });
    }

    jwt.verify(token, 'fitnesshub_secret_key_2024', (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, error: 'Неверный токен' });
        }
        req.user = user;
        next();
    });
};

const requireRole = (role) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(403).json({ success: false, error: 'Роль пользователя не определена' });
        }
        if (req.user.role !== role) {
            return res.status(403).json({ 
                success: false, 
                error: `Доступ запрещен. Требуется роль: ${role}, текущая роль: ${req.user.role}` 
            });
        }
        next();
    };
};

module.exports = { authenticateToken, requireRole };

