import { useEffect, useState } from 'react';
import { getDocuments } from '../services/documentApi.js';
import DownloadButton from './DownloadButton.jsx';

function formatSize(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const units = ['KB', 'MB', 'GB'];
  let size = bytes / 1024;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(size)} ${units[unitIndex]}`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function DocumentList({ refreshVersion }) {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [retryVersion, setRetryVersion] = useState(0);

  useEffect(() => {
    let isActive = true;

    async function loadDocuments() {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const result = await getDocuments();
        if (isActive) {
          setDocuments(result);
        }
      } catch (error) {
        if (isActive) {
          setErrorMessage(error.message);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadDocuments();
    return () => {
      isActive = false;
    };
  }, [refreshVersion, retryVersion]);

  return (
    <section className="documents-section" aria-labelledby="documents-title">
      <div className="section-heading documents-heading">
        <div>
          <p className="eyebrow">ARQUIVOS</p>
          <h2 id="documents-title">Seus documentos</h2>
        </div>
        <span className="document-count" aria-label={`${documents.length} documentos`}>
          {documents.length}
        </span>
      </div>

      {isLoading ? (
        <p className="list-message" role="status">Carregando documentos...</p>
      ) : errorMessage ? (
        <div className="list-message error-state" role="alert">
          <p>{errorMessage}</p>
          <button className="text-button" type="button" onClick={() => setRetryVersion((version) => version + 1)}>
            Tentar novamente
          </button>
        </div>
      ) : documents.length === 0 ? (
        <p className="list-message empty-state">Nenhum documento enviado ainda.</p>
      ) : (
        <div className="table-scroll">
          <table className="document-table">
            <thead>
              <tr>
                <th scope="col">Nome</th>
                <th scope="col">Tamanho</th>
                <th scope="col">Enviado em</th>
                <th scope="col"><span className="visually-hidden">Ações</span></th>
              </tr>
            </thead>
            <tbody>
              {documents.map((document) => (
                <tr key={document.id}>
                  <td className="document-name" title={document.originalName}>{document.originalName}</td>
                  <td className="muted-cell">{formatSize(document.size)}</td>
                  <td className="muted-cell">{formatDate(document.uploadedAt)}</td>
                  <td className="action-cell"><DownloadButton document={document} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}