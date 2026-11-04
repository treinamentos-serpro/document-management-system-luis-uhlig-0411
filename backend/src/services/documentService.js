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

function listDocuments(owner) {
  return documentRepository.findByOwner(owner);
}

function getDownload(owner, id) {
  const document = documentRepository.findById(id);

  if (!document || document.owner !== owner) {
    return null;
  }

  return {
    document: toPublicDocument(document),
    filePath: fileStorageRepository.getFilePath(document.storageKey),
  };
}

function toPublicDocument(document) {
  const { storageKey, ...publicDocument } = document;
  return publicDocument;
}

module.exports = { createDocument, listDocuments, getDownload, toPublicDocument };