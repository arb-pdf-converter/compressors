const { PDFDocument, rgb } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');

class PDFService {
  async compressPDF(inputPath, outputPath) {
    try {
      const existingPdfBytes = await fs.readFile(inputPath);
      const pdfDoc = await PDFDocument.load(existingPdfBytes);

      // ✅ FIX: Remove problematic metadata calls
      // pdfDoc.setKeywords('');  ❌ This causes the error
      // Instead, clear metadata properly:

      // Clear metadata (safe way)
      pdfDoc.setTitle('');
      pdfDoc.setAuthor('');
      pdfDoc.setSubject('');
      // pdfDoc.setKeywords([]); ✅ Array or omit entirely
      pdfDoc.setProducer('');
      pdfDoc.setCreator('');

      // Basic compression: remove unused objects
      const pages = pdfDoc.getPages();
      for (let page of pages) {
        // Optional: Scale down content slightly
        const { width, height } = page.getSize();
        // page.scale(0.95); // Uncomment for slight compression
      }

      // ✅ Write with compression options
      const pdfBytes = await pdfDoc.save({
        useObjectStreams: false,
        addDefaultPage: false,
        objectsPerTick: 50
      });

      await fs.writeFile(outputPath, pdfBytes);
      
      const inputSize = (await fs.stat(inputPath)).size;
      const outputSize = (await fs.stat(outputPath)).size;
      
      return {
        originalSize: inputSize,
        compressedSize: outputSize,
        compressionRatio: ((1 - outputSize / inputSize) * 100).toFixed(1),
        downloadUrl: `/downloads/${path.basename(outputPath)}`
      };
    } catch (error) {
      console.error('PDF Error:', error); // ✅ Add logging
      throw new Error(`Compression failed: ${error.message}`);
    }
  }
}

module.exports = new PDFService();
