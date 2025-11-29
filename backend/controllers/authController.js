const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const register = async (req, res) => {
    try {
        const { name, email, password, role = 'client' } = req.body;
        
        if (!name || !email || !password) {
            return res.status(400).json({ 
                success: false,
                error: 'Все поля обязательны' 
            });
        }

        const emailExists = await User.checkEmailExists(email);
        
        if (emailExists) {
            return res.status(400).json({ 
                success: false,
                error: 'Пользователь с таким email уже существует' 
            });
        }

        const userId = await User.create({ name, email, password, role });
        
        const token = jwt.sign(
            { 
                userId: userId, 
                email: email, 
                role: role 
            },
            'fitnesshub_secret_key_2024',
            { expiresIn: '24h' }
        );

        res.json({ 
            success: true,
            message: 'Регистрация успешна!',
            token: token,
            user: {
                id: userId,
                name: name,
                email: email,
                role: role
            }
        });
        
    } catch (error) {
        console.error('Ошибка регистрации:', error);
        res.status(500).json({ 
            success: false,
            error: 'Ошибка сервера: ' + error.message 
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ 
                success: false,
                error: 'Email и пароль обязательны' 
            });
        }

        const user = await User.findByEmail(email);
        
        if (!user) {
            return res.status(401).json({ 
                success: false,
                error: 'Неверный email или пароль' 
            });
        }
        
        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
            return res.status(401).json({ 
                success: false,
                error: 'Неверный email или пароль' 
            });
        }

        const token = jwt.sign(
            { 
                userId: user.id, 
                email: user.email, 
                role: user.role 
            },
            'fitnesshub_secret_key_2024',
            { expiresIn: '24h' }
        );
        
        res.json({ 
            success: true,
            message: 'Вход выполнен успешно!',
            token: token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
        
    } catch (error) {
        console.error('Ошибка логина:', error);
        res.status(500).json({ 
            success: false,
            error: 'Ошибка сервера: ' + error.message 
        });
    }
};

module.exports = { register, login };

