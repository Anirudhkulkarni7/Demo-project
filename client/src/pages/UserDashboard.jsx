// src/pages/UserDashboard.jsx
import React, { useState, useMemo } from 'react';
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

import EditIcon from '@mui/icons-material/Edit';
import CancelIcon from '@mui/icons-material/Cancel';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import DownloadIcon from '@mui/icons-material/Download';
import PeopleIcon from '@mui/icons-material/People';
// import RefreshIcon from '@mui/icons-material/Refresh';

import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import WorkIcon from '@mui/icons-material/Work';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import ListIcon from '@mui/icons-material/List';

 const iconMapping = {
  CompanyName: <PersonIcon />,
  userName: <BusinessIcon />,
  designation: <WorkIcon />,
  email: <EmailIcon />,
  phoneNumber: <PhoneIcon />,
  city: <LocationCityIcon />,
  segmentation: <ListIcon />
};

export default function UserDashboard({ role }) {
  const [formData, setFormData] = useState({
    companyName: '',
    userName: '',
    designation: '',
    email: '',
    phoneNumber: '',
    city: '',
    segmentation: ''
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

  // Sorting function
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Sort results
  const sortedResults = useMemo(() => {
    const comparator = (a, b) => {
      if (a[orderBy] < b[orderBy]) return order === 'asc' ? -1 : 1;
      if (a[orderBy] > b[orderBy]) return order === 'asc' ? 1 : -1;
      return 0;
    };
    return [...searchResults].sort(comparator);
  }, [searchResults, order, orderBy]);

  // Paginate
  const totalPages = Math.ceil(sortedResults.length / rowsPerPage);
  const currentTableData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return sortedResults.slice(startIndex, endIndex);
  }, [sortedResults, currentPage]);

  // CREATE/UPDATE
  const handleSubmit = async () => {
    // Basic validations
    const nameRegex = /^[A-Za-z\s]+$/; 
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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
    if (!formData.city || !nameRegex.test(formData.city)) {
      setModal({ open: true, message: 'Invalid City (letters/spaces only).', severity: 'error' });
      return;
    }
    if (!formData.segmentation) {
      setModal({ open: true, message: 'Please select a segmentation.', severity: 'error' });
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

      setFormData({
        customerName: '',
        userName: '',
        designation: '',
        email: '',
        phoneNumber: '',
        city: '',
        segmentation: ''
      });
      setEditing(false);
      setCurrentRecordId(null);

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

  // SEARCH
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

  // VIEW ALL
  const handleViewAll = async () => {
    try {
      const { data } = await axios.get('http://localhost:4000/api/records');
      setSearchResults(data);
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

  // EDIT
  const handleEdit = (record) => {
    setFormData(record);
    setEditing(true);
    setCurrentRecordId(record._id);
    setModal({ open: true, message: 'You can now edit the selected record.', severity: 'info' });
  };

  // Row-level Delete
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
        setSearchResults(prev => prev.filter(item => item._id !== recordToDelete._id));
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

  // DELETE ALL
  const handleConfirmDeleteAll = async () => {
    try {
      await axios.delete('http://localhost:4000/api/records');
      setSearchResults([]);
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

  // DOWNLOAD
  const handleDownload = () => {
    if (!searchResults || searchResults.length === 0) {
      setModal({ open: true, message: 'No data to download.', severity: 'warning' });
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(searchResults);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "SearchResults");
    XLSX.writeFile(workbook, "SearchResults.xlsx");
    setModal({ open: true, message: 'Search results downloaded successfully!', severity: 'success' });
  };

 
  // Page change
  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  return (
    <Container maxWidth="xl" sx={{ marginTop: '2rem', overflow: 'hidden' }}>
      <Box display="flex" gap="2%">
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

              {/* Customer Name */}
              <TextField
                label="Customer Name"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                fullWidth
                margin="normal"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      {iconMapping.customerName}
                    </InputAdornment>
                  )
                }}
              />

              {/* User Name */}
              <TextField
                label="User Name"
                value={formData.userName}
                onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                fullWidth
                margin="normal"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      {iconMapping.userName}
                    </InputAdornment>
                  )
                }}
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
                marginTop: '-1rem',
                padding: '0.6rem',
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
                  {/* Refresh Button (Admin only, if desired) */}
                  {/* {role === 'admin' && (
                    <IconButton size="small" onClick={handleRefresh} sx={{ mr: 1 }}>
                      <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
                        <RefreshIcon />
                      </motion.div>
                    </IconButton>
                  )} */}

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

              {/* Table */}
              <TableContainer sx={{ maxHeight: '65vh', overflowY: 'auto' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      {/* 7 columns */}
                      <TableCell sortDirection={orderBy === 'customerName' ? order : false}>
                        <TableSortLabel
                          active={orderBy === 'customerName'}
                          direction={orderBy === 'customerName' ? order : 'asc'}
                          onClick={() => handleRequestSort('customerName')}
                        >
                          <strong>Customer Name</strong>
                        </TableSortLabel>
                      </TableCell>
                      <TableCell sortDirection={orderBy === 'userName' ? order : false}>
                        <TableSortLabel
                          active={orderBy === 'userName'}
                          direction={orderBy === 'userName' ? order : 'asc'}
                          onClick={() => handleRequestSort('userName')}
                        >
                          <strong>User Name</strong>
                        </TableSortLabel>
                      </TableCell>
                      <TableCell sortDirection={orderBy === 'designation' ? order : false}>
                        <TableSortLabel
                          active={orderBy === 'designation'}
                          direction={orderBy === 'designation' ? order : 'asc'}
                          onClick={() => handleRequestSort('designation')}
                        >
                          <strong>Designation</strong>
                        </TableSortLabel>
                      </TableCell>
                      <TableCell sortDirection={orderBy === 'email' ? order : false}>
                        <TableSortLabel
                          active={orderBy === 'email'}
                          direction={orderBy === 'email' ? order : 'asc'}
                          onClick={() => handleRequestSort('email')}
                        >
                          <strong>Email</strong>
                        </TableSortLabel>
                      </TableCell>
                      <TableCell sortDirection={orderBy === 'phoneNumber' ? order : false}>
                        <TableSortLabel
                          active={orderBy === 'phoneNumber'}
                          direction={orderBy === 'phoneNumber' ? order : 'asc'}
                          onClick={() => handleRequestSort('phoneNumber')}
                        >
                          <strong>Phone Number</strong>
                        </TableSortLabel>
                      </TableCell>
                      <TableCell sortDirection={orderBy === 'city' ? order : false}>
                        <TableSortLabel
                          active={orderBy === 'city'}
                          direction={orderBy === 'city' ? order : 'asc'}
                          onClick={() => handleRequestSort('city')}
                        >
                          <strong>City</strong>
                        </TableSortLabel>
                      </TableCell>
                      <TableCell sortDirection={orderBy === 'segmentation' ? order : false}>
                        <TableSortLabel
                          active={orderBy === 'segmentation'}
                          direction={orderBy === 'segmentation' ? order : 'asc'}
                          onClick={() => handleRequestSort('segmentation')}
                        >
                          <strong>Segmentation</strong>
                        </TableSortLabel>
                      </TableCell>

                      <TableCell><strong>Edit</strong></TableCell>
                      <TableCell><strong>Delete</strong></TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {currentTableData.map((record, idx) => (
                      <TableRow key={idx} sx={{ height: '5px' }}>
                        <TableCell>{record.customerName}</TableCell>
                        <TableCell>{record.userName}</TableCell>
                        <TableCell>{record.designation}</TableCell>
                        <TableCell>{record.email}</TableCell>
                        <TableCell>{record.phoneNumber}</TableCell>
                        <TableCell>{record.city}</TableCell>
                        <TableCell>{record.segmentation}</TableCell>

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
