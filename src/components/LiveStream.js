// src/components/LiveStream.js
import React, { useState, useRef } from 'react';
import Select from 'react-select';
import makeAnimated from 'react-select/animated';
import '../styles.css';

const animatedComponents = makeAnimated();

// Pre‑built option lists
const heatmapOptions = [
  { value: 'mag',   label: 'Magnitude Heatmap' },
  { value: 'phase', label: 'Phase Heatmap' },
];
const timeseriesOptions = [
  { value: 'mag',   label: 'Magnitude Time Series' },
  { value: 'phase', label: 'Phase Time Series' },
];
// Generate subcarrier options 0–63
const subcarrierOptions = Array.from({ length: 64 }, (_, i) => ({
  value: i,
  label: `Subcarrier ${i}`
}));

export default function LiveStream() {
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [iframeSrc, setIframeSrc]   = useState('');
  const [heatmapType, setHeatmapType]     = useState([]);
  const [timeseriesType, setTimeseriesType] = useState([]);
  const [subcarriers, setSubcarriers]     = useState([]);
  const [showCamera, setShowCamera]       = useState(false);
  const [live, setLive] = useState(false);
  const [setCanSave] = useState(false);
  const iframeRef = useRef();

  // Start live session
  const startSession = async () => {
    setLoading(true);
    setError(null);
    setCanSave(false);
    const payload = {
      showCamera,
      showHeatmap:      heatmapType.length > 0,
      showMagHeatmap:   heatmapType.some(o => o.value === 'mag'),
      showPhaseHeatmap: heatmapType.some(o => o.value === 'phase'),
      showTimeSeries:      timeseriesType.length > 0 && subcarriers.length > 0,
      showMagTimeSeries:   timeseriesType.some(o => o.value === 'mag'),
      showPhaseTimeSeries: timeseriesType.some(o => o.value === 'phase'),
      subcarriers:      subcarriers.map(o => o.value),
    };
    try {
      const resp = await fetch('http://localhost:5002/api/start-session', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(payload)
      });
      const data = await resp.json();
      if (!resp.ok || !data.iframeUrl) {
        setError(data.message || 'Failed to start session');
        setLoading(false);
        return;
      }

      // URL-encode inner ?url parameter
      const [base, urlPart] = data.iframeUrl.split('?url=');
      const encodedUrl = urlPart ? encodeURIComponent(urlPart) : '';
      setIframeSrc(encodedUrl ? `${base}?url=${encodedUrl}` : data.iframeUrl);
      setLive(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // // Stop live session
  const stopSession = async () => {
    await fetch('http://localhost:5002/api/stop-session', { method: 'POST' });
    setLive(true);
    // setCanSave(true);
  };

  // Save & download recording (deleted)

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Live CSI Stream</h2>
      {/* Controls */}
      <div className="space-y-4 mb-6">
        <label className="inline-flex items-center">
          <input
            type="checkbox"
            className="form-checkbox h-5 w-5 text-blue-600"
            checked={showCamera}
            onChange={e => setShowCamera(e.target.checked)}
          />
          <span className="ml-2">Show Camera</span>
        </label>
        {/* Heatmap selector */}
        <div>
          <label className="block font-medium mb-1">Heatmap Type</label>
          <Select
            closeMenuOnSelect={false}
            components={animatedComponents}
            isMulti
            options={heatmapOptions}
            value={heatmapType}
            onChange={setHeatmapType}
            placeholder="Choose heatmap…"
          />
        </div>
        {/* Time series selector */}
        <div>
          <label className="block font-medium mb-1">Time Series Type</label>
          <Select
            closeMenuOnSelect={false}
            components={animatedComponents}
            isMulti
            options={timeseriesOptions}
            value={timeseriesType}
            onChange={setTimeseriesType}
            placeholder="Choose time-series…"
          />
        </div>
        {/* Subcarrier selector */}
        <div>
          <label className="block font-medium mb-1">Subcarriers</label>
          <Select
            closeMenuOnSelect={false}
            isMulti
            options={subcarrierOptions}
            value={subcarriers}
            onChange={setSubcarriers}
            placeholder="Pick one or more subcarriers"
            components={animatedComponents}
            styles={{ menu: p => ({ ...p, maxHeight: 200 }) }}
          />
        </div>
        {/* Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={startSession}
            disabled={loading || live}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Starting…' : 'Start Live Stream'}
          </button>
          <button
            onClick={stopSession}
            disabled={!live}
            className="bg-yellow-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >Stop Listening</button>
          {/* <button
            onClick={saveRecording}
            disabled={!canSave}
            className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >Save Recording</button> */}
        </div>
      </div>

      {error && <p className="text-red-600 mb-4">Error: {error}</p>}

      {iframeSrc && (
        <iframe
          ref={iframeRef}
          src={iframeSrc}
          title="Rerun Live Viewer"
          className="w-full h-[600px] border-2 border-blue-500 rounded"
          style={{
            width: '1300px',
            height: '600px',
            border: '2px solid #007bff',
            marginTop: '24px',
            borderRadius: '8px'
          }}
          allow="cross-origin-isolated"
        />
      )}
    </div>
  );
}
