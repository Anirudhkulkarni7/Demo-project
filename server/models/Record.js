const mongoose = require('mongoose');

const recordSchema = new mongoose.Schema({
  companyName: { // Renamed from customerName
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  designation: { 
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  segmentation: {
    type: String,
    enum: ['LE', 'MM', 'SB', 'ACQ'],
    required: true
  },
  uniqueId: {
    type: Number,
    unique: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
},
{ versionKey: false });

module.exports = mongoose.model('Record', recordSchema);
