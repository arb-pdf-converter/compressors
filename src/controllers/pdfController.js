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

    const fsSync = require('fs');
    const stats = await fs.stat(outputPath);

    if (stats.size < 2000) {
        throw new Error("Output file is too small → GS failed");
    }
    console.log("INPUT PATH:", inputPath);
    console.log("FILE EXISTS:", fsSync.existsSync(inputPath));

    // Ghostscript command
    const gsCommand = `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/ebook -dNOPAUSE -dBATCH -sOutputFile="${outputPath}" "${inputPath}"`;

    try {
      const result = await execAsync(gsCommand, { timeout: 120000 });

      console.log("GS STDOUT:", result.stdout);
      console.log("GS STDERR:", result.stderr);

    } catch (error) {
      console.error("GS FAILED:", error);
      console.error("STDERR:", error.stderr);

      return res.status(500).json({
        error: "Compression failed",
        message: error.message
      });
    }

    // Calculate sizes
    const inputSize = (await fs.stat(inputPath)).size;
    const outputSize = (await fs.stat(outputPath)).size;
    
    // Cleanup input file
    await fs.unlink(inputPath).catch(console.error);
    
    console.log(`✅ ${((1 - outputSize / inputSize) * 100).toFixed(1)}% compressed`);
    const stats = await fs.stat(outputPath);

    if (stats.size < 2000) {
        throw new Error("Output file is too small → GS failed");
    }
    
    res.json({
      success: true,
      level,
      originalSize: inputSize,
      compressedSize: outputSize,
      compressionRatio: ((1 - outputSize / inputSize) * 100).toFixed(1),
      downloadUrl: `${req.protocol}://${req.get('host')}/downloads/${outputFilename}`
    });

  } catch (error) {
  console.error("FULL GS ERROR:", error);
  console.error("STDERR:", error.stderr);
  console.error("STDOUT:", error.stdout);

  return res.status(500).json({
    error: "Compression failed",
    message: error.message,
  });
}
};

// ✅ EXPORT FIXED
module.exports = { compressPDF };
