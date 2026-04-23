const { execSync } = require("child_process");

try {
  console.log("GS VERSION:", execSync("gs --version").toString());
  console.log("GS PATH:", execSync("which gs || where gs").toString());
} catch (err) {
  console.error("❌ Ghostscript NOT available:", err.message);
}
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const multer = require('multer'); // ✅ FIXED: Add this import
const path = require('path');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const pdfController = require('./controllers/pdfController');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://your-frontend-domain.com"
  ],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.get("/test-gs", (req, res) => {
  const { exec } = require("child_process");

  exec("gs -h", (err, stdout, stderr) => {
    if (err) {
      return res.status(500).json({
        error: "Ghostscript not working",
        details: err.message,
        stderr
      });
    }

    res.json({
      success: true,
      output: stdout
    });
  });
});

app.get("/test-gs", async (req, res) => {
  const { exec } = require("child_process");

  exec("gs --version", (err, stdout, stderr) => {
    if (err) {
      return res.status(500).send({
        error: "Ghostscript NOT working",
        details: err.message,
      });
    }

    res.send({
      success: true,
      version: stdout,
    });
  });
});
// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many requests'
});
app.use('/api/compress', limiter);

// ✅ Multer storage for Render disk
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `input_${Date.now()}_${file.originalname}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files allowed!'), false);
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// Routes
app.post('/api/compress', upload.single('pdf'), pdfController.compressPDF);
app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date().toISOString() }));
app.get('/', (req, res) => res.send('<h1>🚀 PDF Compressor API is Live!</h1><p><a href="/test">Test Page</a></p>'));

// Serve downloads & test page
app.use('/downloads', express.static('uploads'));
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 PDF Compressor running on port ${PORT}`);
  console.log(`📁 Uploads: /opt/render/project/src/uploads`);
});
