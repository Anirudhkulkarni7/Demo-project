// server/routes/recordRoutes.js
const express = require('express');
const router = express.Router();
const {
  createRecord,
  getAllRecords,
  searchRecords,
  updateRecord,
  deleteRecord,
  deleteAllRecords
} = require('../controllers/recordController');

// GET all records
router.get('/', getAllRecords);

// GET search (by query params)
router.get('/search', searchRecords);

// POST new record
router.post('/', createRecord);

// PUT update record
router.put('/:id', updateRecord);

// DELETE all records
router.delete('/', deleteAllRecords);

// DELETE single record
router.delete('/:id', deleteRecord);

module.exports = router;
