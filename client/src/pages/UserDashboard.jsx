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
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import DownloadIcon from '@mui/icons-material/Download';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import WorkIcon from '@mui/icons-material/Work';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import ListIcon from '@mui/icons-material/List';

// MUI Autocomplete
import Autocomplete from '@mui/material/Autocomplete';

/**
 * Icon mapping object for InputAdornment.
 */
const iconMapping = {
  customerName: <PersonIcon />,
  userName: <BusinessIcon />,
  designation: <WorkIcon />,
  city: <LocationCityIcon />,
  segmentation: <ListIcon />,
  email: <EmailIcon />,
  phoneNumber: <PhoneIcon />
};

export default function UserDashboard({ role }) {
    // Form fields for creating or updating a record.
   const [formData, setFormData] = useState({
    customerName: '',
    userName: '',
    designation: '',
    city: '',
    segmentation: '',
    email: '',
    phoneNumber: ''
  });

   // The array of records displayed in the table (only after Search or View All).
   const [searchResults, setSearchResults] = useState([]);

  
  //  * Editing state: whether we're editing an existing record.
   const [editing, setEditing] = useState(false);

  
  //  The _id of the record currently being edited.
  
  const [currentRecordId, setCurrentRecordId] = useState(null);

  
   //Modal for displaying success/error/warning messages.
   
  const [modal, setModal] = useState({ open: false, message: '', severity: 'success' });
  const handleCloseModal = () => setModal({ ...modal, open: false });

 
   //* Pagination states: current page and rows per page.
    
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

 
   //"Delete All" confirmation dialog for admin.
    
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const handleOpenDeleteAll = () => setDeleteAllOpen(true);
  const handleCloseDeleteAll = () => setDeleteAllOpen(false);

  
   //"Delete single row" confirmation dialog.
   
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

   
   //All records (fetched once on mount, for autocomplete suggestions).
  
  const [allRecords, setAllRecords] = useState([]);

  
   // Autocomplete suggestions for customerName and userName.
    
  const [customerNameSuggestions, setCustomerNameSuggestions] = useState([]);
  const [userNameSuggestions, setUserNameSuggestions] = useState([]);

  /**
   * On mount: fetch ALL records for local suggestions only (don't show them in the table).
   * We store them in `allRecords` and localStorage, but do NOT set `searchResults`.
   * This ensures the table is initially empty (hidden) until the user searches or admin clicks "View All".
   */
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

   // Whenever allRecords changes, keep it in localStorage for autocomplete usage.
  useEffect(() => {
    localStorage.setItem('allRecords', JSON.stringify(allRecords));
  }, [allRecords]);

  /**
   * Create or Update a record.
   */
  const handleSubmit = async () => {
    // Basic validations (client-side).
    const nameRegex = /^[A-Za-z\s]+$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // phone format "XXX-XXX-XXXX"
    const phoneRegex = /^\d{3}-\d{3}-\d{4}$/;

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

    // Attempt to save or update.
    try {
      if (editing && currentRecordId) {
        // Update existing record.
        await axios.put(`http://localhost:4000/api/records/${currentRecordId}`, formData);
        setModal({ open: true, message: 'Record updated successfully!', severity: 'success' });
      } else {
        // Create new record.
        await axios.post('http://localhost:4000/api/records', formData);
        setModal({ open: true, message: 'Record saved successfully!', severity: 'success' });
      }

      // Reset form & editing state.
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
      // Build query from non-empty form fields.
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
      // Show them in the table
      setSearchResults(data);
      // Also store them for suggestions if needed (optional).
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

   
  const handleConfirmDeleteAll = async () => {
    try {
      await axios.delete('http://localhost:4000/api/records');
      // Clear table, suggestions
      setSearchResults([]);
      setAllRecords([]);
      setModal({ open: true, message: 'All records deleted successfully!', severity: 'success' });
    } catch (error) {
      setModal({
        open: true,
        message: 'Error deleting all records: ' + (error.response?.data?.message || error.message),
        severity: 'error'
      });
    } finally {
      setDeleteAllOpen(false);
    }
  };

  
  const handleDownload = () => {
    if (!searchResults || searchResults.length === 0) {
      setModal({ open: true, message: 'No data to download.', severity: 'warning' });
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(searchResults);
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
    <Container maxWidth="xl" sx={{ marginTop: '-1rem', overflow: 'hidden', marginLeft: '-20px' , height: 'auto'}}>
      <Box display="flex" gap="1%">
        {/* Left Panel: Contacts Entry Form */}
        <Box width="27%">
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <Paper
              elevation={6}
              sx={{
                padding: '1.2rem',
                borderRadius: '0px',
                background: 'rgba(255,255,255,0.85)',
                border: '1px solid rgba(0,0,0,0.1)'
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Contacts Entry Form
              </Typography>

              {/* Customer Name Autocomplete */}
              <Autocomplete
                freeSolo
                options={customerNameSuggestions}
                getOptionLabel={(option) => option}
                value={formData.customerName}
                onInputChange={handleCustomerNameInputChange}
                onChange={(event, newValue) => {
                  // If user selects from dropdown, set it
                  setFormData((prev) => ({ ...prev, customerName: newValue || '' }));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Customer Name"
                    margin="normal"
                    fullWidth
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
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
                onChange={(event, newValue) => {
                  setFormData((prev) => ({ ...prev, userName: newValue || '' }));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="User Name"
                    margin="normal"
                    fullWidth
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
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
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
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
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
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
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
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
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      {iconMapping.email}
                    </InputAdornment>
                  )
                }}
              />

              {/* Phone Number */}
              <TextField
                label="Phone Number (XXX-XXX-XXXX)"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                fullWidth
                margin="normal"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      {iconMapping.phoneNumber}
                    </InputAdornment>
                  )
                }}
              />

              {/* Action Buttons */}
              <Box mt={2} display="flex" gap={2}>
                <Button
                  size="small"
                  variant="contained"
                  color="primary"
                  onClick={handleSubmit}
                  sx={{
                    textTransform: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    fontWeight: 'bold'
                  }}
                >
                  {editing ? 'Update' : 'Save'}
                </Button>

                <Button
                  size="small"
                  variant="contained"
                  color="secondary"
                  onClick={handleSearch}
                  sx={{
                    textTransform: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    fontWeight: 'bold'
                  }}
                >
                  Search
                </Button>

                {/* "View All" only for Admin */}
                {role === 'admin' && (
                  <Button
                    size="small"
                    variant="contained"
                    color="primary"
                    onClick={handleViewAll}
                    startIcon={<PeopleIcon />}
                    sx={{
                      textTransform: 'none',
                      padding: '0.2rem 1rem',
                      borderRadius: '8px',
                      fontWeight: 'bold'
                    }}
                  >
                    View All
                  </Button>
                )}
              </Box>

              <Box display="flex" justifyContent="flex-end" mt={2}>
                <Typography variant="body2" color="red">
                  All fields are required to save a record.
                </Typography>
              </Box>
            </Paper>
          </motion.div>
        </Box>

        {/* Right Panel: Search Results (table appears only if we have data) */}
        <Box width="70%" sx={{ marginLeft: '0', marginRight: '30x' }}>
        {searchResults.length > 0 && (
            <Paper
              elevation={6}
              sx={{
                // height: 'auto',
                marginRight: '-48px',
                marginTop: '-1rem',
                padding: '0.6rem',
                borderRadius: '0px',
                border: '1px solid rgba(0,0,0,0.1)'
              }}
            >
              {/* Top row with Title and buttons */}
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
                sx={{ position: 'sticky', top: 0, background: 'inherit', zIndex: 1, pb: 1 }}
              >
                <Typography variant="h6" sx={{ fontWeight: 'bold', marginTop: '18px' }}>
                  Search Results
                </Typography>
                <Box>
                  {/* Delete All Button (Admin only) */}
                  {role === 'admin' && (
                    <IconButton size="small" onClick={handleOpenDeleteAll} sx={{ mr: 1 }}>
                      <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
                        <DeleteSweepIcon color="error" />
                      </motion.div>
                    </IconButton>
                  )}

                  {/* Download Excel (Admin only) */}
                  {role === 'admin' && (
                    <Button
                      size="small"
                      variant="contained"
                      color="primary"
                      onClick={handleDownload}
                      startIcon={<DownloadIcon />}
                      sx={{
                        textTransform: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        mr: 1
                      }}
                    >
                      Download To Excel
                    </Button>
                  )}

                  {/* Clear Search Results */}
                  <IconButton size="small" onClick={() => setSearchResults([])}>
                    <CancelIcon />
                  </IconButton>
                </Box>
              </Box>

              {/* Table of results */}
              <TableContainer sx={{ maxHeight: '100vh', overflowY: 'auto' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <strong>Edit</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Delete</strong>
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
                        <strong>Phone Number</strong>
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {currentTableData.map((record) => (
                      <TableRow key={record._id} sx={{ height: '5px' }}>
                        {/* Edit */}
                        <TableCell>
                          <IconButton size="small" onClick={() => handleEdit(record)}>
                            <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
                              <EditIcon />
                            </motion.div>
                          </IconButton>
                        </TableCell>

                        {/* Delete */}
                        <TableCell>
                          <IconButton size="small" onClick={() => handleDeleteRowClick(record)}>
                            <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
                              <DeleteIcon color="error" />
                            </motion.div>
                          </IconButton>
                        </TableCell>

                        {/* Unique ID */}
                        <TableCell>{record.uniqueId}</TableCell>

                        {/* Customer Name */}
                        <TableCell>{record.customerName}</TableCell>

                        {/* User Name */}
                        <TableCell>{record.userName}</TableCell>

                        {/* Designation */}
                        <TableCell>{record.designation}</TableCell>

                        {/* City */}
                        <TableCell>{record.city}</TableCell>

                        {/* Segmentation */}
                        <TableCell>{record.segmentation}</TableCell>

                        {/* Email */}
                        <TableCell>{record.email}</TableCell>

                        {/* Phone Number */}
                        <TableCell>{record.phoneNumber}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Pagination at bottom-right */}
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

      {/* Confirmation dialog for "Delete All" */}
      <Dialog open={deleteAllOpen} onClose={handleCloseDeleteAll} maxWidth="xs">
        <DialogTitle>Confirm Delete All</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete all records?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteAll} autoFocus>No</Button>
          <Button onClick={handleConfirmDeleteAll} color="error">
            Yes, Delete All
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
