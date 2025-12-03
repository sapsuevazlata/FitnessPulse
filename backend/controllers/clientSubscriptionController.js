const UserSubscription = require('../models/UserSubscription');
const Subscription = require('../models/Subscription');

// Получить активные абонементы клиента
const getMySubscription = async (req, res) => {
    try {
        const userId = req.user.userId;
        
        // Получаем все активные абонементы (может быть group и gym одновременно)
        const subscriptions = await UserSubscription.getAllActiveByUserId(userId);
        
        if (!subscriptions || subscriptions.length === 0) {
            return res.json({
                success: true,
                subscriptions: [],
                subscription: null, // Для обратной совместимости
                message: 'У вас нет активных абонементов'
            });
        }

        // Для обратной совместимости возвращаем первый (или combo если есть)
        const mainSubscription = subscriptions.find(sub => sub.subscription_type === 'combo') || subscriptions[0];

        res.json({
            success: true,
            subscriptions: subscriptions, // Все активные абонементы
            subscription: mainSubscription // Основной для обратной совместимости
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера: ' + error.message
        });
    }
};

// Получить все абонементы клиента
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

// Купить абонемент
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

        // Проверяем, что абонемент существует
        const subscriptionType = await Subscription.findById(subscription_type_id);
        if (!subscriptionType) {
            return res.status(404).json({
                success: false,
                error: 'Абонемент не найден'
            });
        }

        // Создаем покупку
        const userSubscriptionId = await UserSubscription.create(userId, subscription_type_id);

        // Получаем созданный абонемент
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

