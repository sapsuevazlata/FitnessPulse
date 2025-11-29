const ClassType = require('../models/ClassType');

const getClassTypes = async (req, res) => {
    try {
        const classTypes = await ClassType.getAll();
        res.json({ success: true, classTypes });
    } catch (error) {
        console.error('Ошибка получения типов занятий:', error);
        res.status(500).json({ success: false, error: 'Ошибка сервера' });
    }
};

const createClassType = async (req, res) => {
    try {
        const { name, description, difficulty } = req.body;
        
        if (!name) {
            return res.status(400).json({ success: false, error: 'Название обязательно' });
        }

        const classTypeId = await ClassType.create({ name, description, difficulty });

        res.json({ 
            success: true, 
            message: 'Тип занятия успешно создан',
            classType: {
                id: classTypeId,
                name,
                description,
                difficulty
            }
        });
    } catch (error) {
        console.error('Ошибка создания типа занятия:', error);
        res.status(500).json({ success: false, error: 'Ошибка сервера' });
    }
};

const updateClassType = async (req, res) => {
    try {
        const classTypeId = req.params.id;
        const { name, description, difficulty, is_active } = req.body;

        const updated = await ClassType.update(classTypeId, { name, description, difficulty, is_active });

        if (!updated) {
            return res.status(404).json({ success: false, error: 'Тип занятия не найден' });
        }

        res.json({ success: true, message: 'Тип занятия успешно обновлен' });
    } catch (error) {
        console.error('Ошибка обновления типа занятия:', error);
        res.status(500).json({ success: false, error: 'Ошибка сервера' });
    }
};

module.exports = {
    getClassTypes,
    createClassType,
    updateClassType
};
