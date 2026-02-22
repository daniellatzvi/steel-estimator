import React, { useState, useRef } from 'react';

export default function UploadView({ onExtracted }) {
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState(null);
  const [progress, setProgress] = useState(null);
  const [jobName, setJobName] = useState('');
  const [file, setFile] = useState(null);
  const fileRef = useRef();

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    if (!jobName && f.name) {
      setJobName(f.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '));
    }
    setStatus({ type: 'info', message: `Selected: ${f.name} (${(f.size / 1024).toFixed(0)} KB)` });
    setProgress(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleSubmit = async () => {
    if (!file) {
      setStatus({ type: 'error', message: 'Please select a drawing file first.' });
      return;
    }

    setStatus({ type: 'loading', message: 'Uploading drawing...' });
    setProgress(null);

    const formData = new FormData();
    formData.append('drawing', file);

    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        setStatus({ type: 'error', message: data.error || 'Extraction failed.' });
        return;
      }

      // Handle SSE streaming response
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));

            if (data.error) {
              setStatus({ type: 'error', message: data.error });
              return;
            }

            if (data.status) {
              setStatus({ type: 'loading', message: data.status });
              if (data.page && data.totalPages) {
                setProgress({ page: data.page, total: data.totalPages });
              }
            }

            if (data.done) {
              const members = data.members || [];
              if (members.length === 0) {
                setStatus({ type: 'error', message: 'No steel members found. Try Manual Entry and add members yourself.' });
                setTimeout(() => onExtracted([], jobName || 'New Job'), 1500);
              } else {
                setStatus({ type: 'success', message: `Found ${members.length} members across ${data.pages || 1} page(s). Review and correct before finalizing.` });
                setTimeout(() => onExtracted(members, jobName), 1000);
              }
            }
          } catch(e) {}
        }
      }

    } catch (err) {
      setStatus({ type: 'error', message: `Error: ${err.message}` });
    }
  };

  return (
    <div className="upload-view">
      <div className="upload-heading">
        <h1>New Estimate</h1>
        <p>Upload a structural drawing — AI will extract steel members automatically</p>
      </div>

      <div className="job-input-wrap">
        <div className="field">
          <label className="section-label">Job Name</label>
          <input
            type="text"
            placeholder="e.g. Smith Warehouse — Mezzanine Framing"
            value={jobName}
            onChange={e => setJobName(e.target.value)}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border2)',
              color: 'var(--text)',
              fontFamily: 'var(--sans)',
              fontSize: '14px',
              padding: '10px 14px',
              outline: 'none',
              width: '100%',
            }}
          />
        </div>
      </div>

      <div
        className={`drop-zone ${dragging ? 'drag-over' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.tiff,.tif"
          onChange={e => handleFile(e.target.files[0])}
          style={{ display: 'none' }}
        />
        <div className="drop-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14,2 14,8 20,8"/>
            <line x1="12" y1="18" x2="12" y2="12"/>
            <polyline points="9,15 12,12 15,15"/>
          </svg>
        </div>
        <div className="drop-title">
          {file ? file.name : 'Drop drawing here or click to browse'}
        </div>
        <div className="drop-sub">
          {file ? `${(file.size / 1024).toFixed(0)} KB — ready to extract` : 'Structural plans, shop drawings, any page format'}
        </div>
        <div className="drop-types">PDF · PNG · JPG · TIFF</div>
      </div>

      {status && (
        <div className={`status-bar ${status.type === 'error' ? 'error' : status.type === 'success' ? 'success' : ''}`}>
          {status.type === 'loading' && <div className="spinner" />}
          <div>
            {status.message}
            {progress && (
              <div style={{ marginTop: 6 }}>
                <div style={{ 
                  height: 3, 
                  background: 'var(--border2)', 
                  marginTop: 6,
                  width: '100%'
                }}>
                  <div style={{ 
                    height: '100%', 
                    background: 'var(--accent)', 
                    width: `${(progress.page / progress.total) * 100}%`,
                    transition: 'width 0.3s'
                  }} />
                </div>
                <div style={{ fontSize: 11, marginTop: 4, fontFamily: 'var(--mono)', color: 'var(--text3)' }}>
                  Page {progress.page} of {progress.total}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 560 }}>
        <button
          className="btn btn-accent"
          style={{ flex: 1, justifyContent: 'center', padding: '12px' }}
          onClick={handleSubmit}
          disabled={status?.type === 'loading'}
        >
          {status?.type === 'loading' ? 'Extracting...' : 'Extract & Estimate'}
        </button>
        <button
          className="btn"
          style={{ justifyContent: 'center' }}
          onClick={() => onExtracted([], jobName || 'New Job')}
        >
          Manual Entry
        </button>
      </div>

      <p style={{ color: 'var(--text3)', fontSize: 12, fontFamily: 'var(--mono)', textAlign: 'center' }}>
        Analyzes each page individually — works on plans, elevations, and details
      </p>
    </div>
  );
}
