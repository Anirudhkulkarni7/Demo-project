// backend/models/Record.js
const mongoose = require('mongoose');

const recordSchema = new mongoose.Schema({
  name: { type: String, required: true },
  companyName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true }
});

module.exports = mongoose.model('Record', recordSchema);
