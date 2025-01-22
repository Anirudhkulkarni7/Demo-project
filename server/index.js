 // server/index.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');  // <-- import cors

const authRoutes = require('./routes/authRoutes');
const recordRoutes = require('./routes/recordRoutes');

const app = express();

 app.use(cors({
  // origin: 'http://localhost:5173',  
  origin: '*',

  credentials: true
}));

app.use(express.json());

// Your routes
app.use('/api/auth', authRoutes);
app.use('/api/records', recordRoutes);

const PORT = process.env.PORT || 4000;
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => console.error('MongoDB connection error:', err));
