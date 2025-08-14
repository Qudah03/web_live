import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import SubcarrierSelector from './SubcarrierSelector';
import ServerControlPanel from './ServerControlPanel';

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

  useEffect(() => {
    const total = selectedOptions.length;
    const allowed = [1, 2, 4, 6];
    setIsValid(allowed.includes(total));
    onSelectionChange?.(selectedOptions, allowed.includes(total));
  }, [selectedOptions]);

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
                      style={{
                        marginLeft: '10px',
                        background: 'none',
                        border: 'none',
                        color: '#000',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        fontSize: '0.9em',
                      }}
                    >
                      Delete
                    </button>
                    {isTimeSeries(opt.value) && (
                      <button
                        onClick={() => setEditingGraph(opt.id)}
                        style={{
                          marginLeft: '10px',
                          background: 'none',
                          border: 'none',
                          color: '#657e98',
                          cursor: 'pointer',
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
      {selectedOptions.length < 6 ? (
        <div style={{ marginBottom: '10px' }}>
          <Select
            options={getAvailableOptions()}
            value={null}
            onChange={(selected) => handleSelect(selected)}
            placeholder="+ Graph"
          />
        </div>
      ) : (
        <p style={{ fontStyle: 'italic', color: 'red' }}>Limit reached</p>
      )}

      {/* Subcarrier Selector */}
      {selectedOptions.map((opt) =>
        isTimeSeries(opt.value) && editingGraph === opt.id ? (
          <div key={opt.id}>
            <SubcarrierSelector
              label={opt.label}
              onChange={(values) => handleSubcarrierChange(opt.id, values)}
              defaultSelected={subcarrierData[opt.id]}
            />
          </div>
        ) : null
      )}
      <ServerControlPanel
        graphConfigs={selectedOptions.map(opt => ({
          type: opt.value.includes('ts') ? 'timeseries' : opt.value === 'camera' ? 'camera' : 'heatmap',
          mode: opt.value.includes('phase') ? 'phase' : 'magnitude',
          subcarrier: isTimeSeries(opt.value) ? (subcarrierData[opt.id] || 'all') : null
        }))}
        isValidConfig={isValid}
      />
    </div>
  );
};

export default GraphSelector;
