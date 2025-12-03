const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');

// Загружаем контроллер с обработкой ошибок
let getMySubscription, getMySubscriptions, purchaseSubscription;
try {
    const controller = require('../controllers/clientSubscriptionController');
    getMySubscription = controller.getMySubscription;
    getMySubscriptions = controller.getMySubscriptions;
    purchaseSubscription = controller.purchaseSubscription;
} catch (error) {
    // Создаем заглушки для обработчиков
    getMySubscription = (req, res) => res.status(500).json({ success: false, error: 'Controller not loaded' });
    getMySubscriptions = (req, res) => res.status(500).json({ success: false, error: 'Controller not loaded' });
    purchaseSubscription = (req, res) => res.status(500).json({ success: false, error: 'Controller not loaded' });
}

// Получить активный абонемент
router.get('/subscriptions/my', authenticateToken, requireRole('client'), getMySubscription);

// Получить все абонементы клиента
router.get('/subscriptions/all', authenticateToken, requireRole('client'), getMySubscriptions);

// Купить абонемент
router.post('/subscriptions/purchase', authenticateToken, requireRole('client'), purchaseSubscription);

// Тестовый маршрут без авторизации для проверки
router.get('/test-route', (req, res) => {
    res.json({ success: true, message: 'Client routes are working!', path: '/api/client/test-route' });
});

module.exports = router;

