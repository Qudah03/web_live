import React, { useEffect, useState } from 'react';

export default function EmbeddedViewer({ rrdData }) {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [fileInfo, setFileInfo] = useState(null);

  useEffect(() => {
    if (rrdData) {
      try {
        setIsLoading(true);
        setError(null);
        
        // Extract some basic information about the RRD file
        const info = {
          size: rrdData.length,
          sizeKB: (rrdData.length / 1024).toFixed(2),
          type: rrdData.constructor.name,
          firstBytes: Array.from(rrdData.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(' '),
          timestamp: new Date().toISOString()
        };
        
        setFileInfo(info);
        setMessage('RRD data loaded and analyzed successfully!');
        setIsLoading(false);
      } catch (err) {
        console.error('Error processing RRD data:', err);
        setError(err.message);
        setIsLoading(false);
      }
    }
  }, [rrdData]);

  if (error) {
    return (
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#fee', 
        border: '1px solid #fcc',
        borderRadius: '5px',
        color: '#c00'
      }}>
        <h4>Error loading viewer:</h4>
        <p>{error}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: '5px'
      }}>
        <p>Loading viewer...</p>
      </div>
    );
  }

  if (!rrdData) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: '5px'
      }}>
        <p>No RRD data available</p>
      </div>
    );
  }

  return (
    <div style={{ 
      width: '100%', 
      padding: '20px',
      marginTop: '20px',
      backgroundColor: '#e8f5e8',
      border: '1px solid #4caf50',
      borderRadius: '5px'
    }}>
      <h3>✅ RRD Data Processed Successfully</h3>
      <p>{message}</p>
      
      {fileInfo && (
        <div style={{ marginTop: '15px' }}>
          <h4>📊 File Information:</h4>
          <div style={{ 
            backgroundColor: '#f8f9fa',
            padding: '15px',
            borderRadius: '5px',
            fontFamily: 'monospace',
            fontSize: '14px'
          }}>
            <p><strong>Size:</strong> {fileInfo.sizeKB} KB ({fileInfo.size} bytes)</p>
            <p><strong>Type:</strong> {fileInfo.type}</p>
            <p><strong>Processed:</strong> {fileInfo.timestamp}</p>
            <p><strong>First 16 bytes:</strong> {fileInfo.firstBytes}</p>
          </div>
        </div>
      )}
      
      <div style={{ marginTop: '15px' }}>
        <h4>🌐 Viewing Options:</h4>
        <p>Your RRD data has been processed and is ready for viewing.</p>
        <a 
          href="http://localhost:3000/viewer"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-block',
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '5px',
            marginTop: '10px',
            marginRight: '10px'
          }}
        >
          🎯 Open in Local Web Viewer
        </a>
        <a 
          href="https://rerun.io/viewer?url=rerun+http://127.0.0.1:9876/proxy"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-block',
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '5px',
            marginTop: '10px'
          }}
        >
          🚀 Open in Rerun Cloud Viewer
        </a>
      </div>
      
      <div style={{ 
        marginTop: '15px',
        padding: '10px',
        backgroundColor: '#fff3cd',
        border: '1px solid #ffeaa7',
        borderRadius: '3px'
      }}>
        <p><strong>📋 Alternative viewing method:</strong></p>
        <p>Run this command in your terminal:</p>
        <code style={{ 
          display: 'block',
          backgroundColor: '#f8f9fa',
          padding: '5px',
          borderRadius: '3px',
          marginTop: '5px'
        }}>
          rerun --connect rerun+http://127.0.0.1:9876/proxy
        </code>
      </div>
    </div>
  );
}
