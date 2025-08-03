import React, { useState, useEffect } from 'react';
import '../styles.css';

export default function GraphSelectionInterface() {
  // Constants for allowed graph counts
  const ALLOWED_COUNTS = [1, 2, 4, 6];
  
  // State management
  const [graphCount, setGraphCount] = useState(1);
  const [graphConfigs, setGraphConfigs] = useState([
    { type: "heatmap", mode: "magnitude", subcarrier: null }
  ]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [iframeUrl, setIframeUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Update graph configs when count changes
  useEffect(() => {
    setGraphConfigs(prevConfigs => {
      const newConfigs = [...prevConfigs];
      
      // Add new configs if needed
      while (newConfigs.length < graphCount) {
        newConfigs.push({ type: "heatmap", mode: "magnitude", subcarrier: null });
      }
      
      // Remove excess configs if needed
      while (newConfigs.length > graphCount) {
        newConfigs.pop();
      }
      
      return newConfigs;
    });
  }, [graphCount]); // Only depend on graphCount

  // Handle changes to individual graph configuration
  const handleGraphConfigChange = (index, field, value) => {
    if (isSubmitted) return;
    
    const newConfigs = [...graphConfigs];
    newConfigs[index] = { ...newConfigs[index], [field]: value };
    
    // Reset subcarrier if type is not timeseries
    if (field === 'type' && value !== 'timeseries') {
      newConfigs[index].subcarrier = null;
    }
    
    setGraphConfigs(newConfigs);
  };

  // Validate configuration before submission
  const validateConfigs = () => {
    const errors = [];
    
    // Check if at least one valid graph type is configured
    const hasValidHeatmap = graphConfigs.some(config => config.type === 'heatmap');
    const hasValidTimeseries = graphConfigs.some(config => 
      config.type === 'timeseries' && config.subcarrier !== null);
    const hasCamera = graphConfigs.some(config => config.type === 'camera');
    
    if (!hasValidHeatmap && !hasValidTimeseries && !hasCamera) {
      errors.push('At least one graph must be properly configured');
    }
    
    // Check individual timeseries configs - "all" is now a valid option
    graphConfigs.forEach((config, index) => {
      if (config.type === 'timeseries' && config.subcarrier === null) {
        errors.push(`Graph ${index + 1}: Timeseries requires a subcarrier selection`);
      }
    });
    
    if (errors.length > 0) {
      setError(errors.join(', '));
      return false;
    }
    
    return true;
  };

  // Submit configuration to backend
  const handleSubmit = async () => {
    if (!validateConfigs()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Transform the graph configs to match the working backend format
      const hasHeatmap = graphConfigs.some(config => config.type === 'heatmap');
      const hasTimeseries = graphConfigs.some(config => config.type === 'timeseries');
      const timeseriesSubcarriers = graphConfigs
        .filter(config => config.type === 'timeseries' && config.subcarrier !== null)
        .map(config => config.subcarrier === 'all' ? 'all' : config.subcarrier);
      
      const backendPayload = {
        totalGraphs: graphCount, // Add total graph count for layout
        graphConfigs: graphConfigs.map(config => ({
          ...config,
          // Keep subcarrier as-is for individual graph processing
          subcarrier: config.subcarrier
        })), // Send individual graph configurations
        showCamera: graphConfigs.some(config => config.type === 'camera'),
        showHeatmap: hasHeatmap,
        showMagHeatmap: graphConfigs.some(config => 
          config.type === 'heatmap' && config.mode === 'magnitude'),
        showPhaseHeatmap: graphConfigs.some(config => 
          config.type === 'heatmap' && config.mode === 'phase'),
        showTimeSeries: hasTimeseries && timeseriesSubcarriers.length > 0,
        showMagTimeSeries: graphConfigs.some(config => 
          config.type === 'timeseries' && config.mode === 'magnitude'),
        showPhaseTimeSeries: graphConfigs.some(config => 
          config.type === 'timeseries' && config.mode === 'phase'),
        // For legacy compatibility, send numeric subcarriers only
        subcarriers: timeseriesSubcarriers.filter(s => s !== 'all' && typeof s === 'number')
      };
      
      console.log('Sending payload:', backendPayload); // Debug log
      
      const response = await fetch('http://localhost:5002/api/start-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backendPayload)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to start visualization session');
      }
      
      // Handle URL encoding like your working code
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
      // Call the stop-session API
      const response = await fetch('http://localhost:5002/api/stop-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        const data = await response.json();
        console.warn('Stop session warning:', data.message || 'Failed to stop session cleanly');
      }
      
      console.log('Session stopped successfully');
      
    } catch (err) {
      console.warn('Error stopping session:', err.message);
      // Continue with reset even if stop fails
    } finally {
      setIsLoading(false);
      // Keep iframe visible like in LiveStream.js - don't reload page
      // The iframe will keep showing the last state from the session
    }
  };

  return (
    <div className="graph-selection-container">
      <h2>Configure Visualization Layout</h2>
      
      {/* Graph count selection */}
      <div className="control-panel">
        <label>Number of graphs:</label>
        <div className="button-group">
          {ALLOWED_COUNTS.map(count => (
            <button
              key={count}
              className={graphCount === count ? 'selected' : ''}
              onClick={() => setGraphCount(count)}
              disabled={isSubmitted}
            >
              {count}
            </button>
          ))}
        </div>
        <div className="layout-info">
          <small>
            Layout: {graphCount === 1 ? '100% (Full Width)' : 
                    graphCount === 2 ? '50% + 50% (Side by Side)' :
                    graphCount === 4 ? '2×2 Grid (25% each)' :
                    graphCount === 6 ? '2×3 Grid (16.7% each)' : `${(100/graphCount).toFixed(1)}% each`}
          </small>
        </div>
        
      </div>
      
      {/* Graph configuration grid */}
      <div className={`graph-grid count-${graphCount}`}>
        {graphConfigs.map((config, index) => (
          <div key={index} className="graph-config-card">
            <h3>Graph {index + 1}</h3>
            
            {/* Graph type */}
            <div className="config-row">
              <label>Type:</label>
              <select
                value={config.type}
                onChange={(e) => handleGraphConfigChange(index, 'type', e.target.value)}
                disabled={isSubmitted}
              >
                <option value="heatmap">Heatmap</option>
                <option value="timeseries">Time Series</option>
                <option value="camera">Camera</option>
              </select>
            </div>
            
            {/* Mode (for heatmap and timeseries) */}
            {config.type !== 'camera' && (
              <div className="config-row">
                <label>Mode:</label>
                <div className="radio-group">
                  <label>
                    <input
                      type="radio"
                      name={`mode-${index}`}
                      value="magnitude"
                      checked={config.mode === 'magnitude'}
                      onChange={() => handleGraphConfigChange(index, 'mode', 'magnitude')}
                      disabled={isSubmitted}
                    />
                    Magnitude
                  </label>
                  <label>
                    <input
                      type="radio"
                      name={`mode-${index}`}
                      value="phase"
                      checked={config.mode === 'phase'}
                      onChange={() => handleGraphConfigChange(index, 'mode', 'phase')}
                      disabled={isSubmitted}
                    />
                    Phase
                  </label>
                </div>
              </div>
            )}
            
            {/* Subcarrier selection (for timeseries only) */}
            {config.type === 'timeseries' && (
              <div className="config-row">
                <label>Subcarrier:</label>
                <select
                  value={config.subcarrier === null ? '' : config.subcarrier}
                  onChange={(e) => {
                    const val = e.target.value;
                    const subcarrierValue = val === 'all' ? 'all' : val === '' ? null : parseInt(val);
                    handleGraphConfigChange(index, 'subcarrier', subcarrierValue);
                  }}
                  disabled={isSubmitted}
                >
                  <option value="">Select a subcarrier</option>
                  <option value="all">All subcarriers (raw data)</option>
                  {Array.from({ length: 64 }, (_, i) => (
                    <option key={i} value={i}>Subcarrier {i}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Error display */}
      {error && (
        <div className="error-message">
          Error: {error}
        </div>
      )}
      
      {/* Action buttons */}
      <div className="action-buttons">
        {!isSubmitted ? (
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="primary-button"
          >
            {isLoading ? 'Generating Visualization...' : 'Generate Visualization'}
          </button>
        ) : (
          <button
            onClick={handleStopAndReset}
            disabled={isLoading}
            className="secondary-button"
          >
            {isLoading ? 'Stopping Session...' : 'Stop & Reset'}
          </button>
        )}
      </div>
      
      {/* Iframe visualization display */}
      {iframeUrl && (
        <div className="visualization-container">
          <iframe
            src={iframeUrl}
            title="Rerun Visualization"
            className="rerun-iframe"
            style={{
              width: '1300px',
              height: '600px',
              border: '2px solid #007bff',
              marginTop: '24px',
              borderRadius: '8px'
            }}
            allow="cross-origin-isolated"
          />
        </div>
      )}
    </div>
  );
}