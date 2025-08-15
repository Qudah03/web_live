import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import SubcarrierSelector from './SubcarrierSelector';

const graphOptions = [
  { label: 'Camera', value: 'camera', group: 'Camera' },
  { label: 'Magnitude', value: 'magnitude', group: 'Heatmap' },
  { label: 'Phase', value: 'phase', group: 'Heatmap' },
  { label: 'Magnitude', value: 'ts_magnitude', group: 'Time Series' },
  { label: 'Phase', value: 'ts_phase', group: 'Time Series' },
];

const groupedOptions = [
  { label: 'Camera', options: [graphOptions[0]] },
  { label: 'Heatmap', options: [graphOptions[1], graphOptions[2]] },
  { label: 'Time Series', options: [graphOptions[3], graphOptions[4]] },
];

const isTimeSeries = (value) => value === 'ts_magnitude' || value === 'ts_phase';
const isHeatmap = (value) => value === 'magnitude' || value === 'phase';

const GraphSelector = ({ onSelectionChange }) => {
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [subcarrierData, setSubcarrierData] = useState({});
  const [editingGraph, setEditingGraph] = useState(null);
  const [isValid, setIsValid] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [iframeUrl, setIframeUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSaveInstructions, setShowSaveInstructions] = useState(false);
  const [isStopped, setIsStopped] = useState(false);

  useEffect(() => {
    const total = selectedOptions.length;
    const allowed = [1, 2, 4, 6];
    setIsValid(allowed.includes(total));
    onSelectionChange?.(selectedOptions, allowed.includes(total));
  }, [selectedOptions, onSelectionChange]);

  // Convert graph selection to backend format
  const convertToBackendFormat = () => {
    return selectedOptions.map(opt => {
      if (opt.value === 'camera') {
        return { type: 'camera', mode: null, subcarrier: null };
      } else if (isHeatmap(opt.value)) {
        return { 
          type: 'heatmap', 
          mode: opt.value, // 'magnitude' or 'phase'
          subcarrier: null 
        };
      } else if (isTimeSeries(opt.value)) {
        const mode = opt.value === 'ts_magnitude' ? 'magnitude' : 'phase';
        const subcarriers = subcarrierData[opt.id] || [];
        
        // If all 64 subcarriers are selected, use 'all'
        if (subcarriers.length === 64) {
          return { type: 'timeseries', mode, subcarrier: 'all' };
        } else if (subcarriers.length > 0) {
          // Send multiple subcarriers as a list to be displayed in one graph
          return { type: 'timeseries', mode, subcarrier: subcarriers };
        }
      }
      return null;
    }).filter(Boolean);
  };

  // Submit configuration to backend
  const handleSubmit = async () => {
    if (!isValid) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const graphConfigs = convertToBackendFormat();
      
      const backendPayload = {
        totalGraphs: selectedOptions.length,
        graphConfigs: graphConfigs
      };
      
      console.log('Sending payload:', backendPayload);
      
      const response = await fetch('http://localhost:5002/api/start-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backendPayload)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to start visualization session');
      }
      
      // Handle URL encoding
      const [base, urlPart] = data.iframeUrl.split('?url=');
      const encodedUrl = urlPart ? encodeURIComponent(urlPart) : '';
      const finalUrl = encodedUrl ? `${base}?url=${encodedUrl}` : data.iframeUrl;
      
      setIframeUrl(finalUrl);
      setIsSubmitted(true);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Stop session and reset
  const handleStopAndReset = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:5002/api/stop-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        const data = await response.json();
        console.warn('Stop session warning:', data.message || 'Failed to stop session cleanly');
      }
      
      console.log('Session stopped successfully');
      
      // Show save instructions and set stopped state
      setShowSaveInstructions(true);
      setIsStopped(true);
      
    } catch (err) {
      console.warn('Error stopping session:', err.message);
      // Still show instructions and set stopped state even if stop fails
      setShowSaveInstructions(true);
      setIsStopped(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (selected) => {
    if (!selected) return;

    const isTS = isTimeSeries(selected.value);
    const alreadySelected = selectedOptions.some((opt) => opt.value === selected.value && !isTS);

    if (alreadySelected) return;

    const newSelection = { ...selected, id: Date.now() + Math.random() }; // unique id for each graph
    setSelectedOptions((prev) => [...prev, newSelection]);

    if (isTS) {
      // default to all subcarriers
      const allSubs = Array.from({ length: 64 }, (_, i) => i + 1);
      setSubcarrierData((prev) => ({
        ...prev,
        [newSelection.id]: allSubs
      }));
    }
  };

  const handleSubcarrierChange = (graphId, values) => {
    setSubcarrierData((prev) => ({
      ...prev,
      [graphId]: values,
    }));
    setEditingGraph(null);
  };

  const getAvailableOptions = () => {
    const usedValues = selectedOptions
      .filter((s) => !isTimeSeries(s.value))
      .map((s) => s.value);

    return groupedOptions.map((group) => ({
      ...group,
      options: group.options.filter(
        (opt) => isTimeSeries(opt.value) || !usedValues.includes(opt.value)
      ),
    }));
  };

  const groupedSelected = { Camera: [], Heatmap: [], 'Time Series': [] };
  selectedOptions.forEach((opt) => {
    if (opt.value === 'camera') groupedSelected['Camera'].push(opt);
    else if (isHeatmap(opt.value)) groupedSelected['Heatmap'].push(opt);
    else if (isTimeSeries(opt.value)) groupedSelected['Time Series'].push(opt);
  });

  const formatSubcarriers = (list) => {
    if (!list?.length) return '';
    const sorted = [...list].sort((a, b) => a - b);
    const ranges = [];
    let start = sorted[0], end = sorted[0];
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] === end + 1) {
        end = sorted[i];
      } else {
        ranges.push(start === end ? `${start}` : `${start}-${end}`);
        start = end = sorted[i];
      }
    }
    ranges.push(start === end ? `${start}` : `${start}-${end}`);
    return ranges.join(', ');
  };

  return (
    <div>
      <h3>Selected Graphs:</h3>
      <div style={{ marginBottom: '10px' }}>
        {Object.entries(groupedSelected).map(([group, items]) =>
          items.length > 0 && (
            <div key={group}>
              <strong>{group}:</strong>
              <ul style={{ marginTop: '5px' }}>
                {items.map((opt, i) => (
                  <li key={`${opt.id}`}>
                    {opt.label}
                    {isTimeSeries(opt.value) && (
                      <> – Subcarriers: {formatSubcarriers(subcarrierData[opt.id] || [])}</>
                    )}
                    <button
                      onClick={() =>
                        setSelectedOptions((prev) => prev.filter((o) => o.id !== opt.id))
                      }
                      disabled={isSubmitted}
                      style={{
                        marginLeft: '10px',
                        background: 'none',
                        border: 'none',
                        color: isSubmitted ? '#ccc' : '#000',
                        cursor: isSubmitted ? 'not-allowed' : 'pointer',
                        textDecoration: 'underline',
                        fontSize: '0.9em',
                      }}
                    >
                      Delete
                    </button>
                    {isTimeSeries(opt.value) && (
                      <button
                        onClick={() => setEditingGraph(opt.id)}
                        disabled={isSubmitted}
                        style={{
                          marginLeft: '10px',
                          background: 'none',
                          border: 'none',
                          color: isSubmitted ? '#ccc' : '#657e98',
                          cursor: isSubmitted ? 'not-allowed' : 'pointer',
                          textDecoration: 'underline',
                          fontSize: '0.9em',
                        }}
                      >
                        Edit Subcarriers
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )
        )}
      </div>

      {/* Dropdown or Limit message */}
      {selectedOptions.length < 6 && !isSubmitted ? (
        <div style={{ marginBottom: '10px' }}>
          <Select
            options={getAvailableOptions()}
            value={null}
            onChange={(selected) => handleSelect(selected)}
            placeholder="+ Graph"
            isDisabled={isSubmitted}
          />
        </div>
      ) : !isSubmitted ? (
        <p style={{ fontStyle: 'italic', color: 'red' }}>Limit reached</p>
      ) : null}

      {/* Subcarrier Selector */}
      {selectedOptions.map((opt) =>
        isTimeSeries(opt.value) && editingGraph === opt.id && !isSubmitted ? (
          <div key={opt.id}>
            <SubcarrierSelector
              label={opt.label}
              onChange={(values) => handleSubcarrierChange(opt.id, values)}
              defaultSelected={subcarrierData[opt.id]}
            />
          </div>
        ) : null
      )}

      {/* Save Instructions after Stop & Reset */}
      {showSaveInstructions && (
        <div style={{
          backgroundColor: '#d1ecf1',
          color: '#0c5460',
          padding: '16px',
          borderRadius: '8px',
          marginTop: '16px',
          border: '1px solid #bee5eb'
        }}>
          <h4 style={{ margin: '0 0 12px 0', color: '#0c5460' }}>📋 Important Information</h4>
          <p style={{ margin: '0 0 12px 0' }}>
            <strong>To create a new stream:</strong> Please refresh the website.
          </p>
          <p style={{ margin: '0 0 12px 0' }}>
            <strong>⚠️ Data Saving:</strong> Be careful! If you did not save the data, it won't be automatically saved.
          </p>
          <p style={{ margin: '0 0 8px 0' }}>
            <strong>To save the data shown in Rerun:</strong>
          </p>
          <ul style={{ margin: '0 0 12px 20px', paddingLeft: '0' }}>
            <li>Click the <strong>Rerun icon</strong> at the top left, open the dropdown menu, and save the data as RRD</li>
            <li>Or press <strong>Ctrl + S</strong> in the Rerun viewer</li>
          </ul>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '8px'
            }}
          >
            🔄 Refresh Page
          </button>
          <button
            onClick={() => setShowSaveInstructions(false)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            ✕ Dismiss
          </button>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div style={{
          backgroundColor: '#f8d7da',
          color: '#721c24',
          padding: '12px',
          borderRadius: '4px',
          marginBottom: '16px',
          marginTop: '16px'
        }}>
          Error: {error}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        marginTop: '24px' 
      }}>
        {!isSubmitted ? (
          <button
            onClick={handleSubmit}
            disabled={!isValid || isLoading}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: isValid && !isLoading ? '#28a745' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isValid && !isLoading ? 'pointer' : 'not-allowed',
            }}
          >
            {isLoading ? 'Generating Visualization...' : 'Generate Visualization'}
          </button>
        ) : (
          <button
            onClick={handleStopAndReset}
            disabled={isLoading || isStopped}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: isStopped ? '#6c757d' : '#d61d10ff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: (isLoading || isStopped) ? 'not-allowed' : 'pointer',
            }}
          >
            {isLoading ? 'Stopping Session...' : isStopped ? 'Stopped' : 'Stop & Reset'}
          </button>
        )}
      </div>

      {/* Iframe visualization display */}
      {iframeUrl && (
        <div style={{ 
          marginTop: '32px',
          display: 'flex',
          justifyContent: 'center',
          width: '100%'
        }}>
          <iframe
            src={iframeUrl}
            title="Rerun Visualization"
            style={{
              width: 'calc(100vw - 80px)', // Full viewport width minus padding
              height: '80vh', // 80% of viewport height
              minHeight: '700px', // Minimum height for readability
              maxWidth: '1800px', // Maximum width to prevent it from being too wide
              border: '2px solid #007bff',
              borderRadius: '8px'
            }}
            allow="cross-origin-isolated"
          />
        </div>
      )}
    </div>
  );
};

export default GraphSelector;
