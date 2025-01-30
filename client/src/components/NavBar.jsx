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
        height: '54px',
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(10px)',
        marginBottom: '1.6rem'
      }}
    >
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Typography
            variant="h6"
            component={Link}
            to="/user"
            sx={{
              textDecoration: 'none',
              color: '#3f51b5',
              fontWeight: 'bold'
            }}
          >
            Contacts
          </Typography>
        </motion.div>
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
