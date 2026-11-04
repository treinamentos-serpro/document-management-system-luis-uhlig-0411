const documents = new Map();

function add(document) {
  documents.set(document.id, document);
  return document;
}

function findById(id) {
  return documents.get(id) || null;
}

function findByOwner(owner) {
  return [...documents.values()]
    .filter((document) => document.owner === owner)
    .sort((left, right) => right.uploadedAt.localeCompare(left.uploadedAt));
}

function remove(id) {
  return documents.delete(id);
}

module.exports = { add, findById, findByOwner, remove };