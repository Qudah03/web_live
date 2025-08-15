// LiveStream.js
import React from 'react';
// import ServerControlPanel from './ServerControlPanel';

export default function LiveStream({ graphConfigs, isValidConfig }) {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Live CSI Stream</h2>
      {/* <ServerControlPanel graphConfigs={graphConfigs} isValidConfig={isValidConfig} /> */}
    </div>
  );
}
