const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const register = async (req, res) => {
    try {
        const { name, email, phone, password, role = 'client' } = req.body;
        
        if (!name || !email || !password) {
            return res.status(400).json({ 
                success: false,
                error: 'Все поля обязательны (имя, email, пароль). Телефон необязателен.' 
            });
        }
        
        let phoneTrimmed = null;
        if (phone) {
            phoneTrimmed = String(phone).trim();
            if (phoneTrimmed !== '') {
                const phoneRegex = /^\+375[0-9]{9}$/;
                if (!phoneRegex.test(phoneTrimmed)) {
                    return res.status(400).json({
                        success: false,
                        error: 'Номер телефона должен быть в формате +375XXXXXXXXX (например, +375291234567) или оставьте поле пустым'
                    });
                }
            } else {
                phoneTrimmed = null;
            }
        }
        
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                error: 'Пароль должен содержать минимум 8 символов'
            });
        }

        const emailExists = await User.checkEmailExists(email);
        
        if (emailExists) {
            return res.status(400).json({ 
                success: false,
                error: 'Пользователь с таким email уже существует' 
            });
        }

        const userId = await User.create({ name, email, phone: phoneTrimmed, password, role });
        
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
        res.status(500).json({ 
            success: false,
            error: 'Ошибка сервера: ' + error.message 
        });
    }
};

module.exports = { register, login };

