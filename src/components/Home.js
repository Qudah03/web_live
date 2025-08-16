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

          <h1 style={{ 
            textAlign: 'center',
            fontFamily: 'Inter, sans-serif',
            fontWeight: '600',
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            lineHeight: '1.1',
            letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '1rem'
          }}>
    Wi-EYE: Real-Time CSI Data capture <br /> and Visualization Platform
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
        
        <div style={{ 
          lineHeight: '1.4',
          fontFamily: 'Inter, sans-serif',
          maxWidth: '900px',
          margin: '0 auto'
        }}>
          <h3 style={{ 
            marginBottom: '1rem',
            marginTop: '2rem',
            fontFamily: 'Inter, sans-serif',
            fontWeight: '600',
            fontSize: '1.3rem',
            color: '#2d3748',
            borderBottom: '2px solid #667eea',
            paddingBottom: '0.5rem'
          }}>Instructions:</h3>
          <ul style={{ 
            marginTop: '0', 
            marginBottom: '2rem', 
            paddingLeft: '1.5rem', 
            fontSize: '1rem',
            lineHeight: '1.7',
            color: '#4a5568'
          }}>
            <li style={{ marginBottom: '0.7rem' }}>Add the list of visualizations you would like to appear below.</li>
            <li style={{ marginBottom: '0.7rem' }}>Start the csi-log-rs rerun.io streaming server.</li>
            <li style={{ marginBottom: '0.7rem' }}>Use the specified IP address to connect your client (e.g., esp-csi-gui-rs running locally).</li>
          </ul>

          <h3 style={{ 
            marginBottom: '1rem',
            fontFamily: 'Inter, sans-serif',
            fontWeight: '600',
            fontSize: '1.3rem',
            color: '#2d3748',
            borderBottom: '2px solid #667eea',
            paddingBottom: '0.5rem'
          }}>Notes:</h3>
          <ul style={{ 
            listStyleType: 'none', 
            paddingLeft: '0',
            fontSize: '1rem',
            lineHeight: '1.7',
            color: '#4a5568'
          }}>
            <li style={{ 
              marginBottom: '1rem'
            }}>
              💾 If you already have a stored RRD from a previous experiment you can simply{' '}
              <button
                onClick={handleUploadButtonClick}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  padding: '4px 12px',
                  borderRadius: '6px',
                  fontSize: '0.95rem',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: '500',
                  transition: 'transform 0.2s ease',
                  boxShadow: '0 2px 4px rgba(102, 126, 234, 0.3)'
                }}
                onMouseOver={(e) => e.target.style.transform = 'translateY(-1px)'}
                onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
              >
                upload your file
              </button>{' '}
              to replay it.
            </li>
            <li style={{ 
              marginBottom: '1rem'
            }}>
              🖥️ You can run an instance of csi-log-rs locally on your PC alongside esp-csi-gui-rs if you'd like to log data in RRD format.
            </li>
            <li style={{ 
              marginBottom: '0'
            }}>
              🌐 <strong style={{ color: '#2d3748' }}>Server IP Address:</strong> When deploying, configure your CSI data clients to connect to{' '}
              <code style={{ 
                backgroundColor: '#1a202c', 
                color: '#68d391',
                padding: '4px 8px', 
                borderRadius: '6px', 
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.9rem',
                border: '1px solid #2d3748',
                fontWeight: '500'
              }}>
                {window.location.hostname}:{window.location.port || '3000'}
              </code>{' '}
              and set the stream name to "csi-camera-stream".
              <br/>
              <span style={{ fontSize: '0.9rem', color: '#718096', marginTop: '0.5rem', display: 'inline-block' }}>
                Backend: port 5002 | Frontend: port {window.location.port || '3000'} | Rerun: port 9876 (default)
              </span>
            </li>
          </ul>
        </div>
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
