import React, { useEffect, useState } from 'react';
import '../styles.css';

export default function Upload({ preselectedFile }) {
  const [fileName, setFileName] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleFileUpload = async (file) => {
    if (!file) return;
    setFileName(file.name);
    setLoading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("http://localhost:5002/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        await response.json();
        setUploadSuccess(true);
      } else {
        const errorText = await response.text();
        setUploadError(`Upload failed: ${errorText}`);
      }
    } catch (error) {
      setUploadError(`Error uploading file: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Auto-upload if file came from Home.js
  useEffect(() => {
    if (preselectedFile) {
      handleFileUpload(preselectedFile);
    }
  }, [preselectedFile]);

  return (
    <div className="centered">
      <div style={{ marginBottom: '20px' }}>
        {/* Only show manual file picker if no file was preselected */}
        {!preselectedFile && (
          <input
            type="file"
            accept=".rrd"
            onChange={(e) => handleFileUpload(e.target.files[0])}
            disabled={loading}
          />
        )}
        {fileName && <h3>Selected: {fileName}</h3>}
        {loading && <p style={{ color: 'blue' }}>Uploading...</p>}
        {uploadSuccess && <p style={{ color: 'green' }}>Upload successful!</p>}
        {uploadError && <p style={{ color: 'red' }}>❌ {uploadError}</p>}
      </div>

      {uploadSuccess && (
        <div style={{ marginTop: '15px' }}>
          {/* <h4>🎯 Your RRD File Viewer:</h4> */}
          <div style={{
            border: '2px solid #007bff',
            borderRadius: '5px',
            overflow: 'hidden',
            marginTop: '10px',
            width: '200vh',
            height: '100vh'
          }}>
            <iframe
              src="https://app.rerun.io/version/0.24.0/index.html?url=http://localhost:5002/last-uploaded&url=http://localhost:5002/get-blueprint"
              width="100%"
              height="100%"
              style={{ border: 'none' }}
              title="Rerun RRD Viewer"
            />
          </div>
        </div>
      )}
    </div>
  );
}
