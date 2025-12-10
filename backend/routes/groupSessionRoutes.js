const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const {
    getAllGroupSessions,
    getGroupSessionById,
    createGroupSession,
    updateGroupSession,
    deleteGroupSession,
    getGroupSessionsList
} = require('../controllers/groupSessionController');

router.get('/', authenticateToken, requireRole('admin'), getAllGroupSessions);
router.get('/:id', authenticateToken, requireRole('admin'), getGroupSessionById);
router.post('/', authenticateToken, requireRole('admin'), createGroupSession);
router.put('/:id', authenticateToken, requireRole('admin'), updateGroupSession);
router.delete('/:id', authenticateToken, requireRole('admin'), deleteGroupSession);

module.exports = router;

