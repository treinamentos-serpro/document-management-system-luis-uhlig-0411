const documentRepository = require('../repositories/documentRepository');
const fileStorageRepository = require('../repositories/fileStorageRepository');

function listDocuments(owner) {
  return documentRepository.findByOwner(owner);
}

function getDownload(owner, id) {
  const document = documentRepository.findById(id);

  if (!document || document.owner !== owner) {
    return null;
  }

  return {
    document,
    filePath: fileStorageRepository.getFilePath(document.storageKey),
  };
}

module.exports = { listDocuments, getDownload };