import React, { useRef } from 'react';
import Upload from './Upload';
import LiveStream from './LiveStream';
import '../styles.css';

export default function Home() {
  const uploadRef = useRef(null);
  const liveRef = useRef(null);

  const scrollToSection = (ref) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div>
      {/* Header Section */}
      <div className="centered">
        <img src="/logo.png" alt="Company Logo" style={{ width: 250 }} />
        <h1>Welcome to CSI visualizer</h1>
        <p>This app lets you visualize .rrd files or live data streams using Rerun.</p>
        <div className="button-group">
          <button onClick={() => scrollToSection(uploadRef)}>Upload RRD File</button>
          <button onClick={() => scrollToSection(liveRef)}>Live Stream</button>
        </div>
      </div>

      {/* Upload Section */}
      <div ref={uploadRef} style={{ padding: '60px 20px' }}>
        <h2>Upload RRD File</h2>
        <Upload />
      </div>

      {/* Live Stream Section */}
      <div ref={liveRef} style={{ padding: '60px 20px' }}>
        <h2>Live Stream</h2>
        <LiveStream />
      </div>
    </div>
  );
}
