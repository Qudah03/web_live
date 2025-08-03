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
  {
    label: 'Camera',
    options: [graphOptions[0]],
  },
  {
    label: 'Heatmap',
    options: [graphOptions[1], graphOptions[2]],
  },
  {
    label: 'Time Series',
    options: [graphOptions[3], graphOptions[4]],
  },
];

const isTimeSeries = (value) =>
  value === 'ts_magnitude' || value === 'ts_phase';

const isHeatmap = (value) =>
  value === 'magnitude' || value === 'phase';

const GraphSelector = ({ onSelectionChange }) => {
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [dropdownCount, setDropdownCount] = useState(1);
  const [subcarrierData, setSubcarrierData] = useState({});
  const [editingGraph, setEditingGraph] = useState(null);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const total = selectedOptions.length;
    const allowed = [1, 2, 4, 6];
    setIsValid(allowed.includes(total));
    onSelectionChange && onSelectionChange(selectedOptions, allowed.includes(total));
  }, [selectedOptions]);

  const handleSelect = (selected, index) => {
    if (!selected) return;

    const isTS = isTimeSeries(selected.value);
    const alreadySelected = selectedOptions.find((opt) => opt.value === selected.value);

    if (!isTS && alreadySelected) return;

    const newSelected = [...selectedOptions, selected];
    setSelectedOptions(newSelected);

    if (newSelected.length < 6) {
      setDropdownCount(dropdownCount + 1);
    }
  };

  const handleSubcarrierChange = (graphKey, values) => {
    setSubcarrierData((prev) => ({
      ...prev,
      [graphKey]: values,
    }));
    setEditingGraph(null); // Hide selector after confirming
  };

  const getAvailableOptions = () => {
    const usedValues = selectedOptions
      .filter((s) => s.value !== null && !isTimeSeries(s.value))
      .map((s) => s.value);

    return groupedOptions.map((group) => ({
      ...group,
      options: group.options.filter(
        (opt) => isTimeSeries(opt.value) || !usedValues.includes(opt.value)
      ),
    }));
  };

  const groupedSelected = {
    Camera: [],
    Heatmap: [],
    'Time Series': [],
  };

  selectedOptions.forEach((opt) => {
    if (opt.value === 'camera') {
      groupedSelected['Camera'].push(opt);
    } else if (isHeatmap(opt.value)) {
      groupedSelected['Heatmap'].push(opt);
    } else if (isTimeSeries(opt.value)) {
      groupedSelected['Time Series'].push(opt);
    }
  });

  const formatSubcarriers = (list) => {
    if (list.length === 0) return '';
    const sorted = [...list].sort((a, b) => a - b);
    const ranges = [];
    let start = sorted[0];
    let end = sorted[0];
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
        {groupedSelected['Camera'].length > 0 && (
          <div>
            <strong>Camera:</strong>
            <ul style={{ marginTop: '5px' }}>
              {groupedSelected['Camera'].map((opt, i) => (
                <li key={`${opt.value}-${i}`}>
                  {opt.label}
                  <button
                    onClick={() =>
                      setSelectedOptions((prev) =>
                        prev.filter((o, idx) => !(o.value === opt.value && o.label === opt.label && prev.indexOf(o) === i))
                      )
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
                </li>
              ))}
            </ul>
          </div>
        )}

        {groupedSelected['Heatmap'].length > 0 && (
          <div>
            <strong>Heatmap:</strong>
            <ul style={{ marginTop: '5px' }}>
              {groupedSelected['Heatmap'].map((opt, i) => (
                <li key={`${opt.value}-${i}`}>
                  {opt.label}
                  <button
                    onClick={() =>
                      setSelectedOptions((prev) =>
                        prev.filter((o, idx) => !(o.value === opt.value && o.label === opt.label && prev.indexOf(o) === i))
                      )
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
                </li>
              ))}
            </ul>
          </div>
        )}

        {groupedSelected['Time Series'].length > 0 && (
          <div>
            <strong>Time Series:</strong>
            <ul style={{ marginTop: '5px' }}>
              {groupedSelected['Time Series'].map((opt, i) => {
                const subcarriers = subcarrierData[opt.value] || [];
                return (
                  <li key={`${opt.value}-${i}`}>
                    {opt.label} – Subcarriers: {formatSubcarriers(subcarriers)}
                    <button
                      onClick={() =>
                        setSelectedOptions((prev) =>
                          prev.filter((o, idx) => !(o.value === opt.value && o.label === opt.label && prev.indexOf(o) === i))
                        )
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
                    <button
                      onClick={() => setEditingGraph(opt.value)}
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
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* Dropdowns */}
      {[...Array(dropdownCount)].map((_, idx) => (
        <div key={idx} style={{ marginBottom: '10px' }}>
          <Select
            options={getAvailableOptions()}
            value={null}
            onChange={(selected) => handleSelect(selected, idx)}
            placeholder="+ Graph"
            isDisabled={selectedOptions.length >= 6}
          />
        </div>
      ))}

      {/* Show Subcarrier Selector inline for the selected Time Series graph */}
      {selectedOptions.map((opt, index) =>
        isTimeSeries(opt.value) && editingGraph === opt.value ? (
          <div key={`${opt.value}-${index}`}>
            <SubcarrierSelector
              label={opt.label}
              onChange={(values) => handleSubcarrierChange(opt.value, values)}
            />
          </div>
        ) : null
      )}
    </div>
  );
};

export default GraphSelector;
