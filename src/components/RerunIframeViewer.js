// src/RerunIframeViewer.js
import React, { useEffect, useState } from 'react';

export default function RerunIframeViewer() {
  const [iframeUrl, setIframeUrl] = useState('');

  useEffect(() => {
    const constructViewerUrl = async () => {
      try {
        // Optionally: You can ping the backend to ensure files exist
        const rrdCheck = await fetch("http://localhost:5002/last-uploaded");
        if (!rrdCheck.ok) throw new Error("RRD file not found");

        const viewerUrl = new URL("https://app.rerun.io/version/0.24.0/index.html");

        // Append only the data file (no forced blueprint)
        viewerUrl.searchParams.set("url", "http://localhost:5002/last-uploaded");
        // Removed blueprint-url to allow original RRD layout

        setIframeUrl(viewerUrl.toString());
      } catch (err) {
        console.error("Could not construct iframe viewer URL:", err);
      }
    };

    constructViewerUrl();
  }, []);

  return (
    <div style={{ width: "100%", height: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
      {iframeUrl ? (
        <iframe
          title="Rerun Viewer"
          src={iframeUrl}
          width="90%"
          height="90%"
          style={{ border: "none" }}
        />
      ) : (
        <p>Loading Rerun viewer...</p>
      )}
    </div>
  );
}
