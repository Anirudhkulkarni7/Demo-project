const Record = require('../models/Record');

// CREATE a new record (with checks for unique fields)
exports.createRecord = async (req, res) => {
  try {
    // 1) Check if customerName is already used by a non-deleted record (if you want unique by name)
    const existingCustomer = await Record.findOne({
      customerName: req.body.customerName,
      isDeleted: false
    });
    if (existingCustomer) {
      return res.status(400).json({ message: "Customer Name is already in use." });
    }

    // 2) Check if email is already taken by a non-deleted record
    const existingEmail = await Record.findOne({
      email: req.body.email,
      isDeleted: false
    });
    if (existingEmail) {
      return res.status(400).json({ message: "Email is already in use." });
    }

    // If checks pass, create the new record
    const record = new Record(req.body);
    await record.save();

    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET all records (only those not deleted)
exports.getAllRecords = async (req, res) => {
  try {
    const records = await Record.find({ isDeleted: false });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// SEARCH records by any combination of fields (also only return not-deleted)
exports.searchRecords = async (req, res) => {
  try {
    const query = { isDeleted: false }; 
    ['customerName', 'userName', 'designation', 'email', 'phoneNumber', 'city', 'segmentation'].forEach(field => {
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

// UPDATE record (check unique customerName and unique email among non-deleted docs)
exports.updateRecord = async (req, res) => {
  try {
    // Check if the new customerName is already used by a different record
    const existingCustomer = await Record.findOne({
      customerName: req.body.customerName,
      _id: { $ne: req.params.id },
      isDeleted: false
    });
    if (existingCustomer) {
      return res.status(400).json({ message: "Customer Name is already in use." });
    }

    // Check if new email is already used by a different record
    const existingEmail = await Record.findOne({
      email: req.body.email,
      _id: { $ne: req.params.id },
      isDeleted: false
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

// SOFT DELETE single record (instead of removing from DB, set isDeleted=true)
exports.deleteRecord = async (req, res) => {
  try {
    const record = await Record.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    record.isDeleted = true;
    await record.save();

    return res.json({ message: 'Record soft-deleted successfully' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// SOFT DELETE ALL records
exports.deleteAllRecords = async (req, res) => {
  try {
    await Record.updateMany({}, { $set: { isDeleted: true } });
    return res.json({ message: 'All records soft-deleted successfully' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
