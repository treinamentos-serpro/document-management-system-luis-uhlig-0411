const documentService = require('../services/documentService');

function requireUser(req, res, next) {
  const owner = req.get('X-User-Id')?.trim();

  if (!owner) {
    return res.status(400).json({
      error: {
        code: 'USER_ID_REQUIRED',
        message: 'O cabeçalho X-User-Id é obrigatório.',
      },
    });
  }

  req.owner = owner;
  return next();
}

async function upload(req, res, next) {
  if (!req.file) {
    return res.status(400).json({
      error: {
        code: 'FILE_REQUIRED',
        message: 'Envie um arquivo no campo file.',
      },
    });
  }

  try {
    const document = await documentService.createDocument(req.file, req.owner);
    return res.status(201).json(documentService.toPublicDocument(document));
  } catch (error) {
    return next(error);
  }
}

function list(req, res, next) {
  try {
    const documents = documentService.listDocuments(req.owner);
    return res.json(documents.map(documentService.toPublicDocument));
  } catch (error) {
    return next(error);
  }
}

function download(req, res, next) {
  if (!/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(req.params.id)) {
    return res.status(400).json({
      error: {
        code: 'INVALID_DOCUMENT_ID',
        message: 'O identificador do documento é inválido.',
      },
    });
  }

  try {
    const downloadInfo = documentService.getDownload(req.owner, req.params.id);

    if (!downloadInfo) {
      return res.status(404).json({
        error: {
          code: 'DOCUMENT_NOT_FOUND',
          message: 'Documento não encontrado.',
        },
      });
    }

    return res.download(downloadInfo.filePath, downloadInfo.document.originalName, (error) => {
      if (!error) {
        return;
      }

      if (res.headersSent) {
        return next(error);
      }

      if (error.code === 'ENOENT') {
        return res.status(404).json({
          error: {
            code: 'DOCUMENT_NOT_FOUND',
            message: 'Documento não encontrado.',
          },
        });
      }

      return next(error);
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { requireUser, upload, list, download };