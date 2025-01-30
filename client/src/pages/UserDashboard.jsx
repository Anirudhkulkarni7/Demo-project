import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  Pagination,
  MenuItem
} from '@mui/material';
import { motion } from 'framer-motion';
import axios from 'axios';
import * as XLSX from 'xlsx';

import EditIcon from '@mui/icons-material/Edit';
import CancelIcon from '@mui/icons-material/Cancel';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import WorkIcon from '@mui/icons-material/Work';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
// CHANGED: using a "Map" icon for city
import MapIcon from '@mui/icons-material/Map';
import ListIcon from '@mui/icons-material/List';

import Autocomplete from '@mui/material/Autocomplete';

const iconMapping = {
  customerName: <PersonIcon />,
  userName: <BusinessIcon />,
  designation: <WorkIcon />,
  // CHANGED: city icon now MapIcon
  city: <MapIcon />,
  segmentation: <ListIcon />,
  email: <EmailIcon />,
  phoneNumber: <PhoneIcon />
};

export default function UserDashboard({ role }) {
  const [formData, setFormData] = useState({
    customerName: '',
    userName: '',
    designation: '',
    city: '',
    segmentation: '',
    email: '',
    phoneNumber: ''
  });

  const [searchResults, setSearchResults] = useState([]);
  const [editing, setEditing] = useState(false);
  const [currentRecordId, setCurrentRecordId] = useState(null);

  const [modal, setModal] = useState({ open: false, message: '', severity: 'success' });
  const handleCloseModal = () => setModal({ ...modal, open: false });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 9;

  // Delete row dialog
  const [deleteRowOpen, setDeleteRowOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const handleDeleteRowClick = (record) => {
    setRecordToDelete(record);
    setDeleteRowOpen(true);
  };
  const handleCloseDeleteRow = () => {
    setDeleteRowOpen(false);
    setRecordToDelete(null);
  };

  // All records (for autocomplete suggestions)
  const [allRecords, setAllRecords] = useState([]);
  const [customerNameSuggestions, setCustomerNameSuggestions] = useState([]);
  const [userNameSuggestions, setUserNameSuggestions] = useState([]);

  useEffect(() => {
    const fetchAllRecordsForSuggestions = async () => {
      try {
        const { data } = await axios.get('http://localhost:4000/api/records');
        setAllRecords(data);
        localStorage.setItem('allRecords', JSON.stringify(data));
      } catch (error) {
        console.error('Error fetching records for suggestions', error);
      }
    };
    fetchAllRecordsForSuggestions();
  }, []);

  useEffect(() => {
    localStorage.setItem('allRecords', JSON.stringify(allRecords));
  }, [allRecords]);

  /**
   * Handle phone input so that:
   * - Only digits are allowed.
   * - No more than 10 digits.
   * - Format with dashes automatically: xxx-xxx-xxxx.
   */
  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, ''); // remove non-digits
    if (value.length > 10) {
      value = value.slice(0, 10);
    }
    // Insert dashes as user types
    if (value.length >= 7) {
      value = value.replace(/(\d{3})(\d{3})(\d{1,4})/, '$1-$2-$3');
    } else if (value.length >= 4) {
      value = value.replace(/(\d{3})(\d{1,3})/, '$1-$2');
    }
    setFormData((prev) => ({ ...prev, phoneNumber: value }));
  };

  /**
   * Create or Update a record.
   */
  const handleSubmit = async () => {
    // Basic validations
    const nameRegex = /^[A-Za-z\s]+$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\d{3}-\d{3}-\d{4}$/; // final format after dashes

    if (!formData.customerName || !nameRegex.test(formData.customerName)) {
      setModal({ open: true, message: 'Invalid Customer Name (letters/spaces only).', severity: 'error' });
      return;
    }
    if (!formData.userName || !nameRegex.test(formData.userName)) {
      setModal({ open: true, message: 'Invalid User Name (letters/spaces only).', severity: 'error' });
      return;
    }
    if (!formData.designation || !nameRegex.test(formData.designation)) {
      setModal({ open: true, message: 'Invalid Designation (letters/spaces only).', severity: 'error' });
      return;
    }
    if (!formData.city || !nameRegex.test(formData.city)) {
      setModal({ open: true, message: 'Invalid City (letters/spaces only).', severity: 'error' });
      return;
    }
    if (!formData.segmentation) {
      setModal({ open: true, message: 'Please select a segmentation.', severity: 'error' });
      return;
    }
    if (!formData.email || !emailRegex.test(formData.email)) {
      setModal({ open: true, message: 'Invalid Email.', severity: 'error' });
      return;
    }
    if (!formData.phoneNumber || !phoneRegex.test(formData.phoneNumber)) {
      setModal({
        open: true,
        message: 'Invalid phone number. Expected format: XXX-XXX-XXXX.',
        severity: 'error'
      });
      return;
    }

    try {
      if (editing && currentRecordId) {
        await axios.put(`http://localhost:4000/api/records/${currentRecordId}`, formData);
        setModal({ open: true, message: 'Record updated successfully!', severity: 'success' });
      } else {
        await axios.post('http://localhost:4000/api/records', formData);
        setModal({ open: true, message: 'Record saved successfully!', severity: 'success' });
      }

      // Reset form
      setFormData({
        customerName: '',
        userName: '',
        designation: '',
        city: '',
        segmentation: '',
        email: '',
        phoneNumber: ''
      });
      setEditing(false);
      setCurrentRecordId(null);

      // Refresh table if it's visible
      if (searchResults.length > 0) {
        if (role === 'admin') {
          handleViewAll();
        } else {
          handleSearch();
        }
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      setModal({
        open: true,
        message: 'Error saving record: ' + errorMsg,
        severity: 'error'
      });
    }
  };

  const handleSearch = async () => {
    try {
      const nonEmptyData = Object.entries(formData)
        .filter(([_, value]) => value !== '')
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

      if (Object.keys(nonEmptyData).length === 0) {
        setModal({ open: true, message: 'Please enter at least one field to search.', severity: 'warning' });
        return;
      }

      const queryString = new URLSearchParams(nonEmptyData).toString();
      const { data } = await axios.get(`http://localhost:4000/api/records/search?${queryString}`);

      if (!data || data.length === 0) {
        setModal({ open: true, message: 'No matching records found!', severity: 'info' });
        setSearchResults([]);
      } else {
        setSearchResults(data);
      }
      setCurrentPage(1);
    } catch (error) {
      setModal({
        open: true,
        message: 'Error searching records: ' + (error.response?.data?.message || error.message),
        severity: 'error'
      });
    }
  };

  const handleViewAll = async () => {
    try {
      const { data } = await axios.get('http://localhost:4000/api/records');
      if (!data || data.length === 0) {
        setModal({ open: true, message: 'No users found!', severity: 'info' });
      }
      setSearchResults(data);
      setAllRecords(data);
      setCurrentPage(1);
    } catch (error) {
      setModal({
        open: true,
        message: 'Error retrieving all records: ' + (error.response?.data?.message || error.message),
        severity: 'error'
      });
    }
  };

  const handleEdit = (record) => {
    setFormData({
      customerName: record.customerName,
      userName: record.userName,
      designation: record.designation,
      city: record.city,
      segmentation: record.segmentation,
      email: record.email,
      phoneNumber: record.phoneNumber
    });
    setEditing(true);
    setCurrentRecordId(record._id);
    setModal({ open: true, message: 'You can now edit the selected record.', severity: 'info' });
  };

  const handleConfirmDeleteRow = async () => {
    if (recordToDelete) {
      try {
        await axios.delete(`http://localhost:4000/api/records/${recordToDelete._id}`);
        setSearchResults((prev) => prev.filter((item) => item._id !== recordToDelete._id));
        setAllRecords((prev) => prev.filter((item) => item._id !== recordToDelete._id));
        setModal({ open: true, message: 'Record deleted successfully!', severity: 'success' });
      } catch (error) {
        setModal({
          open: true,
          message: 'Error deleting record: ' + (error.response?.data?.message || error.message),
          severity: 'error'
        });
      } finally {
        handleCloseDeleteRow();
      }
    }
  };

  const handleDownload = () => {
    if (!searchResults || searchResults.length === 0) {
      setModal({ open: true, message: 'No data to download.', severity: 'warning' });
      return;
    }
    const dataForExcel = searchResults.map((record) => ({
      'Unique ID': record.uniqueId,
      'Customer Name': record.customerName,
      'User Name': record.userName,
      'Designation': record.designation,
      'City': record.city,
      'Segmentation': record.segmentation,
      'Email': record.email,
      'Phone Number': record.phoneNumber
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'SearchResults');
    XLSX.writeFile(workbook, 'SearchResults.xlsx');
    setModal({ open: true, message: 'Search results downloaded successfully!', severity: 'success' });
  };

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  const totalPages = Math.ceil(searchResults.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentTableData = useMemo(() => {
    return searchResults.slice(startIndex, endIndex);
  }, [searchResults, startIndex, endIndex]);

  const filterCustomerNameSuggestions = useCallback((input) => {
    if (!input) return [];
    const data = JSON.parse(localStorage.getItem('allRecords')) || [];
    const distinctNames = [...new Set(data.map((r) => r.customerName))];
    return distinctNames.filter((name) =>
      name.toLowerCase().includes(input.toLowerCase())
    );
  }, []);

  const filterUserNameSuggestions = useCallback((input) => {
    if (!input) return [];
    const data = JSON.parse(localStorage.getItem('allRecords')) || [];
    const distinctUserNames = [...new Set(data.map((r) => r.userName))];
    return distinctUserNames.filter((uname) =>
      uname.toLowerCase().includes(input.toLowerCase())
    );
  }, []);

  const handleCustomerNameInputChange = (event, newInputValue) => {
    setFormData((prev) => ({ ...prev, customerName: newInputValue }));
    const suggestions = filterCustomerNameSuggestions(newInputValue);
    setCustomerNameSuggestions(suggestions);
  };

  const handleUserNameInputChange = (event, newInputValue) => {
    setFormData((prev) => ({ ...prev, userName: newInputValue }));
    const suggestions = filterUserNameSuggestions(newInputValue);
    setUserNameSuggestions(suggestions);
  };

  return (
    <Container maxWidth="xl" sx={{ marginTop: '-1rem', overflow: 'hidden', marginLeft: '-20px', height: 'auto' }}>
      <Box display="flex" gap="1%" sx={{ height: '100%' }}>
        {/* Left Panel: Contacts Entry Form */}
        <Box width="22%" sx={{ height: '100%', pr: 1 }}>
          <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <Paper elevation={6} sx={{ p: 1, background: 'rgba(255,255,255,0.85)' }}>
              {/* Customer Name Autocomplete */}
              <Autocomplete
                freeSolo
                options={customerNameSuggestions}
                getOptionLabel={(option) => option}
                value={formData.customerName}
                onInputChange={handleCustomerNameInputChange}
                size="small"
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Customer Name"
                    margin="normal"
                    fullWidth
                    InputProps={{
                      ...params.InputProps,
                      sx: { height: 40 },
                      startAdornment: (
                        <InputAdornment position="start" sx={{ mr: 0.5 }}>
                          {iconMapping.customerName}
                        </InputAdornment>
                      )
                    }}
                  />
                )}
              />

              {/* User Name Autocomplete */}
              <Autocomplete
                freeSolo
                options={userNameSuggestions}
                getOptionLabel={(option) => option}
                value={formData.userName}
                onInputChange={handleUserNameInputChange}
                size="small"
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="User Name"
                    margin="normal"
                    fullWidth
                    InputProps={{
                      ...params.InputProps,
                      sx: { height: 40 },
                      startAdornment: (
                        <InputAdornment position="start" sx={{ mr: 0.5 }}>
                          {iconMapping.userName}
                        </InputAdornment>
                      )
                    }}
                  />
                )}
              />

              {/* Designation */}
              <TextField
                label="Designation"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                fullWidth
                margin="normal"
                size="small"
                InputProps={{
                  sx: { height: 40 },
                  startAdornment: (
                    <InputAdornment position="start" sx={{ mr: 0.5 }}>
                      {iconMapping.designation}
                    </InputAdornment>
                  )
                }}
              />

              {/* City */}
              <TextField
                label="City"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                fullWidth
                margin="normal"
                size="small"
                InputProps={{
                  sx: { height: 40 },
                  startAdornment: (
                    <InputAdornment position="start" sx={{ mr: 0.5 }}>
                      {iconMapping.city}
                    </InputAdornment>
                  )
                }}
              />

              {/* Segmentation (Dropdown) */}
              <TextField
                select
                label="Segmentation"
                value={formData.segmentation}
                onChange={(e) => setFormData({ ...formData, segmentation: e.target.value })}
                fullWidth
                margin="normal"
                size="small"
                InputProps={{
                  sx: { height: 40 },
                  startAdornment: (
                    <InputAdornment position="start" sx={{ mr: 0.5 }}>
                      {iconMapping.segmentation}
                    </InputAdornment>
                  )
                }}
              >
                <MenuItem value="LE">LE (Large Enterprise)</MenuItem>
                <MenuItem value="MM">MM (Mid Market)</MenuItem>
                <MenuItem value="SB">SB (Small Business)</MenuItem>
                <MenuItem value="ACQ">ACQ (Acquisition)</MenuItem>
              </TextField>

              {/* Email */}
              <TextField
                label="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                fullWidth
                margin="normal"
                size="small"
                InputProps={{
                  sx: { height: 40 },
                  startAdornment: (
                    <InputAdornment position="start" sx={{ mr: 0.5 }}>
                      {iconMapping.email}
                    </InputAdornment>
                  )
                }}
              />

              {/* Phone Number (auto-format) */}
              <TextField
                label="Phone Number"
                value={formData.phoneNumber}
                onChange={handlePhoneChange}
                fullWidth
                margin="normal"
                size="small"
                placeholder="123-456-7890"
                InputProps={{
                  sx: { height: 40 },
                  startAdornment: (
                    <InputAdornment position="start" sx={{ mr: 0.5 }}>
                      {iconMapping.phoneNumber}
                    </InputAdornment>
                  )
                }}
              />

              {/* Action Buttons */}
              <Box mt={1} display="flex" gap={1} flexWrap="wrap">
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSubmit}
                  size="small"
                  sx={{
                    minWidth: 80,
                    py: 0.5,
                    fontSize: '0.75rem',
                    textTransform: 'none'
                  }}
                >
                  {editing ? 'Update' : 'Save'}
                </Button>

                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleSearch}
                  size="small"
                  sx={{
                    minWidth: 80,
                    py: 0.5,
                    fontSize: '0.75rem',
                    textTransform: 'none'
                  }}
                >
                  Search
                </Button>

                {role === 'admin' && (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleViewAll}
                    size="small"
                    startIcon={<PeopleIcon sx={{ fontSize: 16 }} />}
                    sx={{
                      minWidth: 100,
                      py: 0.5,
                      fontSize: '0.75rem',
                      textTransform: 'none'
                    }}
                  >
                    View All
                  </Button>
                )}
              </Box>

              <Box mt={1}>
                <Typography variant="caption" color="error">
                  All fields are required to save a record.
                </Typography>
              </Box>
            </Paper>
          </motion.div>
        </Box>

        {/* Right Panel: Search Results Table */}
        <Box width="70%" sx={{ marginLeft: '0', marginRight: '0' }}>
          {searchResults.length > 0 && (
            <Paper
              elevation={6}
              sx={{
                marginRight: '-12%',
                marginTop: '-1rem',
                padding: '0.2rem',
                borderRadius: '0px',
                border: '2px solid rgba(0, 0, 0, 0.1)'
              }}
            >
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={1}
                sx={{ position: 'sticky', top: 0, background: 'inherit', zIndex: 1, pb: 1 }}
              >
                <Typography variant="h6" sx={{ fontWeight: 'bold', marginTop: '8px' ,marginLeft: '10px'}}>
                  Search Results
                </Typography>
                <Box>
                  {role === 'admin' && (
                    <Button
                      size="small"
                      variant="contained"
                      color="primary"
                      onClick={handleDownload}
                      startIcon={<DownloadIcon sx={{ fontSize: 16 }} />}
                      sx={{
                        marginTop: '8px',
                        minWidth: 100,
                        py: 0.5,
                        fontSize: '0.75rem',
                        textTransform: 'none',
                        fontWeight: 'bold',
                        mr: 1
                      }}
                    >
                      Download To Excel
                    </Button>
                  )}
                  <IconButton
                    size="small"
                    onClick={() => setSearchResults([])}
                    sx={{ marginTop: '0px', marginLeft: '10px' }}
                  >
                    <CancelIcon />
                  </IconButton>
                </Box>
              </Box>

              <TableContainer sx={{ maxHeight: '100vh', overflowY: 'auto', overflowX: 'auto' }}>
                <Table
                  size="small"
                  stickyHeader
                  sx={{
                    // REDUCED ROW HEIGHT
                    '& .MuiTableCell-root': {
                      padding: '3px 7px', // reduce cell padding
                      fontSize: '0.85rem'
                    }
                  }}
                >
                  <TableHead>
                    <TableRow>
                      {/* Single Actions Column (sticky) */}
                      <TableCell
                        sx={{
                          position: 'sticky',
                          left: 0,
                          background: 'white',
                          zIndex: 3,
                          minWidth: '70px',
                          textAlign: 'center'
                        }}
                      >
                        <strong>Actions</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Unique ID</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Customer Name</strong>
                      </TableCell>
                      <TableCell>
                        <strong>User Name</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Designation</strong>
                      </TableCell>
                      <TableCell>
                        <strong>City</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Segmentation</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Email</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Phone No</strong>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentTableData.map((record) => (
                      <TableRow key={record._id}>
                        {/* Combined Actions Cell */}
                        <TableCell
                          sx={{
                            position: 'sticky',
                            left: 0,
                            background: 'white',
                            zIndex: 1,
                            minWidth: '70px',
                            textAlign: 'center'
                          }}
                        >
                          <IconButton size="small" onClick={() => handleEdit(record)} sx={{ mr: 1 }}>
                            <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
                              <EditIcon fontSize="small" />
                            </motion.div>
                          </IconButton>
                          <IconButton size="small" onClick={() => handleDeleteRowClick(record)}>
                            <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
                              <DeleteIcon color="error" fontSize="small" />
                            </motion.div>
                          </IconButton>
                        </TableCell>

                        <TableCell>{record.uniqueId}</TableCell>
                        <TableCell>{record.customerName}</TableCell>
                        <TableCell>{record.userName}</TableCell>
                        <TableCell>{record.designation}</TableCell>
                        <TableCell>{record.city}</TableCell>
                        <TableCell>{record.segmentation}</TableCell>
                        <TableCell>{record.email}</TableCell>
                        <TableCell>{record.phoneNumber}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box display="flex" justifyContent="flex-end" mt={2}>
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={handlePageChange}
                  color="primary"
                  size="small"
                />
              </Box>
            </Paper>
          )}
        </Box>
      </Box>

      {/* Popup dialog for messages */}
      <Dialog open={modal.open} onClose={handleCloseModal} maxWidth="xs">
        <DialogTitle>
          {modal.severity.charAt(0).toUpperCase() + modal.severity.slice(1)}
        </DialogTitle>
        <DialogContent>
          <Typography>{modal.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} autoFocus>
            OK
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation dialog for row-level delete */}
      <Dialog open={deleteRowOpen} onClose={handleCloseDeleteRow} maxWidth="xs">
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this user?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteRow} autoFocus>No</Button>
          <Button onClick={handleConfirmDeleteRow} color="error">
            Yes, Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
