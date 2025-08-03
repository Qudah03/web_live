import React, { useState, useEffect } from 'react';

const generateSubcarriers = () => Array.from({ length: 64 }, (_, i) => i + 1);

const SubcarrierSelector = ({ label, onChange, defaultSelected }) => {
  const [selected, setSelected] = useState(defaultSelected || generateSubcarriers());
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    // Ensure all are selected by default if no defaultSelected passed
    if (!defaultSelected) {
      setSelected(generateSubcarriers());
    }
  }, [defaultSelected]);

  const toggleSubcarrier = (num) => {
    if (confirmed) return;
    setSelected((prev) =>
      prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num]
    );
  };

  const selectAll = () => {
    if (!confirmed) {
      setSelected(generateSubcarriers());
    }
  };

  const deselectAll = () => {
    if (!confirmed) {
      setSelected([]);
    }
  };

  const confirmSelection = () => {
    setConfirmed(true);
    onChange?.(selected);
  };

  return (
    <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '12px', marginTop: '20px' }}>
      <h4>{label} – Select Subcarriers</h4>

      {!confirmed ? (
        <>
          <div style={{ marginBottom: '8px' }}>
            <button onClick={selectAll} style={{ marginRight: '8px' }}>Select All</button>
            <button onClick={deselectAll}>Deselect All</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
            {generateSubcarriers().map((num) => (
              <label key={num}>
                <input
                  type="checkbox"
                  checked={selected.includes(num)}
                  onChange={() => toggleSubcarrier(num)}
                />
                {num}
              </label>
            ))}
          </div>

          <button
            onClick={confirmSelection}
            style={{
              marginTop: '12px',
              padding: '6px 12px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Confirm Selection
          </button>
        </>
      ) : (
        <>
          <p style={{ marginTop: '12px', color: 'green' }}>
            Selection confirmed ({selected.length} subcarriers)
          </p>
          <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f6f6f6', borderRadius: '6px', maxHeight: '150px', overflowY: 'auto', fontSize: '14px', lineHeight: '1.5' }}>
            {selected.join(', ')}
          </div>

          <button
            onClick={() => setConfirmed(false)}
            style={{
              marginTop: '10px',
              padding: '6px 12px',
              backgroundColor: '#f0ad4e',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Edit
          </button>
        </>
      )}
    </div>
  );
};

export default SubcarrierSelector;
