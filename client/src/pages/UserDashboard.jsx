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
  TableSortLabel,
  MenuItem
} from '@mui/material';
import { motion } from 'framer-motion';
import axios from 'axios';
import * as XLSX from 'xlsx';

// Icons
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

  // Popups
  const [modal, setModal] = useState({ open: false, message: '', severity: 'success' });
  const handleCloseModal = () => setModal({ ...modal, open: false });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 7;

  // Confirm "Delete All"
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const handleOpenDeleteAll = () => setDeleteAllOpen(true);
  const handleCloseDeleteAll = () => setDeleteAllOpen(false);

  // Confirm row-level delete
  const [deleteRowOpen, setDeleteRowOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);

  // Sorting
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('customerName');

  // We'll also store **allRecords** in state (and localStorage) for local suggestions
  const [allRecords, setAllRecords] = useState([]);
  
  // For on-the-fly autocomplete suggestions
  const [customerNameSuggestions, setCustomerNameSuggestions] = useState([]);
  const [userNameSuggestions, setUserNameSuggestions] = useState([]);

  // Fetch ALL records once on mount -> store in localStorage -> use for suggestions
  useEffect(() => {
    handleViewAll(); // This sets searchResults and also allRecords
  }, []);

  // When allRecords changes, also save to localStorage
  useEffect(() => {
    localStorage.setItem('allRecords', JSON.stringify(allRecords));
  }, [allRecords]);

  // ---------- CREATE / UPDATE ----------
  const handleSubmit = async () => {
    // Basic validations
    const nameRegex = /^[A-Za-z\s]+$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\d{3}-\d{3}-\d{4}$/; // "XXX-XXX-XXXX"

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
        // Update existing
        await axios.put(`http://localhost:4000/api/records/${currentRecordId}`, formData);
        setModal({ open: true, message: 'Record updated successfully!', severity: 'success' });
      } else {
        // Create new
        await axios.post('http://localhost:4000/api/records', formData);
        setModal({ open: true, message: 'Record saved successfully!', severity: 'success' });
      }

      // Reset form & state
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

      // Refresh results & local records
      handleViewAll();
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      setModal({
        open: true,
        message: 'Error saving record: ' + errorMsg,
        severity: 'error'
      });
    }
  };

  // ---------- SEARCH ----------
  const handleSearch = async () => {
    try {
      // Build query from non-empty form fields
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
      }
      setSearchResults(data);
      setCurrentPage(1);
    } catch (error) {
      setModal({
        open: true,
        message: 'Error searching records: ' + (error.response?.data?.message || error.message),
        severity: 'error'
      });
    }
  };

  // ---------- VIEW ALL ----------
  const handleViewAll = async () => {
    // This fetches all (non-deleted) records from the server
    try {
      const { data } = await axios.get('http://localhost:4000/api/records');
      setSearchResults(data);
      setAllRecords(data);
      setCurrentPage(1);

      if (!data || data.length === 0) {
        setModal({ open: true, message: 'No users found!', severity: 'info' });
      }
    } catch (error) {
      setModal({
        open: true,
        message: 'Error retrieving all records: ' + (error.response?.data?.message || error.message),
        severity: 'error'
      });
    }
  };

  // ---------- EDIT ----------
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

  // ---------- DELETE (single) ----------
  const handleDeleteRowClick = (record) => {
    setRecordToDelete(record);
    setDeleteRowOpen(true);
  };
  const handleCloseDeleteRow = () => {
    setDeleteRowOpen(false);
    setRecordToDelete(null);
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

  // ---------- DELETE ALL ----------
  const handleConfirmDeleteAll = async () => {
    try {
      await axios.delete('http://localhost:4000/api/records'); // deletes (soft-deletes) all
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

  // ---------- DOWNLOAD ----------
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

  // ---------- PAGINATION ----------
  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  // ---------- SORTING ----------
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedResults = useMemo(() => {
    const comparator = (a, b) => {
      // Convert to string to handle numbers & strings
      const valA = (a[orderBy] || '').toString().toLowerCase();
      const valB = (b[orderBy] || '').toString().toLowerCase();

      if (valA < valB) return order === 'asc' ? -1 : 1;
      if (valA > valB) return order === 'asc' ? 1 : -1;
      return 0;
    };
    return [...searchResults].sort(comparator);
  }, [searchResults, order, orderBy]);

  const totalPages = Math.ceil(sortedResults.length / rowsPerPage);
  const currentTableData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return sortedResults.slice(startIndex, endIndex);
  }, [sortedResults, currentPage, rowsPerPage]);

  // ---------- LOCAL AUTOCOMPLETE SUGGESTIONS ----------
  // We'll filter from localStorage or from the allRecords state
  const filterCustomerNameSuggestions = useCallback((input) => {
    if (!input) return [];
    // Pull from localStorage OR from allRecords
    const data = JSON.parse(localStorage.getItem('allRecords')) || [];
    // get distinct list of customerNames
    const distinctNames = [...new Set(data.map((r) => r.customerName))];
    // return those that contain the input substring (case-insensitive)
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

  // Whenever user types in `customerName`, we update suggestions
  const handleCustomerNameInputChange = (event, newInputValue) => {
    setFormData((prev) => ({ ...prev, customerName: newInputValue }));
    const suggestions = filterCustomerNameSuggestions(newInputValue);
    setCustomerNameSuggestions(suggestions);
  };

  // Whenever user types in `userName`, we update suggestions
  const handleUserNameInputChange = (event, newInputValue) => {
    setFormData((prev) => ({ ...prev, userName: newInputValue }));
    const suggestions = filterUserNameSuggestions(newInputValue);
    setUserNameSuggestions(suggestions);
  };

  return (
    <Container maxWidth="xl" sx={{ marginTop: '-1rem', overflow: 'hidden' , marginLeft: '-25px'}}>
      <Box display="flex" gap="2%" >
        {/* Left Panel: Contacts Entry Form */}
        <Box width="30%">
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

              {/* Buttons */}
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

        {/* Right Panel: Search Results */}
        <Box width="70%">
          {searchResults.length > 0 && (
            <Paper
              elevation={6}
              sx={{
                marginRight: '-20px',
                marginTop: '-1rem',
                padding: '0.4rem',
                borderRadius: '0px',
                border: '1px solid rgba(0,0,0,0.1)'
              }}
            >
              {/* Top row with Title, Filter/Buttons */}
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
                sx={{ position: 'sticky', top: 0, background: 'inherit', zIndex: 1, pb: 1 }}
              >
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
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

                  {/* Clear search results */}
                  <IconButton size="small" onClick={() => setSearchResults([])}>
                    <CancelIcon />
                  </IconButton>
                </Box>
              </Box>

              {/* Table (10 columns) */}
              <TableContainer sx={{ maxHeight: '65vh', overflowY: 'auto' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      {/* 1) Edit */}
                      <TableCell>
                        <strong>Edit</strong>
                      </TableCell>

                      {/* 2) Delete */}
                      <TableCell>
                        <strong>Delete</strong>
                      </TableCell>

                      {/* 3) Unique ID */}
                      <TableCell sortDirection={orderBy === 'uniqueId' ? order : false}>
                        <TableSortLabel
                          active={orderBy === 'uniqueId'}
                          direction={orderBy === 'uniqueId' ? order : 'asc'}
                          onClick={() => handleRequestSort('uniqueId')}
                        >
                          <strong>Unique ID</strong>
                        </TableSortLabel>
                      </TableCell>

                      {/* 4) Customer Name */}
                      <TableCell sortDirection={orderBy === 'customerName' ? order : false}>
                        <TableSortLabel
                          active={orderBy === 'customerName'}
                          direction={orderBy === 'customerName' ? order : 'asc'}
                          onClick={() => handleRequestSort('customerName')}
                        >
                          <strong>Customer Name</strong>
                        </TableSortLabel>
                      </TableCell>

                      {/* 5) User Name */}
                      <TableCell sortDirection={orderBy === 'userName' ? order : false}>
                        <TableSortLabel
                          active={orderBy === 'userName'}
                          direction={orderBy === 'userName' ? order : 'asc'}
                          onClick={() => handleRequestSort('userName')}
                        >
                          <strong>User Name</strong>
                        </TableSortLabel>
                      </TableCell>

                      {/* 6) Designation */}
                      <TableCell sortDirection={orderBy === 'designation' ? order : false}>
                        <TableSortLabel
                          active={orderBy === 'designation'}
                          direction={orderBy === 'designation' ? order : 'asc'}
                          onClick={() => handleRequestSort('designation')}
                        >
                          <strong>Designation</strong>
                        </TableSortLabel>
                      </TableCell>

                      {/* 7) City */}
                      <TableCell sortDirection={orderBy === 'city' ? order : false}>
                        <TableSortLabel
                          active={orderBy === 'city'}
                          direction={orderBy === 'city' ? order : 'asc'}
                          onClick={() => handleRequestSort('city')}
                        >
                          <strong>City</strong>
                        </TableSortLabel>
                      </TableCell>

                      {/* 8) Segmentation */}
                      <TableCell sortDirection={orderBy === 'segmentation' ? order : false}>
                        <TableSortLabel
                          active={orderBy === 'segmentation'}
                          direction={orderBy === 'segmentation' ? order : 'asc'}
                          onClick={() => handleRequestSort('segmentation')}
                        >
                          <strong>Segmentation</strong>
                        </TableSortLabel>
                      </TableCell>

                      {/* 9) Email */}
                      <TableCell sortDirection={orderBy === 'email' ? order : false}>
                        <TableSortLabel
                          active={orderBy === 'email'}
                          direction={orderBy === 'email' ? order : 'asc'}
                          onClick={() => handleRequestSort('email')}
                        >
                          <strong>Email</strong>
                        </TableSortLabel>
                      </TableCell>

                      {/* 10) Phone Number */}
                      <TableCell sortDirection={orderBy === 'phoneNumber' ? order : false}>
                        <TableSortLabel
                          active={orderBy === 'phoneNumber'}
                          direction={orderBy === 'phoneNumber' ? order : 'asc'}
                          onClick={() => handleRequestSort('phoneNumber')}
                        >
                          <strong>Phone Number</strong>
                        </TableSortLabel>
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
