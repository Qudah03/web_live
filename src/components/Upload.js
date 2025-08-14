// src/components/Upload.js - Simplified iframe-only version
import React, { useState } from 'react';
import '../styles.css';

export default function Upload() {
  const [fileName, setFileName] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    console.log('🔄 Starting file upload:', file.name, 'Size:', file.size, 'bytes');
    setFileName(file.name);
    setLoading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      // Upload file to server for iframe processing
      console.log('🚀 Uploading to server...');
      const formData = new FormData();  // ← Your .rrd file goes here
      formData.append("file", file);

      const response = await fetch("http://localhost:5002/upload", {
        method: "POST",
        body: formData, // ← Contains your .rrd file
      });

      console.log('📡 Server response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Upload successful:', result);
        
        setUploadSuccess(true);
        
        // Don't auto-open new tab anymore - we'll show inline iframe
        // setTimeout(() => {
        //   try {
        //     window.open("http://localhost:3000/viewer", "_blank");
        //   } catch (viewerError) {
        //     console.log("Could not auto-open iframe web viewer:", viewerError);
        //   }
        // }, 1000);
      } else {
        const errorText = await response.text();
        setUploadError(`Upload failed: ${errorText}`);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadError(`Error uploading file: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="centered">
      <h2>RRD File Viewer (Iframe Mode)</h2>
      <p>Upload your .rrd files to view them in the iframe-based Rerun viewer</p>

      <div style={{ marginBottom: '20px' }}>
        <h3>Upload RRD File</h3>
        <input 
          type="file" 
          accept=".rrd" 
          onChange={handleFileUpload}
          disabled={loading}
        />
        {fileName && <p>Selected: {fileName}</p>}
        {loading && <p style={{ color: 'blue' }}>Uploading...</p>}
        {uploadSuccess && <p style={{ color: 'green' }}>✅ Upload successful!</p>}
        {uploadError && (
          <p style={{ color: 'red', marginTop: '10px' }}>
            ❌ {uploadError}
          </p>
        )}
      </div>

      {/* Instructions */}
      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
        <h4>💡 How it works (Iframe Mode):</h4>
        <ol>
          <li><strong>Upload File:</strong> Select and upload your .rrd file</li>
          <li><strong>File Processing:</strong> File is saved to the server for iframe access</li>
          <li><strong>View Data:</strong> The viewer will appear below after upload</li>
        </ol>
        
        {uploadSuccess && (
          <div style={{ marginTop: '15px' }}>
            <h4>🎯 Your RRD File Viewer:</h4>
            <div style={{ 
              border: '2px solid #007bff', 
              borderRadius: '5px', 
              overflow: 'hidden',
              marginTop: '10px',
              width: '200vh',
              height: '100vh'
            }}>
              <iframe 
                // The iframe loads your uploaded file in its original format:
                src="https://app.rerun.io/version/0.24.0/index.html?url=http://localhost:5002/last-uploaded"
                //                                                     ↑
                //                                              Your uploaded file (original layout)              
                width="100%" 
                height="100%" 
                style={{ border: 'none' }}
                title="Rerun RRD Viewer"
              />
            </div>
            <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
              💡 You can also <a 
                href="http://localhost:3000/viewer"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#007bff', textDecoration: 'underline' }}
              >
                open in a new tab
              </a> for a larger view.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
