// server/routes/recordRoutes.js
const express = require('express');
const router = express.Router();
const {
  createRecord,
  searchRecords,
  updateRecord,
  deleteRecord,
  deleteAllRecords
} = require('../controllers/recordController');

// Existing routes
router.post('/', createRecord);
router.get('/search', searchRecords);
router.put('/:id', updateRecord);

 router.delete('/', deleteAllRecords);      // Delete all records
router.delete('/:id', deleteRecord);       // Delete a single record by ID

module.exports = router;
