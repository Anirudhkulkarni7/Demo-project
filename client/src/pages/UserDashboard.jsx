// client/src/pages/UserDashboard.jsx
import React, { useState } from 'react';
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
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { motion } from 'framer-motion';
import axios from 'axios';
import * as XLSX from 'xlsx'; 
import EditIcon from '@mui/icons-material/Edit';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';

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
  
  // Modal state
  const [modal, setModal] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleCloseModal = () => {
    setModal({ ...modal, open: false });
  };

  const handleSubmit = async () => {
    // Validators for all fields 
    const nameRegex = /^[A-Za-z\s]+$/;
    const companyRegex = /^[A-Za-z\s]+$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10}$/;  

    if (!formData.name || !nameRegex.test(formData.name)) {
      setModal({
        open: true,
        message: 'Invalid name. Should contain only letters and spaces.',
        severity: 'error'
      });
      return;
    }
    if (!formData.companyName || !companyRegex.test(formData.companyName)) {
      setModal({
        open: true,
        message: 'Invalid company name. Should contain only letters and spaces.',
        severity: 'error'
      });
      return;
    }
    if (!formData.email || !emailRegex.test(formData.email)) {
      setModal({
        open: true,
        message: 'Invalid email.',
        severity: 'error'
      });
      return;
    }
    if (!formData.phone || !phoneRegex.test(formData.phone)) {
      setModal({
        open: true,
        message: 'Invalid phone number. Please enter a 10-digit phone number containing only numbers.',
        severity: 'error'
      });
      return;
    }

    try {
      if (editing && currentRecordId) {
        // Update existing record
        await axios.put(`http://localhost:4000/api/records/${currentRecordId}`, formData);
        setModal({
          open: true,
          message: 'Record updated successfully!',
          severity: 'success'
        });
      } else {
        // Create new record
        await axios.post('http://localhost:4000/api/records', formData);
        setModal({
          open: true,
          message: 'Record saved successfully!',
          severity: 'success'
        });
      }
      // Reset the form after submission
      setFormData({});
      setEditing(false);
      setCurrentRecordId(null);
    } catch (error) {
      setModal({
        open: true,
        message: 'Error saving record: ' + (error.response?.data?.message || error.message),
        severity: 'error'
      });
    }
  };

  const handleSearch = async () => {
    try {
      const nonEmptyData = Object.entries(formData)
        .filter(([key, value]) => value !== undefined && value !== '')
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

      const queryString = new URLSearchParams(nonEmptyData).toString();
      const { data } = await axios.get(`http://localhost:4000/api/records/search?${queryString}`);
      if (!data || data.length === 0) {
        setModal({
          open: true,
          message: 'No matching records found!',
          severity: 'info'
        });
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

  const handleEdit = (record) => {
    setFormData(record);
    setEditing(true);
    setCurrentRecordId(record._id);
    setModal({
      open: true,
      message: 'You can now edit the selected record.',
      severity: 'info'
    });
  };

  const handleDownload = () => {
    if (!searchResults || searchResults.length === 0) {
      setModal({
        open: true,
        message: 'No data to download.',
        severity: 'warning'
      });
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(searchResults);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "SearchResults");
    XLSX.writeFile(workbook, "SearchResults.xlsx");
    setModal({
      open: true,
      message: 'Search results downloaded successfully!',
      severity: 'success'
    });
  };

  return (
    <Container maxWidth="xl" sx={{ marginTop: '2rem' }}>
      <Box display="flex" gap="2%">
        {/* Left Panel: Form */}
        <Box width="30%">
          <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8 }}>
            <Paper 
              elevation={6} 
              sx={{ 
                padding: '2rem', 
                borderRadius: '16px', 
                background: 'rgba(255,255,255,0.85)', 
                backdropFilter: 'blur(10px)', 
                boxShadow: '0px 8px 24px rgba(0,0,0,0.2)' 
              }}
            >
              <Box display="flex" alignItems="center" mb={1}>
                {/* <Typography variant="h5" gutterBottom sx={{ color: '#3f51b5', fontWeight: 'bold' }}>
                  User Details
                </Typography>   */}
                <Typography variant="body2" sx={{ color: 'red', marginLeft: '0.5rem' }}>
                  * All fields are required
                </Typography>
              </Box>
              <Box mb={2}>
                <ThemeProvider theme={smallTheme}>
                  <TextField 
                    label="Name"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    fullWidth 
                    margin="normal"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon />
                        </InputAdornment>
                      )
                    }}
                  />
                  <TextField 
                    label="Company Name"
                    value={formData.companyName || ''}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    fullWidth 
                    margin="normal"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <BusinessIcon />
                        </InputAdornment>
                      )
                    }}
                  />
                  <TextField 
                    label="Email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    fullWidth 
                    margin="normal"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon />
                        </InputAdornment>
                      )
                    }}
                  />
                  <TextField 
                    label="Phone Number"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    fullWidth 
                    margin="normal"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneIcon />
                        </InputAdornment>
                      )
                    }}
                  />
                </ThemeProvider>
              </Box>
              <Box mt={2} display="flex" gap={2}>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}>
                  <Button
                    size="small"
                    variant="contained"
                    color="primary"
                    onClick={handleSubmit}
                    sx={{
                      textTransform: 'none',
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      background: 'linear-gradient(45deg, #2196f3 30%, #21cbf3 90%)',
                      boxShadow: '0px 4px 20px rgba(33,203,243,0.3)',
                      '&:hover': { background: 'linear-gradient(45deg, #21cbf3 30%, #2196f3 90%)' }
                    }}
                  >
                    {editing ? 'Update' : 'Save'}
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}>
                  <Button
                    size="small"
                    variant="contained"
                    color="secondary"
                    onClick={handleSearch}
                    sx={{
                      textTransform: 'none',
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      background: 'linear-gradient(45deg, #f50057 30%, #ff4081 90%)',
                      boxShadow: '0px 4px 20px rgba(245,0,87,0.3)',
                      '&:hover': { background: 'linear-gradient(45deg, #ff4081 30%, #f50057 90%)' }
                    }}
                  >
                    Search
                  </Button>
                </motion.div>
              </Box>
            </Paper>
          </motion.div>
        </Box>

        {/* Right Panel: Search Results */}
        <Box width="80%"> 
          {searchResults.length > 0 && (
            <Paper elevation={6} sx={{ padding: '1rem', borderRadius: '16px', maxHeight: '80vh', overflowY: 'auto' }}>
              {/* Buttons Container at the Top */}
              <Box display="flex" justifyContent="space-between" mb={2}>
                <Button 
                  size="small" 
                  variant="contained" 
                  color="primary"
                  onClick={handleDownload}
                  sx={{ textTransform: 'none' }}
                >
                  Download To Excel
                </Button>
                <Button 
                  size="small" 
                  variant="outlined"
                  onClick={() => setSearchResults([])}
                  sx={{ textTransform: 'none' }}
                >
                  Close Results
                </Button>
              </Box>

              <Typography variant="h6" gutterBottom>
                Search Results
              </Typography>
              <TableContainer>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Company Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Phone Number</TableCell>
                      <TableCell>Edit</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {searchResults.map((record, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{record.name}</TableCell>
                        <TableCell>{record.companyName}</TableCell>
                        <TableCell>{record.email}</TableCell>
                        <TableCell>{record.phone}</TableCell>
                        <TableCell>
                          <IconButton size="small" onClick={() => handleEdit(record)}>
                            <EditIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </Box>
      </Box>

      {/* Modal for Notifications */}
      <Dialog open={modal.open} onClose={handleCloseModal}>
        <DialogTitle>{modal.severity.toUpperCase()}</DialogTitle>
        <DialogContent>
          <Typography>{modal.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} autoFocus>
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
