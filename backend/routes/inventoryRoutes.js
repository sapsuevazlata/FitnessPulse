const express = require('express');
const router = express.Router();
const {
    getAllInventory,
    getInventoryById
} = require('../controllers/inventoryController');

router.get('/', getAllInventory);

router.get('/:id', getInventoryById);

module.exports = router;

