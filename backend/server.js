require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { testDB } = require('./config/database');

const app = express();
const PORT = 3000;

app.use(cors({
    origin: ['http://127.0.0.1:5500', 'http://localhost:5500', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Routes
const authRoutes = require('./routes/authRoutes');
const publicRoutes = require('./routes/publicRoutes');
const trainerRoutes = require('./routes/trainerRoutes');
const groupSessionRoutes = require('./routes/groupSessionRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const classTypeRoutes = require('./routes/classTypeRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Сервер работает!',
        timestamp: new Date().toISOString()
    });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true,
        message: 'FitnessHub API работает!',
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/trainers', trainerRoutes);
app.use('/api/trainer', trainerRoutes);
app.use('/api/group-sessions', groupSessionRoutes);
app.use('/api/class-types', classTypeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);

app.listen(PORT, async () => {
    console.log(`Сервер запущен на порту ${PORT}`);
    console.log(`API доступно: http://localhost:${PORT}/api`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
    
    await testDB();
});
