const express = require('express');
const router = express.Router();
const {
    getAllInventory,
    getInventoryById
} = require('../controllers/inventoryController');

// Получить весь инвентарь (публичный доступ)
router.get('/', getAllInventory);

// Получить инвентарь по ID (публичный доступ)
router.get('/:id', getInventoryById);

module.exports = router;

