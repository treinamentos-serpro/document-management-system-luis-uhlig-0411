const multer = require('multer');

function errorController(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof multer.MulterError) {
    const isTooLarge = error.code === 'LIMIT_FILE_SIZE';
    return res.status(isTooLarge ? 413 : 400).json({
      error: {
        code: isTooLarge ? 'UPLOAD_TOO_LARGE' : 'INVALID_UPLOAD',
        message: isTooLarge
          ? 'O arquivo excede o tamanho máximo permitido.'
          : 'A requisição de upload é inválida.',
      },
    });
  }

  return res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Ocorreu um erro interno ao processar a requisição.',
    },
  });
}

module.exports = errorController;