import { useRef, useState } from 'react';
import { uploadDocument } from '../services/documentApi.js';

export default function UploadComponent({ onUploadComplete }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef(null);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!selectedFile || isUploading) {
      return;
    }

    setIsUploading(true);
    setMessage('');

    try {
      await uploadDocument(selectedFile);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setMessage('Documento enviado.');
      onUploadComplete();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section className="upload-section" aria-labelledby="upload-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">ADICIONAR</p>
          <h2 id="upload-title">Enviar documento</h2>
        </div>
      </div>

      <form className="upload-form" onSubmit={handleSubmit}>
        <label className="file-picker" htmlFor="document-file">
          <span className="file-picker-icon" aria-hidden="true">+</span>
          <span className="file-picker-copy">
            <strong>{selectedFile ? selectedFile.name : 'Escolher arquivo'}</strong>
            <span>{selectedFile ? 'Pronto para enviar' : 'Qualquer formato, até 10 MiB'}</span>
          </span>
          <input
            ref={fileInputRef}
            id="document-file"
            name="file"
            type="file"
            onChange={(event) => {
              setSelectedFile(event.target.files?.[0] || null);
              setMessage('');
            }}
          />
        </label>

        <button className="primary-button" type="submit" disabled={!selectedFile || isUploading}>
          {isUploading ? 'Enviando...' : 'Enviar documento'}
        </button>

        {message && (
          <p className={`feedback-message ${selectedFile ? 'is-error' : 'is-success'}`} role="status">
            {message}
          </p>
        )}
      </form>
    </section>
  );
}