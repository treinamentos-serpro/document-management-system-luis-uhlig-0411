const { test } = require('node:test');
const assert = require('node:assert/strict');
const documentService = require('../src/services/documentService');
const documentUploadService = require('../src/services/documentUploadService');
const documentPresenter = require('../src/controllers/documentPresenter');
const documentRepository = require('../src/repositories/documentRepository');
const fileStorageRepository = require('../src/repositories/fileStorageRepository');

test('o serviço de upload registra metadados e a apresentação oculta a chave local', async () => {
  const owner = 'upload-service-test';
  const file = {
    originalname: 'documento.txt',
    size: 12,
    filename: 'stored-document',
  };

  const document = await documentUploadService.createDocument(file, owner);

  try {
    assert.strictEqual(documentRepository.findById(document.id), document);
    assert.strictEqual(document.owner, owner);
    assert.strictEqual(document.originalName, file.originalname);
    assert.strictEqual(document.size, file.size);
    assert.strictEqual(document.storageKey, file.filename);
    assert.ok(Number.isFinite(Date.parse(document.uploadedAt)));
    assert.deepStrictEqual(Object.keys(documentPresenter.toPublicDocument(document)).sort(), [
      'id',
      'originalName',
      'owner',
      'size',
      'uploadedAt',
    ]);
  } finally {
    documentRepository.remove(document.id);
  }
});

test('o serviço de upload remove o arquivo se o registro dos metadados falhar', async (t) => {
  const originalAdd = documentRepository.add;
  const originalRemoveFile = fileStorageRepository.removeFile;
  const expectedError = new Error('registration failed');
  let removedStorageKey;

  documentRepository.add = () => {
    throw expectedError;
  };
  fileStorageRepository.removeFile = async (storageKey) => {
    removedStorageKey = storageKey;
  };

  t.after(() => {
    documentRepository.add = originalAdd;
    fileStorageRepository.removeFile = originalRemoveFile;
  });

  await assert.rejects(
    documentUploadService.createDocument({
      originalname: 'documento.txt',
      size: 12,
      filename: 'stored-document',
    }, 'upload-service-test'),
    (error) => error === expectedError,
  );
  assert.strictEqual(removedStorageKey, 'stored-document');
});

test('o serviço de documentos filtra por proprietário e restringe downloads', () => {
  const owner = 'query-service-test';
  const firstDocument = {
    id: 'first',
    owner,
    uploadedAt: '2026-01-01T00:00:00.000Z',
    storageKey: 'first-file',
    originalName: 'first.txt',
  };
  const secondDocument = {
    id: 'second',
    owner,
    uploadedAt: '2026-01-02T00:00:00.000Z',
    storageKey: 'second-file',
    originalName: 'second.txt',
  };
  const otherOwnerDocument = {
    id: 'other',
    owner: 'another-owner',
    uploadedAt: '2026-01-03T00:00:00.000Z',
    storageKey: 'other-file',
  };

  [firstDocument, secondDocument, otherOwnerDocument].forEach(documentRepository.add);

  try {
    assert.deepStrictEqual(
      documentService.listDocuments(owner).map(({ id }) => id),
      ['second', 'first'],
    );
    assert.strictEqual(documentService.getDownload('another-owner', firstDocument.id), null);
    assert.strictEqual(documentService.getDownload(owner, 'missing'), null);
    assert.deepStrictEqual(documentService.getDownload(owner, secondDocument.id), {
      document: secondDocument,
      filePath: fileStorageRepository.getFilePath(secondDocument.storageKey),
    });
  } finally {
    [firstDocument, secondDocument, otherOwnerDocument]
      .forEach(({ id }) => documentRepository.remove(id));
  }
});
