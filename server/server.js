import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import dns from 'dns'; 

// Import your new routes
import authRoutes from './routes/authRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import scheduleRoutes from './routes/scheduleRoutes.js';
dns.setServers(['8.8.8.8', '8.8.4.4']);
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors({
  origin: [
    'http://localhost:5173', 
    process.env.FRONTEND_URL // <-- We will set this in Render!
  ],
  credentials: true
}));
app.use(express.json());

// Mount the Auth Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/schedule', scheduleRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'Server is healthy and running!' });
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas');
    app.listen(PORT, () => {
      console.log(`🚀 Server listening on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('❌ Error connecting to MongoDB:', error.message);
  });