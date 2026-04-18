const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

class PDFService {
  async compressPDF(inputPath, outputPath) {
    try {
      console.log(`Compressing: ${path.basename(inputPath)}`);
      
      // ✅ GHOSTSCRIPT: Real compression (50-80% reduction)
      const command = `gs \
        -sDEVICE=pdfwrite \
        -dCompatibilityLevel=1.4 \
        -dPDFSETTINGS=/ebook \
        -dNOPAUSE \
        -dQUIET \
        -dBATCH \
        -dAutoRotatePages=/None \
        -sOutputFile="${outputPath}" \
        "${inputPath}"`;

      await execAsync(command, { timeout: 60000 });
      
      // Verify output exists
      await fs.access(outputPath);
      
      const inputSize = (await fs.stat(inputPath)).size;
      const outputSize = (await fs.stat(outputPath)).size;
      
      console.log(`Compression: ${inputSize/1024/1024}MB → ${outputSize/1024/1024}MB`);
      
      return {
        originalSize: inputSize,
        compressedSize: outputSize,
        compressionRatio: ((1 - outputSize / inputSize) * 100).toFixed(1),
        downloadUrl: `/downloads/${path.basename(outputPath)}`
      };
    } catch (error) {
      console.error('Ghostscript error:', error.message);
      throw new Error(`Compression failed: ${error.message}`);
    }
  }
}

module.exports = new PDFService();
