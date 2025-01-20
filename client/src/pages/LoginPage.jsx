// client/src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { TextField, Button, Typography, Container, Paper } from '@mui/material';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';   

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async () => {
    try {
      await axios.post('http://localhost:4000/api/auth/login', {
        username,
        password
      });
      onLogin('user');
      localStorage.setItem('userRole', 'user');  
      
      // Replace the history entry so back button does not return to login
      navigate('/user', { replace: true });
    } catch (error) {
      alert(error.response?.data?.message || 'Login failed');
    }
  };

  return (
    <Container
      maxWidth="sm"
      sx={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
      }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8 }}
        style={{ width: '90%' }}
      >
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
          <motion.div
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Typography
              variant="h4"
              align="center"
              gutterBottom
              sx={{ color: '#3f51b5', fontWeight: 'bold' }}
            >
              Login
            </Typography>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
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
              type="password"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              variant="outlined"
              sx={{
                backgroundColor: 'rgba(255,255,255,0.9)',
                borderRadius: '4px'
              }}
            />
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={handleSubmit}
              sx={{
                width: '30%',
                marginTop: '1rem',
                padding: '0.75rem',
                borderRadius: '8px',
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #2196f3 30%, #21cbf3 90%)',
                boxShadow: '0px 4px 20px rgba(33,203,243,0.3)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #21cbf3 30%, #2196f3 90%)'
                }
              }}
            >
              Sign In
            </Button>
          </motion.div>
          
        </Paper>
      </motion.div>
    </Container>
  );
}
