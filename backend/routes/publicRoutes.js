const express = require('express');
const router = express.Router();
const { getTrainers, getSubscriptions, getGroupSessions } = require('../controllers/publicController');

router.get('/trainers', getTrainers);
router.get('/subscriptions', getSubscriptions);
router.get('/group-sessions', getGroupSessions);

module.exports = router;

