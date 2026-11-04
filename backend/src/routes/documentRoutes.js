const { randomUUID } = require('node:crypto');
const express = require('express');
const multer = require('multer');
const documentController = require('../controllers/documentController');
const fileStorageRepository = require('../repositories/fileStorageRepository');

const defaultMaxFileSize = 10 * 1024 * 1024;
const maxFileSize = Number(process.env.MAX_FILE_SIZE_BYTES ?? defaultMaxFileSize);

if (!Number.isSafeInteger(maxFileSize) || maxFileSize <= 0) {
  throw new Error('MAX_FILE_SIZE_BYTES deve ser um inteiro positivo.');
}

fileStorageRepository.ensureStorageDirectory();

const upload = multer({
  storage: multer.diskStorage({
    destination: fileStorageRepository.storageDir,
    filename: (req, file, callback) => callback(null, randomUUID()),
  }),
  limits: { fileSize: maxFileSize },
});

const router = express.Router();

router.post('/upload', documentController.requireUser, upload.single('file'), documentController.upload);
router.get('/documents', documentController.requireUser, documentController.list);
router.get('/documents/:id/download', documentController.requireUser, documentController.download);

module.exports = router;