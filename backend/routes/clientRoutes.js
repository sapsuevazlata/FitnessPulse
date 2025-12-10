const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');

let getMySubscription, getMySubscriptions, purchaseSubscription;
try {
    const controller = require('../controllers/clientSubscriptionController');
    getMySubscription = controller.getMySubscription;
    getMySubscriptions = controller.getMySubscriptions;
    purchaseSubscription = controller.purchaseSubscription;
} catch (error) {
    getMySubscription = (req, res) => res.status(500).json({ success: false, error: 'Controller not loaded' });
    getMySubscriptions = (req, res) => res.status(500).json({ success: false, error: 'Controller not loaded' });
    purchaseSubscription = (req, res) => res.status(500).json({ success: false, error: 'Controller not loaded' });
}

router.get('/subscriptions/my', authenticateToken, requireRole('client'), getMySubscription);

router.get('/subscriptions/all', authenticateToken, requireRole('client'), getMySubscriptions);

router.post('/subscriptions/purchase', authenticateToken, requireRole('client'), purchaseSubscription);

router.get('/test-route', (req, res) => {
    res.json({ success: true, message: 'Client routes are working!', path: '/api/client/test-route' });
});

module.exports = router;

