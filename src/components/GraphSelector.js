// src/components/GraphSelector.js

import React, { useState } from 'react';
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

const GraphSelector = ({ onSelectionChange }) => {
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [subcarrierData, setSubcarrierData] = useState({});

  const handleChange = (selected) => {
    if (!selected) selected = [];
    setSelectedOptions(selected);

    // Remove subcarrier data for deselected graphs
    const newSubcarrierData = { ...subcarrierData };
    Object.keys(newSubcarrierData).forEach((key) => {
      if (!selected.find((s) => s.value === key)) {
        delete newSubcarrierData[key];
      }
    });
    setSubcarrierData(newSubcarrierData);

    onSelectionChange &&
      onSelectionChange(selected, newSubcarrierData);
  };

  const handleSubcarrierChange = (graphKey, values) => {
    setSubcarrierData((prev) => ({
      ...prev,
      [graphKey]: values,
    }));
  };

  return (
    <div>
      <h3>Selected Graphs:</h3>
      {selectedOptions.length > 0 ? (
        <ul>
          {selectedOptions.map((opt) => (
            <li key={opt.value}>{opt.label}</li>
          ))}
        </ul>
      ) : (
        <p>No graph selected</p>
      )}

      <Select
        options={groupedOptions}
        isMulti
        value={selectedOptions}
        onChange={handleChange}
        closeMenuOnSelect={false}
        placeholder="Select graphs (max 6 - 0, 2, 4, 6 only)"
      />

      {selectedOptions.map((opt) =>
        ['magnitude', 'phase', 'ts_magnitude', 'ts_phase'].includes(opt.value) ? (
          <SubcarrierSelector
            key={opt.value}
            label={opt.label}
            onChange={(values) => handleSubcarrierChange(opt.value, values)}
          />
        ) : null
      )}
    </div>
  );
};

export default GraphSelector;
