import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles.css';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="centered">
      <img src="/logo.png" alt="Company Logo" style={{ width: 150 }} />
      <h1>Welcome to Rerun Visualizer</h1>
      <p>This app lets you visualize .rrd files or live data streams.</p>
      <div className="button-group">
        <button onClick={() => navigate('/upload')}>Upload RRD File</button>
        <button onClick={() => navigate('/live')}>Live Stream</button>
      </div>
    </div>
  );
}
