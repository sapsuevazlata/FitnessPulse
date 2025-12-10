const UserSubscription = require('../models/UserSubscription');
const Subscription = require('../models/Subscription');

const getMySubscription = async (req, res) => {
    try {
        const userId = req.user.userId;
        
        const subscriptions = await UserSubscription.getAllActiveByUserId(userId);
        
        if (!subscriptions || subscriptions.length === 0) {
            return res.json({
                success: true,
                subscriptions: [],
                subscription: null, 
                message: 'У вас нет активных абонементов'
            });
        }

        const mainSubscription = subscriptions.find(sub => sub.subscription_type === 'combo') || subscriptions[0];

        res.json({
            success: true,
            subscriptions: subscriptions, 
            subscription: mainSubscription 
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера: ' + error.message
        });
    }
};

const getMySubscriptions = async (req, res) => {
    try {
        const userId = req.user.userId;
        
        const subscriptions = await UserSubscription.getAllByUserId(userId);
        
        res.json({
            success: true,
            subscriptions: subscriptions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера: ' + error.message
        });
    }
};

const purchaseSubscription = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { subscription_type_id } = req.body;

        if (!subscription_type_id) {
            return res.status(400).json({
                success: false,
                error: 'Не указан тип абонемента'
            });
        }

        const subscriptionType = await Subscription.findById(subscription_type_id);
        if (!subscriptionType) {
            return res.status(404).json({
                success: false,
                error: 'Абонемент не найден'
            });
        }

        const userSubscriptionId = await UserSubscription.create(userId, subscription_type_id);

        const newSubscription = await UserSubscription.getActiveByUserId(userId);

        res.json({
            success: true,
            message: 'Абонемент успешно приобретен',
            subscription: newSubscription
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера: ' + error.message
        });
    }
};

module.exports = {
    getMySubscription,
    getMySubscriptions,
    purchaseSubscription
};

