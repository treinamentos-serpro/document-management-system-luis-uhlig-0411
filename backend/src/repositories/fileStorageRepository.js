const fs = require('node:fs');
const fsPromises = require('node:fs/promises');
const path = require('node:path');

const storageDir = path.resolve(
  process.env.STORAGE_DIR || path.join(__dirname, '../../storage'),
);

function ensureStorageDirectory() {
  fs.mkdirSync(storageDir, { recursive: true });
}

function getFilePath(storageKey) {
  if (!storageKey || path.basename(storageKey) !== storageKey) {
    throw new Error('Invalid storage key');
  }

  return path.join(storageDir, storageKey);
}

async function removeFile(storageKey) {
  try {
    await fsPromises.unlink(getFilePath(storageKey));
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

module.exports = { storageDir, ensureStorageDirectory, getFilePath, removeFile };