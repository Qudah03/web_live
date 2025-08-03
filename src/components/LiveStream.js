// src/components/LiveStream.js
import React from 'react';
import GraphSelectionInterface from './GraphSelectionInterface';
import '../styles.css';

export default function LiveStream() {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Live CSI Stream</h2>
      <p className="mb-4">Configure your visualization layout using the interface below:</p>
      
      <GraphSelectionInterface />
    </div>
  );
}
