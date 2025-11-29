const Subscription = require('../models/Subscription');

const getAllSubscriptions = async (req, res) => {
    try {
        const subscriptions = await Subscription.getAll();
        
        const formattedSubscriptions = subscriptions.map(sub => ({
            ...sub,
            is_active: Boolean(sub.is_active)
        }));
        
        res.json({ success: true, subscriptions: formattedSubscriptions });
    } catch (error) {
        console.error('Ошибка получения абонементов:', error);
        res.status(500).json({ success: false, error: 'Ошибка сервера' });
    }
};

const createSubscription = async (req, res) => {
    try {
        const { name, type, description, price, visits_count, duration_days, is_active = true } = req.body;
        
        const subscriptionId = await Subscription.create({ name, type, description, price, visits_count, duration_days, is_active });

        res.json({ 
            success: true, 
            message: 'Абонемент создан',
            subscriptionId: subscriptionId
        });
    } catch (error) {
        console.error('Ошибка создания абонемента:', error);
        res.status(500).json({ success: false, error: 'Ошибка сервера' });
    }
};

const updateSubscription = async (req, res) => {
    try {
        const subscriptionId = req.params.id;
        const { name, type, description, price, visits_count, duration_days, is_active } = req.body;
        
        const updated = await Subscription.update(subscriptionId, { name, type, description, price, visits_count, duration_days, is_active });

        if (!updated) {
            return res.status(404).json({ success: false, error: 'Абонемент не найден' });
        }

        res.json({ success: true, message: 'Абонемент обновлен' });
    } catch (error) {
        console.error('Ошибка обновления абонемента:', error);
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
        console.error('Ошибка удаления абонемента:', error);
        res.status(500).json({ success: false, error: 'Ошибка сервера' });
    }
};

module.exports = {
    getAllSubscriptions,
    createSubscription,
    updateSubscription,
    deleteSubscription
};
