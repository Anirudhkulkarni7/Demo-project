// server/controllers/recordController.js
const Record = require('../models/Record');

exports.createRecord = async (req, res) => {
  try {
    const record = new Record(req.body);
    await record.save();
    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllRecords = async (req, res) => {
  try {
    const records = await Record.find({});
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.searchRecords = async (req, res) => {
  try {
    const query = {};
    ['name', 'companyName', 'email', 'phone'].forEach(field => {
      if (req.query[field]) {
        query[field] = req.query[field];
      }
    });
    const records = await Record.find(query);
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateRecord = async (req, res) => {
  try {
    const record = await Record.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!record) return res.status(404).json({ message: 'Record not found' });
    res.json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.deleteRecord = async (req, res) => {
  try {
    const record = await Record.findByIdAndDelete(req.params.id);
    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }
    return res.json({ message: 'Record deleted successfully' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};


exports.deleteAllRecords = async (req, res) => {
  try {
    await Record.deleteMany({});
    return res.json({ message: 'All records deleted successfully' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};


 