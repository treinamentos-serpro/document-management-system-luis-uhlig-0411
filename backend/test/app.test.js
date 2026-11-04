const { test } = require('node:test');
const assert = require('node:assert');
const { randomUUID } = require('node:crypto');
const http = require('node:http');
const path = require('node:path');
const originalMaxFileSize = process.env.MAX_FILE_SIZE_BYTES;
process.env.MAX_FILE_SIZE_BYTES = '1024';
const app = require('../src/app');
if (originalMaxFileSize === undefined) {
  delete process.env.MAX_FILE_SIZE_BYTES;
} else {
  process.env.MAX_FILE_SIZE_BYTES = originalMaxFileSize;
}
const documentRepository = require('../src/repositories/documentRepository');
const fileStorageRepository = require('../src/repositories/fileStorageRepository');

test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('upload, listagem e download respeitam o usuário dono', async (t) => {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const owner = `test-${randomUUID()}`;
  let uploadedId;

  t.after(async () => {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));

    for (const document of documentRepository.findByOwner(owner)) {
      await fileStorageRepository.removeFile(document.storageKey);
      documentRepository.remove(document.id);
    }
  });

  const missingOwnerResponse = await fetch(`${baseUrl}/documents`);
  assert.strictEqual(missingOwnerResponse.status, 400);

  const missingFileResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': owner },
  });
  assert.strictEqual(missingFileResponse.status, 400);

  const invalidIdResponse = await fetch(`${baseUrl}/documents/not-a-uuid/download`, {
    headers: { 'X-User-Id': owner },
  });
  assert.strictEqual(invalidIdResponse.status, 400);

  const unknownDocumentResponse = await fetch(
    `${baseUrl}/documents/${randomUUID()}/download`,
    { headers: { 'X-User-Id': owner } },
  );
  assert.strictEqual(unknownDocumentResponse.status, 404);

  const oversizedForm = new FormData();
  oversizedForm.append('file', new Blob([new Uint8Array(1025)]), 'grande.bin');
  const oversizedResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': owner },
    body: oversizedForm,
  });
  assert.strictEqual(oversizedResponse.status, 413);

  const extraFieldForm = new FormData();
  extraFieldForm.append('unexpected', 'valor');
  extraFieldForm.append('file', new Blob(['arquivo']), 'extra.txt');
  const extraFieldResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': owner },
    body: extraFieldForm,
  });
  assert.strictEqual(extraFieldResponse.status, 400);

  const form = new FormData();
  form.append('file', new Blob(['conteudo de teste'], { type: 'text/plain' }), 'teste.txt');
  const uploadResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': owner },
    body: form,
  });

  assert.strictEqual(uploadResponse.status, 201, await uploadResponse.clone().text());
  const uploadedDocument = await uploadResponse.json();
  uploadedId = uploadedDocument.id;
  assert.deepStrictEqual(Object.keys(uploadedDocument).sort(), [
    'id',
    'originalName',
    'owner',
    'size',
    'uploadedAt',
  ]);
  assert.strictEqual(uploadedDocument.originalName, 'teste.txt');

  const ownerListResponse = await fetch(`${baseUrl}/documents`, {
    headers: { 'X-User-Id': owner },
  });
  assert.strictEqual(ownerListResponse.status, 200);
  assert.strictEqual((await ownerListResponse.json())[0].id, uploadedId);

  const otherOwnerListResponse = await fetch(`${baseUrl}/documents`, {
    headers: { 'X-User-Id': 'outro-usuario' },
  });
  assert.deepStrictEqual(await otherOwnerListResponse.json(), []);

  const forbiddenDownloadResponse = await fetch(
    `${baseUrl}/documents/${uploadedId}/download`,
    { headers: { 'X-User-Id': 'outro-usuario' } },
  );
  assert.strictEqual(forbiddenDownloadResponse.status, 404);

  const downloadResponse = await fetch(`${baseUrl}/documents/${uploadedId}/download`, {
    headers: { 'X-User-Id': owner },
  });
  assert.strictEqual(downloadResponse.status, 200);
  assert.match(downloadResponse.headers.get('content-disposition'), /filename="teste\.txt"/);
  assert.strictEqual(await downloadResponse.text(), 'conteudo de teste');

  const missingFileDocument = {
    id: randomUUID(),
    originalName: 'ausente.txt',
    size: 1,
    uploadedAt: new Date().toISOString(),
    owner,
    storageKey: randomUUID(),
  };
  documentRepository.add(missingFileDocument);
  const missingStoredFileResponse = await fetch(
    `${baseUrl}/documents/${missingFileDocument.id}/download`,
    { headers: { 'X-User-Id': owner } },
  );
  assert.strictEqual(missingStoredFileResponse.status, 404);
});

test('a chave de armazenamento só aceita UUIDs contidos no diretório local', () => {
  const storageKey = randomUUID();

  assert.strictEqual(
    fileStorageRepository.getFilePath(storageKey),
    path.join(fileStorageRepository.storageDir, storageKey),
  );
  assert.throws(() => fileStorageRepository.getFilePath('..'), /Invalid storage key/);
  assert.throws(() => fileStorageRepository.getFilePath('../outside'), /Invalid storage key/);
  assert.throws(() => fileStorageRepository.getFilePath('/tmp/outside'), /Invalid storage key/);
});
