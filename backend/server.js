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

const authRoutes = require('./routes/authRoutes');
const publicRoutes = require('./routes/publicRoutes');
const trainerRoutes = require('./routes/trainerRoutes');
const groupSessionRoutes = require('./routes/groupSessionRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

let clientRoutes;
try {
    clientRoutes = require('./routes/clientRoutes');
} catch (error) {
    const express = require('express');
    clientRoutes = express.Router();
    clientRoutes.get('/error', (req, res) => {
        res.status(500).json({ 
            success: false, 
            error: 'Client routes module failed to load',
            message: error.message 
        });
    });
    clientRoutes.get('/test-fallback', (req, res) => {
        res.json({ success: true, message: 'Fallback route works', error: error.message });
    });
}

app.get('/api/test', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Сервер работает!',
        timestamp: new Date().toISOString()
    });
});

app.get('/api/health', (req, res) => {
    res.json({ 
        success: true,
        message: 'FitnessHub API работает!',
        timestamp: new Date().toISOString()
    });
});

if (clientRoutes && typeof clientRoutes === 'function') {
    app.use('/api/client', clientRoutes);
}

app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/trainers', trainerRoutes);
app.use('/api/trainer', trainerRoutes);
app.use('/api/group-sessions', groupSessionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/bookings', bookingRoutes);

const trainingRoutes = require('./routes/trainingRoutes');
app.use('/api/trainings', trainingRoutes);

const reviewRoutes = require('./routes/reviewRoutes');
app.use('/api/reviews', reviewRoutes);

const inventoryRoutes = require('./routes/inventoryRoutes');
app.use('/api/inventory', inventoryRoutes);

app.listen(PORT, async () => {
    await testDB();
});
