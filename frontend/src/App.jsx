import { useState } from 'react';
import DocumentList from './components/DocumentList.jsx';
import UploadComponent from './components/UploadComponent.jsx';
import { currentUserId } from './services/documentApi.js';
import './App.css';

export default function App() {
  const [refreshVersion, setRefreshVersion] = useState(0);

  function handleUploadComplete() {
    setRefreshVersion((version) => version + 1);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="DMS, início">
          <span className="brand-mark" aria-hidden="true">D</span>
          <span>DMS</span>
        </a>
        <div className="account-label">
          <span className="account-dot" aria-hidden="true" />
          <span>Conta</span>
          <strong>{currentUserId}</strong>
        </div>
      </header>

      <main className="workspace">
        <div className="page-heading">
          <div>
            <p className="eyebrow">BIBLIOTECA PESSOAL</p>
            <h1>Documentos</h1>
          </div>
          <p className="heading-note">Seus arquivos, em um só lugar.</p>
        </div>

        <div className="content-grid">
          <UploadComponent onUploadComplete={handleUploadComplete} />
          <DocumentList refreshVersion={refreshVersion} />
        </div>
      </main>
    </div>
  );
}