// server/routes/recordRoutes.js
const express = require('express');
const router = express.Router();
const { createRecord, searchRecords, updateRecord } = require('../controllers/recordController');

router.post('/', createRecord);
router.get('/search', searchRecords);
router.put('/:id', updateRecord);  // Update route

module.exports = router;
