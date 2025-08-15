import React, { useRef, useState, useEffect } from 'react';
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
  const [selectedFile, setSelectedFile] = useState(null);
  const [showHeader, setShowHeader] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setShowHeader(false);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setShowHeader(true);
      } else if (!showLive && !showUpload) {
        setShowHeader(true); // Always show header 
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showLive, showUpload]);

  const handleUploadButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChosen = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setShowUpload(true);
      setShowLive(false);
      setShowHeader(true);
      setTimeout(() => scrollToSection(uploadRef), 100);
    }
  };

  return (
    <div>
      {/* Sticky Header */}
      {showHeader && (
        <header
          className={`sticky-header ${showHeader ? 'visible' : ''}`}
          style={{
            width: '100%',
            background: 'linear-gradient(to right,rgb(170, 122, 222),rgb(85, 141, 239))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            padding: '10px 30px',
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <img
            src="/logo1.png"
            alt="Company Logo"
            style={{ height: '40px', cursor: 'pointer' }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          />
          <img
            src="/rerunLogo.png"
            alt="Rerun Logo"
            style={{ height: '40px', cursor: 'pointer' }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          />
        </header>
      )}

      {/* Section 1: Logo & Welcome */}
      <div className="section" style={{ backgroundColor: '#fff' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              justifyContent: 'center',
              marginBottom: '20px',
            }}
          >
            <a
              href="https://www.connectedmotion.io/"
              target="_blank"
              rel="noopener noreferrer"
              title="Go to Connected Motion website"
            >
              <img src="/logo1.png" alt="Company Logo" style={{ width: '400px', cursor: 'pointer' }} />
            </a>
          </div>

          <h1>
    Channel State Information (CSI) <br /> Data Capture & Visualization Tool
  </h1>

        {/* <div style={{ display: 'flex', alignItems: 'center', gap: '20px', justifyContent: 'center', marginBottom: '20px' }}>
          <img src="/logo1.png" alt="Company Logo" style={{ width: '400px' }} />
        </div>
        <h1>Channnel State Information (CSI) <br/> Data Capture & Visualization Tool</h1> */}
        <p>
          This project is powered by{" "}
          <a
            href="https://rerun.io"
            target="_blank"
            rel="noopener noreferrer"
            title="Go to Rerun website"
            style={{ display: 'inline-block' }}
          >
            <img
              src="/RerunLogo.png"
              alt="Rerun Logo"
              style={{ width: '80px', verticalAlign: 'middle', cursor: 'pointer' }}
            />
          </a>
        </p>
       </div>

      {/* Section 2: Hand GIFs + Buttons + Graph Selector */}
      <div className="section" style={{ backgroundColor: '#f9f9f9' }}>
        <div className="hand-gifs">
          <div className="hand-item">
            <img src="/heatmap.gif" alt="Hand 1" style={{ width: '150px' }} />
            <p>Gesture 1</p>
          </div>
          <div className="hand-item">
            <img src="/heatmap.gif" alt="Hand 2" style={{ width: '150px' }} />
            <p>Gesture 2</p>
          </div>
          <div className="hand-item">
            <img src="/heatmap.gif" alt="Hand 3" style={{ width: '150px' }} />
            <p>Gesture 3</p>
          </div>
        </div>
        <p>csi-log.rs is a rerun.io based remote data logging & visualization interface for CSI data capture. csi-log-rs operates as a complementary interface for the Rust-based esp-csi-gui:rs local data capture tool.<br/>Unlike, esp-csi-gui-rs, csi:log-s supports remote logging and storage in the rerun.io RRD format allowing for time capture and replay of events.</p>
        <p>esp-csi:gui-rs is Rust-based cross-platform CSI live-monitoring tool that enables the collection of live CSI data locally from ESP32 devices.<br/>While gsi-log-rs currently supports, esp-csi-guirs, the gsi-log-rs interface is meant to be agnostic to any underlying CSI collection framework as long as data is provided in the correct format.</p>
        <div style={{ lineHeight: '1.0' }}>
          <h3 style={{ marginBottom: '0.5rem' }}>Instructions:</h3>
          <ul style={{ marginTop: '0', marginBottom: '1.5rem', paddingLeft: '1.5rem', fontSize: '0.95rem' }}>
            <li>Add the list of visualizations you would like to appear below.</li>
            <li>Start the gsi-log-rs rerun.io streaming server.</li>
            <li>Use the specified IP address to connect your client (Ex. esp-csi-gui-rs running locally).</li>
          </ul>

          <h3 style={{ marginBottom: '0.5rem' }}>Notes:</h3>
          <ul style={{ listStyleType: 'none', paddingLeft: '1rem' }}>
            <li>
              - If you already have a stored RRD from a previous experiment you can simply{' '}
              <button
                onClick={handleUploadButtonClick}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#007bff',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: 0,
                  fontSize: '0.95rem',
                  fontFamily: 'inherit',
                }}
              >
                upload your file
              </button>{' '}
              to replay it.
            </li>
            <li>
              - You can run an instance of ssi-log-rs locally on your PC alongside asp-ssi-guirs if you'd like to log data in RRD format.
            </li>
          </ul>
        </div>


        {/* <div className="button-group" style={{ marginBottom: '20px' }}>
          <button onClick={handleUploadButtonClick}>
            Upload RRD File
          </button>
          <button
            onClick={() => {
              setShowLive(true);
              setShowUpload(false);
              setShowHeader(true);
              setTimeout(() => scrollToSection(liveRef), 100);
            }}
          >
            Live Stream
          </button>
        </div> */}

        {/* Hidden file input */}
        <input
          type="file"
          accept=".rrd"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChosen}
        />

        {/* *** Graph Selector (now includes Start button) *** */}
        <div style={{ marginTop: '40px' }}>
          <GraphSelector />
        </div>
      </div>

      {/* Upload Section */}
      {showUpload && (
        <div ref={uploadRef} style={{ padding: '60px 20px' }}>
          <Upload preselectedFile={selectedFile} />
        </div>
      )}
      {/* GraphSelector
        <GraphSelector /> */}

      {/* Live Stream Section */}
      {showLive && (
        <div ref={liveRef} style={{ padding: '60px 20px' }}>
          <LiveStream />
        </div>
      )}
    </div>
  );
}
