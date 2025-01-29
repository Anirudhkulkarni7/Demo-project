const Record = require('../models/Record');

/**
 * Helper function to get the next auto-incremented ID.
 * Starts at 1234 if no records exist yet.
 */
async function getNextUniqueId() {
  // Find the record with the highest uniqueId so far
  const lastRecord = await Record.findOne({})
    .sort({ uniqueId: -1 })
    .lean();

  if (!lastRecord || !lastRecord.uniqueId) {
    return 1234; // Starting number if no records found
  }
  return lastRecord.uniqueId + 1;
}

// CREATE a new record
exports.createRecord = async (req, res) => {
  try {
    // 1) Check if customerName is already used by a non-deleted record (if you want uniqueness by name)
    const existingCustomer = await Record.findOne({
      customerName: req.body.customerName,
      isDeleted: false
    });
    if (existingCustomer) {
      return res.status(400).json({ message: 'Customer Name is already in use.' });
    }

    // 2) Check if email is already taken by a non-deleted record
    const existingEmail = await Record.findOne({
      email: req.body.email,
      isDeleted: false
    });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email is already in use.' });
    }

    // Get next auto-incremented ID
    const newUniqueId = await getNextUniqueId();

    // Create the new record with that uniqueId
    const record = new Record({
      ...req.body,
      uniqueId: newUniqueId
    });
    await record.save();

    res.status(201).json(record);
  } catch (err) {
    return res.status(500).json({ message: err.message });
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

// SEARCH records by any combination of fields (return not-deleted).
// But for customerName and userName, do partial matches via $regex.
exports.searchRecords = async (req, res) => {
  try {
    const query = { isDeleted: false };

    // Partial match for customerName
    if (req.query.customerName) {
      query.customerName = { $regex: req.query.customerName, $options: 'i' };
    }
    // Partial match for userName
    if (req.query.userName) {
      query.userName = { $regex: req.query.userName, $options: 'i' };
    }

    // Exact matches for other fields if present
    ['designation', 'email', 'phoneNumber', 'city', 'segmentation'].forEach(field => {
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

// UPDATE record (check unique constraints)
exports.updateRecord = async (req, res) => {
  try {
    // Check if the new customerName is already used by a different record
    const existingCustomer = await Record.findOne({
      customerName: req.body.customerName,
      _id: { $ne: req.params.id },
      isDeleted: false
    });
    if (existingCustomer) {
      return res.status(400).json({ message: 'Customer Name is already in use.' });
    }

    // Check if new email is already used by a different record
    const existingEmail = await Record.findOne({
      email: req.body.email,
      _id: { $ne: req.params.id },
      isDeleted: false
    });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email is already in use.' });
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

// SOFT DELETE single record
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

/**
 * OPTIONAL: Provide suggestions for companyName (customerName) as user types
 * e.g., GET /api/records/suggestions/customerName?q=sha
 */
exports.suggestCustomerNames = async (req, res) => {
  try {
    const searchTerm = req.query.q || '';
    if (!searchTerm) {
      // If empty query, return empty or entire distinct list, your call
      return res.json([]);
    }

    // Find all matching partial (case-insensitive)
    const matches = await Record.find({
      isDeleted: false,
      customerName: { $regex: searchTerm, $options: 'i' }
    }).distinct('customerName');

    res.json(matches);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * OPTIONAL: Provide suggestions for userName
 * e.g., GET /api/records/suggestions/userName?q=jo
 */
exports.suggestUserNames = async (req, res) => {
  try {
    const searchTerm = req.query.q || '';
    if (!searchTerm) {
      return res.json([]);
    }

    const matches = await Record.find({
      isDeleted: false,
      userName: { $regex: searchTerm, $options: 'i' }
    }).distinct('userName');

    res.json(matches);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
