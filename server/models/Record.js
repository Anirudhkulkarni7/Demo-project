const mongoose = require('mongoose');

const RecordSchema = new mongoose.Schema({
  uniqueId: { type: Number, unique: true },
  customerName: { type: String, required: true }, // Changed from companyName
  userName: { type: String, required: true },
  designation: { type: String, required: true },
  city: { type: String, required: true },
  segmentation: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String, required: true },
  isDeleted: { type: Boolean, default: false }
});

// Compound index for customerName and userName
RecordSchema.index({ customerName: 1, userName: 1 }, { unique: true });

module.exports = mongoose.model('Record', RecordSchema);
