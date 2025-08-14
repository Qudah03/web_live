import React, { useState } from 'react';
import axios from 'axios';

const ServerControlPanel = ({ graphConfigs, isValidConfig }) => {
  const [serverIP, setServerIP] = useState('127.0.0.1');
  const [serverPort, setServerPort] = useState('5002');
  const [status, setStatus] = useState('stopped'); // 'stopped' | 'starting' | 'running'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateIP = (ip) => /^(\d{1,3}\.){3}\d{1,3}$/.test(ip);
  const validatePort = (port) => /^\d+$/.test(port) && +port > 0 && +port <= 65535;

  const handleStartStop = async () => {
    setError('');
    if (!validateIP(serverIP)) return setError('Invalid IP address');
    if (!validatePort(serverPort)) return setError('Invalid port');

    if (status === 'stopped') {
      setStatus('starting');
      setLoading(true);
      try {
        const payload = {
          totalGraphs: graphConfigs.length,
          graphConfigs: graphConfigs,
          showCamera: graphConfigs.some(g => g.type === 'camera'),
          showHeatmap: graphConfigs.some(g => g.type === 'heatmap'),
          showTimeSeries: graphConfigs.some(g => g.type === 'timeseries'),
          subcarriers: graphConfigs
            .filter(g => g.type === 'timeseries' && g.subcarrier !== null)
            .map(g => g.subcarrier)
        };
        const res = await axios.post(`http://${serverIP}:${serverPort}/api/start-session`, payload);
        if (res.data.status === 'success') {
          setStatus('running');
        } else {
          setError('Failed to start server');
          setStatus('stopped');
        }
      } catch (err) {
        setError(err.message || 'Network error');
        setStatus('stopped');
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(true);
      try {
        const res = await axios.post(`http://${serverIP}:${serverPort}/api/stop-session`);
        if (res.data.status === 'success') setStatus('stopped');
      } catch (err) {
        setError(err.message || 'Failed to stop server');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div style={{ marginTop: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h3>Server Control</h3>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
        <input
          type="text"
          value={serverIP}
          placeholder="Server IP"
          onChange={(e) => setServerIP(e.target.value)}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', flex: 1 }}
        />
        <input
          type="text"
          value={serverPort}
          placeholder="Port"
          onChange={(e) => setServerPort(e.target.value)}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', width: '100px' }}
        />
      </div>

      <button
        onClick={handleStartStop}
        disabled={!isValidConfig || loading}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          borderRadius: '5px',
          border: 'none',
          cursor: isValidConfig && !loading ? 'pointer' : 'not-allowed',
          backgroundColor: status === 'running' ? '#dc3545' : '#28a745',
          color: 'white',
        }}
      >
        {loading ? 'Processing...' : status === 'stopped' ? 'Start Server' : 'Stop Server'}
      </button>

      {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
    </div>
  );
};

export default ServerControlPanel;
