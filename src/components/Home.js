import React, { useRef, useState } from 'react';
import Upload from './Upload';
import LiveStream from './LiveStream';
import '../styles.css';

export default function Home() {
  const uploadRef = useRef(null);
  const liveRef = useRef(null);

  const scrollToSection = (ref) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const [showGraphs, setShowGraphs] = useState(false);
  const [expandedSubGraph, setExpandedSubGraph] = useState(null); // "2D" or "3D"
  const [selectedOptions, setSelectedOptions] = useState([]); // array of { category, name }

  const graphOptions = {
    Camera: [],
    "2D": ["Heatmap", "Line Graph"],
    "3D": ["Point Cloud", "Surface"]
  };

  const handleMainGraphClick = (type) => {
    if (type === "2D" || type === "3D") {
      setExpandedSubGraph(expandedSubGraph === type ? null : type);
    } else {
      handleSubOptionClick(type, type); // camera directly
    }
  };

  const handleSubOptionClick = (category, name) => {
    if (!selectedOptions.some(opt => opt.name === name)) {
      setSelectedOptions([...selectedOptions, { category, name }]);
    }
  };

  const isOptionSelected = (option) =>
    selectedOptions.some(opt => opt.name === option);

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

        {/* Instruction */}
        <div style={{ marginTop: '20px', fontStyle: 'italic', color: '#555' }}>
          <p>Choose either to upload a file or view the live stream to start visualizing CSI data.</p>
        </div>

        {/* Graphs Dropdown Section */}
        <div style={{ marginTop: '40px', textAlign: 'left', maxWidth: '400px', marginInline: 'auto' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              backgroundColor: '#f0f0f0',
              padding: '10px 15px',
              borderRadius: '8px',
              fontWeight: 'bold'
            }}
            onClick={() => setShowGraphs(!showGraphs)}
          >
            <span>Graphs</span>
            <span style={{ fontSize: '20px' }}>{showGraphs ? '-' : '+'}</span>
          </div>

          {showGraphs && (
            <ul style={{
              listStyle: 'none',
              paddingLeft: '0',
              marginTop: '10px',
              backgroundColor: '#fafafa',
              border: '1px solid #ddd',
              borderRadius: '8px'
            }}>
              {Object.keys(graphOptions).map((type) => (
                <li key={type}>
                  <div
                    onClick={() => handleMainGraphClick(type)}
                    style={{
                      padding: '10px 15px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #eee',
                      fontWeight: '500',
                      backgroundColor: expandedSubGraph === type ? '#f7f7f7' : 'transparent'
                    }}
                  >
                    {type}
                  </div>

                  {/* Sub-options */}
                  {expandedSubGraph === type && graphOptions[type].length > 0 && (
                    <ul style={{ paddingLeft: '20px' }}>
                      {graphOptions[type].map((option) => (
                        !isOptionSelected(option) && (
                          <li
                            key={option}
                            onClick={() => handleSubOptionClick(type, option)}
                            style={{
                              padding: '8px 10px',
                              cursor: 'pointer',
                              color: '#333'
                            }}
                          >
                            {option}
                          </li>
                        )
                      ))}
                      {graphOptions[type].every(isOptionSelected) && (
                        <li style={{ padding: '8px 10px', color: '#999', fontStyle: 'italic' }}>
                          All options selected
                        </li>
                      )}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}

          {/* Selected Graphs List */}
          {selectedOptions.length > 0 && (
            <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
              <h3 style={{ marginBottom: '10px' }}>Selected Graphs:</h3>
              <ol style={{ paddingLeft: '20px' }}>
                {selectedOptions.map((opt, index) => (
                  <li key={index} style={{ paddingBottom: '6px' }}>
                    {opt.category} → {opt.name}
                  </li>
                ))}
              </ol>
            </div>
          )}
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
