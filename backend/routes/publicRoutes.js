const express = require('express');
const router = express.Router();
const { getTrainers, getSubscriptions, getGroupSessions, getTrainerSchedule } = require('../controllers/publicController');

router.get('/trainers', getTrainers);
router.get('/subscriptions', getSubscriptions);
router.get('/group-sessions', getGroupSessions);
router.get('/trainer-schedule', getTrainerSchedule);

module.exports = router;

