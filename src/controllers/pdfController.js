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

    const fs = require("fs");
    const path = require("path");
    const { v4: uuidv4 } = require('uuid');

    // Ensure uploads folder exists
    if (!fs.existsSync("uploads")) {
      fs.mkdirSync("uploads", { recursive: true });
    }

    const { level = '50' } = req.body;
    const inputPath = req.file.path;
    const fsSync = require("fs");

    console.log("INPUT PATH:", inputPath);
    console.log("INPUT EXISTS:", fsSync.existsSync(inputPath));
    console.log("INPUT SIZE:", fsSync.existsSync(inputPath) ? fsSync.statSync(inputPath).size : "missing");
    const levels = {
      '30': '/printer',
      '50': '/ebook',
      '80': '/screen'
    };

    const gsSetting = levels[level] || '/ebook';

    const outputFilename = `compressed_${level}_${uuidv4()}.pdf`;
    const outputPath = path.resolve('uploads', outputFilename);

    console.log("INPUT:", inputPath);
    console.log("OUTPUT:", outputPath);
    console.log("LEVEL:", gsSetting);

    // 🔥 IMPORTANT: delete old output if exists
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }

    // Ghostscript command (FIXED)
    const gsCommand = [
      "gs",
      "-sDEVICE=pdfwrite",
      "-dCompatibilityLevel=1.4",
      `-dPDFSETTINGS=${gsSetting}`,
      "-dNOPAUSE",
      "-dBATCH",
      "-dSAFER",
      "-dQUIET",
      "-dDetectDuplicateImages=true",
      "-dCompressFonts=true",
      `-sOutputFile=${outputPath}`,
      inputPath
    ].join(" ");

    try {
      const result = await execAsync(gsCommand, { timeout: 120000 });

      const fsSync = require("fs");

      console.log("OUTPUT EXISTS:", fsSync.existsSync(outputPath));
      console.log("OUTPUT SIZE:", fsSync.existsSync(outputPath) ? fsSync.statSync(outputPath).size : "missing");

    } catch (error) {
      console.error("❌ Ghostscript failed:");
      console.error(error.stderr || error.message);

      return res.status(500).json({
        error: "Compression failed",
        message: error.message,
        stderr: error.stderr || null,
        stdout: error.stdout || null
      });
    }

    // ✅ NOW validate AFTER GS runs
    if (!fs.existsSync(outputPath)) {
      throw new Error("Output file was not created (Ghostscript failed)");
    }

    const inputSize = (await fs.promises.stat(inputPath)).size;
    const outputSize = (await fs.promises.stat(outputPath)).size;

    console.log("INPUT SIZE:", inputSize);
    console.log("OUTPUT SIZE:", outputSize);

    if (outputSize < 2000) {
      throw new Error("Output PDF is too small → likely corrupted Ghostscript output");
    }

    // Cleanup input
    await fs.promises.unlink(inputPath).catch(console.error);

    return res.json({
      success: true,
      level,
      originalSize: inputSize,
      compressedSize: outputSize,
      compressionRatio: ((1 - outputSize / inputSize) * 100).toFixed(1),
      downloadUrl: `/downloads/${outputFilename}`
    });

  } catch (error) {
    console.error("FULL ERROR:", error);

    return res.status(500).json({
      error: "Compression failed",
      message: error.message,
    });
  }
};

// ✅ EXPORT FIXED
module.exports = { compressPDF };
