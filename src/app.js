const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const pdfController = require('./controllers/pdfController');
const { upload } = require('./middleware/multerConfig');
const cleanup = require('./utils/fileCleanup');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-frontend.com'] 
    : true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many requests, please try again later.'
});
app.use('/api/compress', limiter);

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files (optional download links)
app.use('/downloads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.post('/api/compress', upload.single('pdf'), pdfController.compressPDF);
app.get('/api/health', (req, res) => res.json({ status: 'OK' }));

// Cleanup old files every 30 minutes
setInterval(cleanup.cleanupOldFiles, 30 * 60 * 1000);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
