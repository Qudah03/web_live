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
  const [success, setSuccess]       = useState(false);
  const [iframeSrc, setIframeSrc]   = useState('');
  const [heatmapType, setHeatmapType]     = useState([]);
  const [timeseriesType, setTimeseriesType] = useState([]);
  const [subcarriers, setSubcarriers]     = useState([]);
  const [showCamera, setShowCamera]       = useState(true);
  const [recLoading, setRecLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingFile, setRecordingFile] = useState(null);
  const iframeRef = useRef();

  // Start recording
  const startRecording = async () => {
    setRecLoading(true);
    try {
      const resp = await fetch('http://localhost:5002/api/start-recording', { method: 'POST' });
      const data = await resp.json();
      if (resp.ok && data.status === 'recording') {
        setIsRecording(true);
        setRecordingFile(data.filename);
      } else {
        alert('Error: ' + data.message);
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setRecLoading(false);
    }
  };

  // Stop and download recording
  const stopRecording = async () => {
    setRecLoading(true);
    try {
      const resp = await fetch('http://localhost:5002/api/stop-recording', { method: 'POST' });
      if (!resp.ok) {
        const err = await resp.json();
        alert('Error: ' + err.message);
        setRecLoading(false);
        return;
      }
      const blob = await resp.blob();
      let filename = recordingFile || 'recording.rrd';
      const cd = resp.headers.get('Content-Disposition');
      if (cd) {
        const match = cd.match(/filename="([^"]+)"/);
        if (match) filename = match[1];
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setIsRecording(false);
      setRecordingFile(null);
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setRecLoading(false);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const payload = {
      showCamera,
      showHeatmap:    heatmapType.length > 0,
      showMagHeatmap: heatmapType.some(o => o.value === 'mag'),
      showPhaseHeatmap: heatmapType.some(o => o.value === 'phase'),
      showTimeSeries:   timeseriesType.length > 0 && subcarriers.length > 0,
      showMagTimeSeries:   timeseriesType.some(o => o.value === 'mag'),
      showPhaseTimeSeries: timeseriesType.some(o => o.value === 'phase'),
      subcarriers: subcarriers.map(o => o.value),
    };

    try {
      const BACKEND = 'http://localhost:5002';
      const resp = await fetch(`${BACKEND}/api/live-blueprint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`Server error (${resp.status}): ${text}`);
      }

      const data = await resp.json();
      if (data.status !== 'success') {
        throw new Error(data.message || 'Unknown failure');
      }

      // Use the local Rerun viewer instead of the external one
      const localRerunUrl = 'http://localhost:9090';
      const dataUrl = encodeURIComponent('rerun+http://localhost:9876/proxy');
      const blueprintUrl = encodeURIComponent(data.blueprintUrl);
      
      setIframeSrc(
        `${localRerunUrl}?url=${blueprintUrl}&url=${dataUrl}`
      );
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Live CSI Stream</h2>

      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
        <h3 className="font-semibold text-blue-800 mb-2">Setup Instructions:</h3>
        <ol className="text-sm text-blue-700 space-y-1">
          <li>Run your Rust data generator: <code className="bg-blue-100 px-1 rounded">cargo run</code></li>
          <li>The local Rerun viewer should be available at <code className="bg-blue-100 px-1 rounded">http://localhost:9090</code></li>
          <li>Configure your visualization below and click Apply</li>
        </ol>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="inline-flex items-center">
          <input
            type="checkbox"
            className="form-checkbox h-5 w-5 text-blue-600"
            checked={showCamera}
            onChange={e => setShowCamera(e.target.checked)}
          />
          <span className="ml-2">Show Camera</span>
        </label>

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

        <div>
          <label className="block font-medium mb-1">Subcarriers</label>
          <Select
            closeMenuOnSelect={false}
            components={animatedComponents}
            isMulti
            options={subcarrierOptions}
            value={subcarriers}
            onChange={setSubcarriers}
            placeholder="Pick one or more subcarriers"
            className="basic-multi-select"
            classNamePrefix="select"
            styles={{ menu: provided => ({ ...provided, maxHeight: 200 }) }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Starting…' : 'Start Live Stream'}
        </button>
      </form>

      {/* Recording controls: Start/Stop */}
      <div className="mt-4 flex space-x-2">
        {!isRecording ? (
          <button
            className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
            onClick={startRecording}
            disabled={recLoading}
          >
            {recLoading ? 'Starting…' : 'Start Recording'}
          </button>
        ) : (
          <button
            className="bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50"
            onClick={stopRecording}
            disabled={recLoading}
          >
            {recLoading ? 'Processing…' : 'Stop & Download'}
          </button>
        )}
      </div>

      {error && <p className="mt-4 text-red-600">Error: {error}</p>}

      {success && (
        <iframe
          ref={iframeRef}
          src={iframeSrc}
          title="Rerun Live Viewer"
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