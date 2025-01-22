// server/controllers/recordController.js
const Record = require('../models/Record');

 exports.createRecord = async (req, res) => {
  try {
    // 1) Check if name is already taken
    const existingName = await Record.findOne({ name: req.body.name });
    if (existingName) {
      return res.status(400).json({ message: "Name is already in use." });
    }

    // 2) Check if email is already taken
    const existingEmail = await Record.findOne({ email: req.body.email });
    if (existingEmail) {
      return res.status(400).json({ message: "Email is already in use." });
    }

    // If both checks pass, create the new record
    const record = new Record(req.body);
    await record.save();
    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET all records
exports.getAllRecords = async (req, res) => {
  try {
    const records = await Record.find({});
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// SEARCH records by any combination of fields
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

// UPDATE record (also check unique name and unique email)
exports.updateRecord = async (req, res) => {
  try {
    // 1) Check if name is already taken by another record
    const existingName = await Record.findOne({
      name: req.body.name,
      _id: { $ne: req.params.id }   
    });
    if (existingName) {
      return res.status(400).json({ message: "Name is already in use." });
    }

    // 2) Check if email is already taken by another record
    const existingEmail = await Record.findOne({
      email: req.body.email,
      _id: { $ne: req.params.id }
    });
    if (existingEmail) {
      return res.status(400).json({ message: "Email is already in use." });
    }

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

// DELETE single record
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

// DELETE ALL records
exports.deleteAllRecords = async (req, res) => {
  try {
    await Record.deleteMany({});
    return res.json({ message: 'All records deleted successfully' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
