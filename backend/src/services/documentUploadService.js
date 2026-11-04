const { randomUUID } = require('node:crypto');
const documentRepository = require('../repositories/documentRepository');
const fileStorageRepository = require('../repositories/fileStorageRepository');

async function createDocument(file, owner) {
  const document = {
    id: randomUUID(),
    originalName: file.originalname,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner,
    storageKey: file.filename,
  };

  try {
    return documentRepository.add(document);
  } catch (error) {
    await fileStorageRepository.removeFile(file.filename).catch(() => {});
    throw error;
  }
}

module.exports = { createDocument };
