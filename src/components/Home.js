import React, { useRef, useState } from 'react';
import Upload from './Upload';
import LiveStream from './LiveStream';
import GraphSelector from './GraphSelector'; 
import '../styles.css';

export default function Home() {
  const uploadRef = useRef(null);
  const liveRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToSection = (ref) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const [showUpload, setShowUpload] = useState(false); 
  const [showLive, setShowLive] = useState(false);   
  const [selectedGraphs, setSelectedGraphs] = useState([]);
  const [isValidSelection, setIsValidSelection] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleGraphSelection = (selected, isValid) => {
    setSelectedGraphs(selected);
    setIsValidSelection(isValid);
  };

  const handleStart = () => {
    alert(`Starting with selected graphs: ${selectedGraphs.map(opt => opt.label).join(', ')}`);
  };

  const handleUploadButtonClick = () => {
    fileInputRef.current.click(); // open file picker
  };

  const handleFileChosen = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setShowUpload(true);
      setTimeout(() => scrollToSection(uploadRef), 100);
    }
  };

  return (
    <div>
      {/* Header Section */}
      <div className="centered">
        <img src="/logo.png" alt="Company Logo" style={{ width: 250 }} />
        <h1>Welcome to CSI visualizer</h1>
        <p>This app lets you visualize .rrd files or live data streams using Rerun.</p>

        <div className="button-group">
          <button onClick={handleUploadButtonClick}>
            Upload RRD File
          </button>
          <button
            onClick={() => {
              setShowLive(true);
              setTimeout(() => scrollToSection(liveRef), 100);
            }}
          >
            Live Stream
          </button>
        </div>

        {/* Hidden file input */}
        <input
          type="file"
          accept=".rrd"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChosen}
        />

        <div style={{ marginTop: '20px', fontStyle: 'italic', color: '#555' }}>
          <p>Choose either to upload a file or view the live stream to start visualizing CSI data.</p>
        </div>

        <div style={{ marginTop: '40px' }}>
          <GraphSelector onSelectionChange={handleGraphSelection} />
          <button
            onClick={handleStart}
            disabled={!isValidSelection}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              fontSize: '16px',
              backgroundColor: isValidSelection ? '#007bff' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: isValidSelection ? 'pointer' : 'not-allowed',
            }}
          >
            Start
          </button>
        </div>
      </div>

      {/* Upload Section */}
      {showUpload && (
        <div ref={uploadRef} style={{ padding: '60px 20px' }}>
          <h2>Upload RRD File</h2>
          <Upload preselectedFile={selectedFile} />
        </div>
      )}

      {/* Live Stream Section */}
      {showLive && (
        <div ref={liveRef} style={{ padding: '60px 20px' }}>
          <h2>Live Stream</h2>
          <LiveStream />
        </div>
      )}
    </div>
  );
}
