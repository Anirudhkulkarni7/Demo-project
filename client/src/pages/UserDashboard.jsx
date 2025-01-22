// client/src/pages/UserDashboard.jsx
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
  ThemeProvider,
  createTheme
} from '@mui/material';
import { motion } from 'framer-motion';
import axios from 'axios';
import * as XLSX from 'xlsx';
import EditIcon from '@mui/icons-material/Edit';
import CancelIcon from '@mui/icons-material/Cancel';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import SortByAlphaIcon from '@mui/icons-material/SortByAlpha';
import DownloadIcon from '@mui/icons-material/Download';
import PeopleIcon from '@mui/icons-material/People';
import { JsonForms } from '@jsonforms/react';
import { materialRenderers, materialCells } from '@jsonforms/material-renderers';
import { rankWith, isStringControl } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import Pagination from '@mui/material/Pagination';


const iconMapping = {
  name: <PersonIcon />,
  companyName: <BusinessIcon />,
  email: <EmailIcon />,
  phone: <PhoneIcon />
};

const CustomControl = (props) => {
  const { data, handleChange, path, errors, visible, label } = props;
  if (!visible) return null;

  const onChange = (ev) => handleChange(path, ev.target.value);
  const displayError = errors && !errors.includes('is a required property') ? errors : '';

  return (
    <TextField 
      label={label}
      value={data || ''}
      onChange={onChange}
      error={!!errors && displayError !== ''}
      helperText={displayError}
      fullWidth
      margin="normal"
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            {iconMapping[path.split('.').pop()] || null}
          </InputAdornment>
        )
      }}
    />
  );
};

const customTester = rankWith(4, isStringControl);
const CustomRenderer = withJsonFormsControlProps(CustomControl);

// JSON Forms schema & uischema
const schema = {
  type: "object",
  properties: {
    name: { type: "string", pattern: "^[A-Za-z\\s]+$" },
    companyName: { type: "string", pattern: "^[A-Za-z\\s]+$" },
    email: { type: "string", format: "email" },
    phone: { type: "string" }
  },
  required: [ "name", "companyName", "email", "phone" ]
};

const uischema = {
  type: "VerticalLayout",
  elements: [
    { type: "Control", scope: "#/properties/name" },
    { type: "Control", scope: "#/properties/companyName" },
    { type: "Control", scope: "#/properties/email" },
    { type: "Control", scope: "#/properties/phone" }
  ]
};

const smallTheme = createTheme({
  components: {
    MuiTextField: {
      defaultProps: { size: 'large' }
    }
  },
});

export default function UserDashboard() {
  const [formData, setFormData] = useState({});
  const [searchResults, setSearchResults] = useState([]);

  const [editing, setEditing] = useState(false);
  const [currentRecordId, setCurrentRecordId] = useState(null);
  
  // For popups
  const [modal, setModal] = useState({ open: false, message: '', severity: 'success' });
  const handleCloseModal = () => setModal({ ...modal, open: false });

  // For sorting
  const [sortOrder, setSortOrder] = useState(null);

  // For pagination
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 7;

  // Confirm "Delete All"
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const handleOpenDeleteAll = () => setDeleteAllOpen(true);
  const handleCloseDeleteAll = () => setDeleteAllOpen(false);

  // Confirm row-level delete
  const [deleteRowOpen, setDeleteRowOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);


  const handleSubmit = async () => {
    const nameRegex = /^[A-Za-z\s]+$/;
    const companyRegex = /^[A-Za-z\s]+$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\d{3}-\d{3}-\d{4}$/;

    if (!formData.name || !nameRegex.test(formData.name)) {
      setModal({ open: true, message: 'Invalid name. Should contain only letters and spaces.', severity: 'error' });
      return;
    }
    if (!formData.companyName || !companyRegex.test(formData.companyName)) {
      setModal({ open: true, message: 'Invalid company name. Should contain only letters and spaces.', severity: 'error' });
      return;
    }
    if (!formData.email || !emailRegex.test(formData.email)) {
      setModal({ open: true, message: 'Invalid email.', severity: 'error' });
      return;
    }
    if (!formData.phone || !phoneRegex.test(formData.phone)) {
      setModal({
        open: true,
        message: 'Invalid phone number. Please enter a phone number in the format XXX-XXX-XXXX.',
        severity: 'error',
      });
      return;
    }

    try {
      if (editing && currentRecordId) {
        // Update existing record
        await axios.put(`http://localhost:4000/api/records/${currentRecordId}`, formData);
        setModal({ open: true, message: 'Record updated successfully!', severity: 'success' });
      } else {
        // Create new record
        await axios.post('http://localhost:4000/api/records', formData);
        setModal({ open: true, message: 'Record saved successfully!', severity: 'success' });
      }
      setFormData({});
      setEditing(false);
      setCurrentRecordId(null);
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      setModal({
        open: true,
        message: 'Error saving record: ' + errorMsg,
        severity: 'error'
      });
    }
  };

  // 2) Search by any field(s)
  const handleSearch = async () => {
    try {
      // get all non-epty fields from formData
      const nonEmptyData = Object.entries(formData)
        .filter(([_, value]) => value !== undefined && value !== '')
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

      if (Object.keys(nonEmptyData).length === 0) {
        setModal({ open: true, message: 'Please enter at least one field to search.', severity: 'warning' });
        return;
      }

      const queryString = new URLSearchParams(nonEmptyData).toString();
      const { data } = await axios.get(`http://localhost:4000/api/records/search?${queryString}`);
      
      if (!data || data.length === 0) {
        setModal({ open: true, message: 'No matching records found!', severity: 'info' });
      } else {
        setSearchResults(data);
      }
    } catch (error) {
      setModal({
        open: true,
        message: 'Error searching records: ' + (error.response?.data?.message || error.message),
        severity: 'error'
      });
    }
  };

  // 3) View All Users  
  const handleViewAll = async () => {
    try {
      const { data } = await axios.get('http://localhost:4000/api/records');
      setSearchResults(data);
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

  // 4) Row-Level Edit
  const handleEdit = (record) => {
    setFormData(record);
    setEditing(true);
    setCurrentRecordId(record._id);
    setModal({ open: true, message: 'You can now edit the selected record.', severity: 'info' });
  };

  // 5) Row-Level Delete Logic
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

  // 6) Delete All Records
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

  // 7) Download Data
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

  // 8) Sorting
  const sortedResults = useMemo(() => {
    if (!searchResults) return [];
    let resultsCopy = [...searchResults];
    if (sortOrder === 'asc') {
      resultsCopy.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOrder === 'desc') {
      resultsCopy.sort((a, b) => b.name.localeCompare(a.name));
    }
    return resultsCopy;
  }, [searchResults, sortOrder]);

  // 9) Pagination
  const totalPages = Math.ceil(sortedResults.length / rowsPerPage);
  const currentTableData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return sortedResults.slice(startIndex, endIndex);
  }, [sortedResults, currentPage]);

  // 10) Toggle Sorting
  const handleSortToggle = () => {
    if (sortOrder === null) setSortOrder('asc');
    else if (sortOrder === 'asc') setSortOrder('desc');
    else setSortOrder(null);
    setCurrentPage(1); 
  };

  // 11) Handle page change
  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

   return (
    <Container maxWidth="xl" sx={{ marginTop: '2rem', overflow: 'hidden' }}>
      <Box display="flex" gap="2%">
        {/* Left Panel: JSONForms Form */}
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
              <Box mb={2}>
                <ThemeProvider theme={smallTheme}>
                  <JsonForms
                    schema={schema}
                    uischema={uischema}
                    data={formData}
                    renderers={[{ tester: customTester, renderer: CustomRenderer }, ...materialRenderers]}
                    cells={materialCells}
                    onChange={({ data }) => setFormData(data)}
                  />
                </ThemeProvider>
              </Box>
              <Box mt={2} display="flex" gap={2}>
                {/* Save/Update Button */}
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

                {/* Search Button */}
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

                {/* View All Button */}
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
        <Box width="80%"> 
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
              {/* Top row with Title, Filter/Sort, Buttons */}
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
                  {/* Sort Button */}
                  <IconButton 
                    size="small" 
                    onClick={handleSortToggle}
                    sx={{ mr: 1 }}
                  >
                    <motion.div
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <SortByAlphaIcon />
                    </motion.div>
                  </IconButton>

                  {/* Delete All Button */}
                  <IconButton 
                    size="small" 
                    onClick={handleOpenDeleteAll}
                    sx={{ mr: 1 }}
                  >
                    <motion.div
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <DeleteSweepIcon color="error" />
                    </motion.div>
                  </IconButton>

                  {/* Download Excel Button */}
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

                  {/* Clear Search Results */}
                  <IconButton 
                    size="small" 
                    onClick={() => setSearchResults([])}
                  >
                    <CancelIcon />
                  </IconButton>
                </Box>
              </Box>

              {/* Table with pagination */}
              <TableContainer sx={{ maxHeight: '65vh', overflowY: 'auto' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell style={{ width: '100px', whiteSpace: 'nowrap' }}><strong>Name</strong></TableCell>
                      <TableCell style={{ width: '150px', whiteSpace: 'nowrap' }}><strong>Company Name</strong></TableCell>
                      <TableCell style={{ width: '150px', whiteSpace: 'nowrap' }}><strong>Email</strong></TableCell>
                      <TableCell style={{ width: '120px', whiteSpace: 'nowrap' }}><strong>Phone Number</strong></TableCell>
                      <TableCell style={{ width: '70px', whiteSpace: 'nowrap' }}><strong>Edit</strong></TableCell>
                      <TableCell style={{ width: '70px', whiteSpace: 'nowrap' }}><strong>Delete</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentTableData.map((record, idx) => (
                      <TableRow key={idx} sx={{ height: '5px' }}>
                        <TableCell>{record.name}</TableCell>
                        <TableCell>{record.companyName}</TableCell>
                        <TableCell>{record.email}</TableCell>
                        <TableCell>{record.phone}</TableCell>
                        <TableCell>
                          <IconButton size="small" onClick={() => handleEdit(record)}>
                            <motion.div
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <EditIcon />
                            </motion.div>
                          </IconButton>
                        </TableCell>
                        <TableCell>
                          <IconButton size="small" onClick={() => handleDeleteRowClick(record)}>
                            <motion.div
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.9 }}
                            >
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
      <Dialog 
        open={modal.open} 
        onClose={handleCloseModal}
        maxWidth="xs"
      >
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
      <Dialog
        open={deleteAllOpen}
        onClose={handleCloseDeleteAll}
        maxWidth="xs"
      >
        <DialogTitle>Confirm Delete All</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete all records?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteAll} autoFocus>No</Button>
          <Button onClick={handleConfirmDeleteAll} color="error">Yes, Delete All</Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation dialog for row-level delete */}
      <Dialog
        open={deleteRowOpen}
        onClose={handleCloseDeleteRow}
        maxWidth="xs"
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this user?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteRow} autoFocus>No</Button>
          <Button onClick={handleConfirmDeleteRow} color="error">Yes, Delete</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
