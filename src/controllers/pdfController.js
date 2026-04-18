const path = require('path');
const { v4: uuidv4 } = require('uuid');
const pdfService = require('../services/pdfService');
const cleanup = require('../utils/fileCleanup');

const compressPDF = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    const inputPath = req.file.path;
    const outputFilename = `compressed_${uuidv4()}.pdf`;
    const outputPath = path.join(__dirname, '../../uploads', outputFilename);

    // Compress PDF
    const stats = await pdfService.compressPDF(inputPath, outputPath);

    // Cleanup input file
    await cleanup.deleteFile(inputPath);

    res.json({
      success: true,
      message: 'PDF compressed successfully!',
      ...stats,
      downloadUrl: `${req.protocol}://${req.get('host')}${stats.downloadUrl}`
    });

  } catch (error) {
    console.error('Compression error:', error);
    res.status(500).json({ 
      error: 'PDF compression failed',
      message: error.message 
    });
  }
};

module.exports = { compressPDF };
