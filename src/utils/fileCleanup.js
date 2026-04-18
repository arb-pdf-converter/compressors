const fs = require('fs').promises;
const path = require('path');

const cleanupOldFiles = async () => {
  try {
    const uploadsDir = path.join(__dirname, '../../uploads');
    const files = await fs.readdir(uploadsDir);
    
    for (const file of files) {
      const filePath = path.join(uploadsDir, file);
      const stats = await fs.stat(filePath);
      
      // Delete files older than 1 hour
      if (Date.now() - stats.mtime.getTime() > 60 * 60 * 1000) {
        await fs.unlink(filePath);
        console.log(`🗑️ Cleaned up: ${file}`);
      }
    }
  } catch (error) {
    console.error('Cleanup error:', error);
  }
};

const deleteFile = async (filePath) => {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error('Delete error:', error);
  }
};

module.exports = { cleanupOldFiles, deleteFile };
