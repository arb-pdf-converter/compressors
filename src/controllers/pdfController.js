const compressPDF = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF uploaded' });
    }

    const { level = '50' } = req.body; // ✅ Get level from frontend
    const inputPath = req.file.path;
    const outputFilename = `compressed_${level}_${uuidv4()}.pdf`;
    const outputPath = path.join(__dirname, '../../uploads', outputFilename);

    // ✅ Compression levels mapping
    const levels = {
      '30': { gsSetting: '/printer', expectedSavings: '25-35%' },
      '50': { gsSetting: '/ebook', expectedSavings: '45-65%' },   // Default
      '80': { gsSetting: '/screen', expectedSavings: '70-90%' }
    };

    const config = levels[level] || levels['50'];
    
    console.log(`Compressing with ${level}% level (${config.gsSetting})`);

    // ✅ Dynamic Ghostscript command
    const gsCommand = `gs \
      -sDEVICE=pdfwrite \
      -dCompatibilityLevel=1.4 \
      -dPDFSETTINGS=${config.gsSetting} \
      -dNOPAUSE -dBATCH -dQUIET \
      -sOutputFile="${outputPath}" \
      "${inputPath}"`;

    await execAsync(gsCommand, { timeout: 120000 });

    const inputSize = (await fs.stat(inputPath)).size;
    const outputSize = (await fs.stat(outputPath)).size;
    await fs.unlink(inputPath);

    res.json({
      success: true,
      level: level,
      expectedSavings: config.expectedSavings,
      originalSize: inputSize,
      compressedSize: outputSize,
      compressionRatio: ((1 - outputSize / inputSize) * 100).toFixed(1),
      downloadUrl: `${req.protocol}://${req.get('host')}/downloads/${outputFilename}`
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
