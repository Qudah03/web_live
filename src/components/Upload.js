// src/Upload.js
import React, { useState, useEffect } from 'react';
import EmbeddedViewer from './EmbeddedViewer';
import RerunIframeViewer from './RerunIframeViewer';
import '../styles.css';

export default function Upload() {
  const [fileName, setFileName] = useState(null);
  const [rerunVisible, setRerunVisible] = useState(false);
  const [serverStatus, setServerStatus] = useState('stopped');
  const [loading, setLoading] = useState(false);
  const [rrdArrayBuffer, setRrdArrayBuffer] = useState(null);
  const [showEmbeddedViewer, setShowEmbeddedViewer] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  useEffect(() => {
    checkServerStatus();
    const interval = setInterval(checkServerStatus, 3000);
    return () => clearInterval(interval);
  }, []);


  const checkServerStatus = async () => {
    try {
      const response = await fetch("http://localhost:5002/server-status");
      const data = await response.json();
      setServerStatus(data.running ? 'running' : 'stopped');
      if (data.running) {
        setRerunVisible(true);
      } else {
        setRerunVisible(false);
      }
    } catch (error) {
      console.error('Error checking server status:', error);
      setServerStatus('stopped');
      setRerunVisible(false);
    }
  };

  // const startRerunServer = async () => {
  //   setLoading(true);
  //   try {
  //     const response = await fetch("http://localhost:5002/start-server", {
  //       method: "POST",
  //     });

  //     if (response.ok) {
  //       setServerStatus('running');
  //       setRerunVisible(true);
  //       setTimeout(checkServerStatus, 2000);
  //     } else {
  //       const errorText = await response.text();
  //       alert(`Failed to start rerun server: ${errorText}`);
  //     }
  //   } catch (error) {
  //     alert("Error starting rerun server");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // const stopRerunServer = async () => {
  //   setLoading(true);
  //   try {
  //     const response = await fetch("http://localhost:5002/stop-server", {
  //       method: "POST",
  //     });

  //     if (response.ok) {
  //       setServerStatus('stopped');
  //       setRerunVisible(false);
  //       setRrdArrayBuffer(null);
  //       setShowEmbeddedViewer(false);
  //       setUploadError(null);
  //       setTimeout(checkServerStatus, 1000);
  //     } else {
  //       const errorText = await response.text();
  //       alert(`Failed to stop rerun server: ${errorText}`);
  //     }
  //   } catch (error) {
  //     console.error('Error stopping rerun server:', error);
  //     alert("Error stopping rerun server");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    console.log('🔄 Starting file upload:', file.name, 'Size:', file.size, 'bytes');
    setFileName(file.name);
    setLoading(true);
    setUploadError(null);

    try {
      // First, read the file for the embedded viewer
      console.log('📖 Reading file data...');
      const arrayBuffer = await file.arrayBuffer();
      const rrdData = new Uint8Array(arrayBuffer);
      console.log('✅ File data read successfully. Size:', rrdData.length, 'bytes');
      
      // Then upload to server for gRPC processing
      console.log('🚀 Uploading to server...');
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("http://localhost:5002/upload", {
        method: "POST",
        body: formData,
      });

      console.log('📡 Server response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Upload successful:', result);
        
        // Set the RRD data for embedded viewer
        setRrdArrayBuffer(rrdData);
        setShowEmbeddedViewer(true);
        setRerunVisible(true);
        
        console.log('🎯 Embedded viewer data set. Array buffer length:', rrdData.length);
        
        alert("RRD file uploaded successfully! View in embedded viewer down below!");
        
        // Auto-open local web viewer
        // try {
        //   window.open("http://localhost:3000/viewer", "_blank");
        // } catch (viewerError) {
        //   console.log("Could not auto-open local web viewer:", viewerError);
        // }
      } else {
        const errorText = await response.text();
        setUploadError(`Upload failed: ${errorText}`);
        alert(`Upload failed: ${errorText}`);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadError(`Error uploading file: ${error.message}`);
      alert("Error uploading file or server not running");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="centered">
      <h2>RRD File Viewer with Blueprint</h2>

      <div style={{ marginBottom: '20px' }}>
        <strong>Server Status: </strong>
        <span style={{ 
          color: serverStatus === 'running' ? 'green' : 'red',
          fontWeight: 'bold'
        }}>
          {serverStatus === 'running' ? '🟢 Running' : '🔴 Stopped'}
        </span>
      </div>

      <div style={{ marginBottom: '20px' }}>
        {/* <button 
          onClick={startRerunServer}
          disabled={loading || serverStatus === 'running'}
          style={{
            padding: '10px 20px',
            backgroundColor: serverStatus === 'running' ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: serverStatus === 'running' ? 'not-allowed' : 'pointer',
            marginRight: '10px'
          }}
        >
          {loading ? 'Starting...' : 'Start Rerun Server'}
        </button>

        <button 
          onClick={stopRerunServer}
          disabled={loading || serverStatus === 'stopped'}
          style={{
            padding: '10px 20px',
            backgroundColor: serverStatus === 'stopped' ? '#ccc' : '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: serverStatus === 'stopped' ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Stopping...' : 'Stop Rerun Server'}
        </button> */}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Upload RRD File</h3>
        <input 
          type="file" 
          accept=".rrd" 
          onChange={handleFileUpload}
          disabled={loading || serverStatus !== 'running'}
        />
        {fileName && <p>Selected: {fileName}</p>}
        {uploadError && (
          <p style={{ color: 'red', marginTop: '10px' }}>
            {uploadError}
          </p>
        )}
        {serverStatus !== 'running' && (
          <p style={{ color: 'orange' }}>
            Please start the Rerun server first before uploading files.
          </p>
        )}
      </div>

      {/* Embedded Viewer Section */}
      {showEmbeddedViewer && rrdArrayBuffer && (
        <div style={{ marginBottom: '20px' }}>
          <h3>📊 Embedded Rerun Viewer</h3>
          <p>Your RRD file is displayed below using the D1.rrd blueprint:</p>
          <EmbeddedViewer rrdData={rrdArrayBuffer} />
        </div>
      )}
      {/* {serverStatus === 'running' && (
        <div style={{ marginTop: '20px', width: '100%', height: '600px' }}>
          <h3>🌐 Rerun Web Viewer (embedded)</h3>
          <iframe
            title="Rerun Web Viewer"
            width="100%"
            height="100%"
            src={`https://app.rerun.io/version/0.23.4/index.html?url=http://localhost:5002/last-uploaded&url=http://localhost:5002/get-blueprint`}
            style={{ border: '1px solid #ddd', borderRadius: 4 }}
          />
        </div>
      )} */}
      {serverStatus === 'running' && (
        <>
          <h3>🌐 Rerun Web Viewer (embedded)</h3>
          <RerunIframeViewer />
        </>
      )}



      {/* Web Viewer Section 
      {rerunVisible && (
        <div>
          <h3>🌐 Web Viewer Options</h3>
          <p>Your data is being served on gRPC port 9876 with D1.rrd blueprint. You can view it using:</p>
          <div style={{ marginBottom: '20px' }}>
            <h4>Option 1: Rerun Web Viewer</h4>
            <p>
              <a 
                href="https://rerun.io/viewer?url=rerun+http://127.0.0.1:9876/proxy" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  padding: '10px 20px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '5px',
                  marginRight: '10px'
                }}
              >
                🌐 Open in Rerun Web Viewer
              </a>
              <button
                onClick={async () => {
                  try {
                    const response = await fetch("http://localhost:5002/viewer-url");
                    if (response.ok) {
                      const data = await response.json();
                      window.open(data.url, '_blank');
                    }
                  } catch (error) {
                    console.error("Error opening viewer:", error);
                  }
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                🔄 Refresh & Open Viewer
              </button>
            </p>
            
            <h4>Option 2: Native Rerun Viewer</h4>
            <p>Run in terminal:</p>
            <code style={{ 
              display: 'block', 
              backgroundColor: '#f8f9fa', 
              padding: '10px', 
              borderRadius: '5px',
              fontFamily: 'monospace'
            }}>
              rerun --connect rerun+http://127.0.0.1:9876/proxy
            </code>
          </div>
        </div>
      )}*/}

      {/* Instructions 
      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
        <h4>💡 How it works:</h4>
        <ol>
          <li><strong>Start Server:</strong> Launches rerun server with D1.rrd blueprint</li>
          <li><strong>Upload File:</strong> Your RRD file is processed and displayed using the D1.rrd layout</li>
          <li><strong>View Data:</strong> Choose between embedded viewer or web viewer</li>
        </ol>
      </div>*/}
    </div>
  );
}
