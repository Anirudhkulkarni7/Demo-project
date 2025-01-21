const mongoose = require('mongoose');

 if (mongoose.models.Record) {
  delete mongoose.models.Record;
}

 const recordSchema = new mongoose.Schema({
  name: { type: String, required: true },
  companyName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true }
}, {
  versionKey: false
});

module.exports = mongoose.model('Record', recordSchema);
