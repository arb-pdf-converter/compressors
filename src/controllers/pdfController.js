const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { exec } = require('child_process');
const util = require('util');
const fs = require('fs').promises;
const execAsync = util.promisify(exec);

const compressPDF = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    const inputPath = req.file.path;
    const outputFilename = `compressed_${uuidv4()}.pdf`;
    const outputPath = path.join(__dirname, '../../uploads', outputFilename);

    console.log(`Compressing ${path.basename(inputPath)}`);

    // ✅ GHOSTSCRIPT - Real 50-70% compression
    const gsCommand = `gs \
      -sDEVICE=pdfwrite \
      -dCompatibilityLevel=1.4 \
      -dPDFSETTINGS=/ebook \
      -dNOPAUSE -dBATCH -dQUIET \
      -sOutputFile="${outputPath}" \
      "${inputPath}"`;

    await execAsync(gsCommand, { timeout: 120000 });

    // Get sizes
    const inputSize = (await fs.stat(inputPath)).size;
    const outputSize = (await fs.stat(outputPath)).size;

    // Cleanup input
    await fs.unlink(inputPath);

    res.json({
      success: true,
      message: 'PDF compressed successfully!',
      originalSize: inputSize,
      compressedSize: outputSize,
      compressionRatio: ((1 - outputSize / inputSize) * 100).toFixed(1),
      downloadUrl: `${req.protocol}://${req.get('host')}/downloads/${outputFilename}`
    });

  } catch (error) {
    console.error('Compression error:', error);
    res.status(500).json({ 
      error: 'Compression failed', 
      message: error.message,
      gsAvailable: await checkGhostscript()
    });
  }
};

// Check if Ghostscript is installed
async function checkGhostscript() {
  try {
    await execAsync('gs --version');
    return true;
  } catch {
    return false;
  }
}

module.exports = { compressPDF };
