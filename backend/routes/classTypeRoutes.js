const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const {
    getClassTypes,
    createClassType,
    updateClassType
} = require('../controllers/classTypeController');

router.get('/', authenticateToken, getClassTypes);
router.post('/', authenticateToken, requireRole('admin'), createClassType);
router.put('/:id', authenticateToken, requireRole('admin'), updateClassType);

module.exports = router;

