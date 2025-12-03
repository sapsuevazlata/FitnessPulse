const Subscription = require('../models/Subscription');

const getAllSubscriptions = async (req, res) => {
    try {
        const subscriptions = await Subscription.getAll();
        res.json({ success: true, subscriptions });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Ошибка сервера' });
    }
};

const createSubscription = async (req, res) => {
    try {
        const { name, type, description, price, visits_count, duration_days } = req.body;
        
        const subscriptionId = await Subscription.create({ name, type, description, price, visits_count, duration_days });

        res.json({ 
            success: true, 
            message: 'Абонемент создан',
            subscriptionId: subscriptionId
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Ошибка сервера' });
    }
};

const updateSubscription = async (req, res) => {
    try {
        const subscriptionId = req.params.id;
        const { name, type, description, price, visits_count, duration_days } = req.body;
        
        const updated = await Subscription.update(subscriptionId, { name, type, description, price, visits_count, duration_days });

        if (!updated) {
            return res.status(404).json({ success: false, error: 'Абонемент не найден' });
        }

        res.json({ success: true, message: 'Абонемент обновлен' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Ошибка сервера' });
    }
};

const deleteSubscription = async (req, res) => {
    try {
        const subscriptionId = req.params.id;
        const subscription = await Subscription.delete(subscriptionId);
        
        if (!subscription) {
            return res.status(404).json({ success: false, error: 'Абонемент не найден' });
        }

        res.json({ 
            success: true, 
            message: 'Абонемент удален',
            subscription: subscription
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Ошибка сервера' });
    }
};

module.exports = {
    getAllSubscriptions,
    createSubscription,
    updateSubscription,
    deleteSubscription
};
