const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { exec } = require('child_process');
const util = require('util');
const fs = require('fs').promises;
const execAsync = util.promisify(exec);

const compressPDF = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF uploaded' });
    }

    const { level = '50' } = req.body;
    const inputPath = req.file.path;
    const outputFilename = `compressed_${level}_${uuidv4()}.pdf`;
    const outputPath = path.join(__dirname, '../../uploads', outputFilename);

    // Compression levels
    const levels = {
      '30': '/printer',
      '50': '/ebook',
      '80': '/screen'
    };

    const gsSetting = levels[level] || levels['50'];
    
    console.log(`🔄 Compressing ${level}% (${gsSetting}): ${path.basename(inputPath)}`);

    // Ghostscript command
    const gsCommand = `gs \
      -sDEVICE=pdfwrite \
      -dCompatibilityLevel=1.4 \
      -dPDFSETTINGS=${gsSetting} \
      -dNOPAUSE -dBATCH -dQUIET \
      -sOutputFile="${outputPath}" \
      "${inputPath}"`;

    await execAsync(gsCommand, { timeout: 120000 });

    // Calculate sizes
    const inputSize = (await fs.stat(inputPath)).size;
    const outputSize = (await fs.stat(outputPath)).size;
    
    // Cleanup input file
    await fs.unlink(inputPath).catch(console.error);

    console.log(`✅ ${((1 - outputSize / inputSize) * 100).toFixed(1)}% compressed`);

    res.json({
      success: true,
      level,
      originalSize: inputSize,
      compressedSize: outputSize,
      compressionRatio: ((1 - outputSize / inputSize) * 100).toFixed(1),
      downloadUrl: `${req.protocol}://${req.get('host')}/downloads/${outputFilename}`
    });

  } catch (error) {
    console.error('❌ Compression failed:', error.message);
    res.status(500).json({ 
      error: 'Compression failed', 
      message: error.message 
    });
  }
};

// ✅ EXPORT FIXED
module.exports = { compressPDF };
