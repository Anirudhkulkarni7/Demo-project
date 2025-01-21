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

// Custom Renderer Setup
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

 const schema = {
  type: "object",
  properties: {
    name: { type: "string", pattern: "^[A-Za-z\\s]+$" },
    companyName: { type: "string", pattern: "^[A-Za-z\\s]+$" },
    email: { type: "string", format: "email" },
    phone: { type: "string", pattern: "^[0-9]{10}$" }
  },
  required: ["name", "companyName", "email", "phone"]
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
  
  const [modal, setModal] = useState({ open: false, message: '', severity: 'success' });

  const handleCloseModal = () => setModal({ ...modal, open: false });

  const handleSubmit = async () => {
    const nameRegex = /^[A-Za-z\s]+$/;
    const companyRegex = /^[A-Za-z\s]+$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10}$/;  

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
      setModal({ open: true, message: 'Invalid phone number. Please enter a 10-digit phone number containing only numbers.', severity: 'error' });
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

  const handleEdit = (record) => {
    setFormData(record);
    setEditing(true);
    setCurrentRecordId(record._id);
    setModal({ open: true, message: 'You can now edit the selected record.', severity: 'info' });
  };

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

  return (
    <Container maxWidth="xl" sx={{ marginTop: '2rem', overflow: 'hidden' }}>
      <Box display="flex" gap="2%">
        {/* Left Panel: JSONForms Form */}
        <Box width="30%">
          <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8 }}>
            <Paper 
              elevation={6} 
              sx={{ 
                padding: '1.2rem', 
                borderRadius: '5px', 
                background: 'rgba(255,255,255,0.85)',
                border: '2px solid rgba(0,0,0,0.1)'  
              }}
            >
              {/* User Details Heading */}
              {/* <Typography variant="h5" gutterBottom sx={{ color: '#3f51b5', fontWeight: 'bold' }}>
                User Details
              </Typography> */}
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
              </Box>
              <Box display="flex" justifyContent="flex-end" mt={1}>
                <Typography variant="body2" color="red">
                  All fields are required
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
                padding: '0.5rem', 
                borderRadius: '4px',
                border: '1px solid rgba(0,0,0,0.1)'  
              }}
            >
              <Box 
                display="flex" 
                justifyContent="space-between" 
                alignItems="center" 
                mb={2} 
                sx={{ position: 'sticky', top: 0, background: 'inherit', zIndex: 1, pb: 1 }}
              >
                <Typography variant="h6">Search Results</Typography>
                <Box>
                  <Button 
                    size="small" 
                    variant="contained" 
                    color="primary"
                    onClick={handleDownload}
                    sx={{ textTransform: 'none', mr: 1 }}
                  >
                    Download To Excel
                  </Button>
                  <IconButton 
                    size="small" 
                    onClick={() => setSearchResults([])}
                  >
                    <CancelIcon />
                  </IconButton>
                </Box>
              </Box>
              <TableContainer sx={{ maxHeight: '65vh', overflowY: 'auto' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell style={{ width: '100px', whiteSpace: 'nowrap' }}><strong>Name</strong></TableCell>
                      <TableCell style={{ width: '150px', whiteSpace: 'nowrap' }}><strong>Company Name</strong></TableCell>
                      <TableCell style={{ width: '150px', whiteSpace: 'nowrap' }}><strong>Email</strong></TableCell>
                      <TableCell style={{ width: '120px', whiteSpace: 'nowrap' }}><strong>Phone Number</strong></TableCell>
                      <TableCell style={{ width: '70px', whiteSpace: 'nowrap' }}><strong>Edit</strong></TableCell>
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
    </Container>
  );
}
