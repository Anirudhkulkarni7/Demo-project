import React, { useState } from 'react';
import {
  TextField,
  Button,
  Typography,
  Container,
  IconButton,
  InputAdornment,
  Box,
  Snackbar,
  Alert
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

import logo from '../assets/logo.png';

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('error');

  const navigate = useNavigate();

  const toggleShowPassword = () => setShowPassword(!showPassword);

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };

  const handleSubmit = async () => {
     if (!username || !password) {
      setSnackbarMessage('Please fill in all details');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      return;
    }

    try {
      await axios.post('http://localhost:4000/api/auth/login', {
        username,
        password
      });
       onLogin();
       navigate('/user', { replace: true });
    } catch (error) {
      setSnackbarMessage(error.response?.data?.message || 'Login failed');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  return (
    <Container
      maxWidth={false}
      sx={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5'
      }}
    >
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        width="70%"
        height="500px"
        sx={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}
      >
        {/* Left Section: Logo */}
        <Box
          sx={{
            width: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <img
            src={logo}
            alt="Logo"
            style={{ width: '70%', maxWidth: '300px' }}
          />
        </Box>

        {/* Right Section: Login Form */}
        <Box
          sx={{
            width: '50%',
            padding: '3rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <Typography
            variant="h4"
            gutterBottom
            sx={{ color: '#3f51b5', fontWeight: 'bold', marginBottom: '1rem' }}
          >
            Login
          </Typography>

          <TextField
            label="Username"
            fullWidth
            margin="normal"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            variant="outlined"
            sx={{
              backgroundColor: 'rgba(255,255,255,0.9)',
              borderRadius: '4px'
            }}
          />

          <TextField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            variant="outlined"
            sx={{
              backgroundColor: 'rgba(255,255,255,0.9)',
              borderRadius: '4px'
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={toggleShowPassword} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />

          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            sx={{
              width: '20%',
              marginTop: '1.5rem',
              padding: '0.75rem',
              borderRadius: '4px',
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #2196f3 30%, #21cbf3 90%)',
              boxShadow: '0px 4px 20px rgba(33,203,243,0.3)',
              marginRight: 'auto',
              textTransform: 'none',
              '&:hover': {
                background: 'linear-gradient(45deg, #21cbf3 30%, #2196f3 90%)'
              }
            }}
          >
            Sign In
          </Button>
        </Box>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
}
 