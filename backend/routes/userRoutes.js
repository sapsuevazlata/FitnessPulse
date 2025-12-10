const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const { getUsers, deleteUser } = require('../controllers/adminController');

router.get('/', authenticateToken, requireRole('admin'), getUsers);
router.delete('/:id', authenticateToken, requireRole('admin'), deleteUser);

module.exports = router;

