const Inventory = require('../models/Inventory');

const getAllInventory = async (req, res) => {
    try {
        const items = await Inventory.getAll();
        
        res.json({
            success: true,
            inventory: items
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера: ' + error.message
        });
    }
};

const getInventoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const item = await Inventory.findById(id);
        
        if (!item) {
            return res.status(404).json({
                success: false,
                error: 'Инвентарь не найден'
            });
        }
        
        res.json({
            success: true,
            item: item
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера: ' + error.message
        });
    }
};

module.exports = {
    getAllInventory,
    getInventoryById
};

