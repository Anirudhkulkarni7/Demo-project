const Record = require('../models/Record');

/**
 * Utility function to get the next unique ID.
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

/**
 * CREATE a new record
 */
exports.createRecord = async (req, res) => {
  try {
    const { customerName, userName, email } = req.body;

    // Ensure uniqueness for customerName + userName combination
    const existingRecord = await Record.findOne({
      customerName: customerName,
      userName: userName,
      isDeleted: false
    });

    if (existingRecord) {
      return res.status(400).json({ message: 'This customer name and user name combination already exists.' });
    }

    // Ensure uniqueness for email
    const existingEmail = await Record.findOne({
      email: email,
      isDeleted: false
    });

    if (existingEmail) {
      return res.status(400).json({ message: 'Email is already in use.' });
    }

    // Get next auto-incremented ID
    const newUniqueId = await getNextUniqueId();

    // Create the new record
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

/**
 * GET all records (only those not deleted)
 */
exports.getAllRecords = async (req, res) => {
  try {
    const records = await Record.find({ isDeleted: false });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * SEARCH records by any combination of fields (return not-deleted).
 * Partial matches for customerName and userName via $regex.
 */
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

/**
 * UPDATE record (check unique constraints for customerName + userName and email)
 */
exports.updateRecord = async (req, res) => {
  try {
    const { customerName, userName, email } = req.body;
    const recordId = req.params.id;

    // Ensure that the combination of customerName and userName is unique, excluding current record
    const existingCombination = await Record.findOne({
      customerName: customerName,
      userName: userName,
      _id: { $ne: recordId },
      isDeleted: false
    });

    if (existingCombination) {
      return res.status(400).json({ message: 'This customer name and user name combination already exists.' });
    }

    // Ensure uniqueness for email, excluding current record
    const existingEmail = await Record.findOne({
      email: email,
      _id: { $ne: recordId },
      isDeleted: false
    });

    if (existingEmail) {
      return res.status(400).json({ message: 'Email is already in use.' });
    }

    // Find and update the record
    const record = await Record.findByIdAndUpdate(
      recordId,
      req.body,
      { new: true }
    );

    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    res.json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * SOFT DELETE single record
 */
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

/**
 * SOFT DELETE ALL records
 */
exports.deleteAllRecords = async (req, res) => {
  try {
    await Record.updateMany({}, { $set: { isDeleted: true } });
    return res.json({ message: 'All records soft-deleted successfully' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * OPTIONAL: Provide suggestions for customerName as user types
 * e.g., GET /api/records/suggestions/customerName?q=sha
 */
exports.suggestCustomerNames = async (req, res) => {
  try {
    const searchTerm = req.query.q || '';
    if (!searchTerm) {
      // If empty query, return empty array or distinct list as per your requirement
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
