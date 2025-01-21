// client/src/components/NavBar.jsx
import React from 'react';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function NavBar({ onLogout }) {
  return (
    <AppBar
      position="static"
      elevation={6}
      sx={{
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(10px)',
        // boxShadow: '0px 8px 24px rgba(0,0,0,0.2)',
        marginBottom: '2rem'
      }}
    >
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        {/* Logo or App Name */}
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Typography
            variant="h5"
            component={Link}
            to="/"
            sx={{
              textDecoration: 'none',
              color: '#3f51b5',
              fontWeight: 'bold'
            }}
          >
            Contacts
          </Typography>
        </motion.div>

        {/* Logout Button */}
        <motion.div
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}
        >
          <Button
            onClick={onLogout}
            sx={{
              color: '#3f51b5',
              fontWeight: 'bold',
              textTransform: 'none'
            }}
          >
            Logout
          </Button>
        </motion.div>
      </Toolbar>
    </AppBar>
  );
}
