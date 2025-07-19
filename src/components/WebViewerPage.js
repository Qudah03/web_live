
import React, { useEffect, useState, Suspense } from 'react';

// const RerunViewer = React.lazy(() => import('@rerun-io/web-viewer-react')); // ✅ async import

export default function WebViewerPage() {
  const [rrdData, setRrdData] = useState(null);

  //const params = useQueryParams()

  useEffect(() => {
    const fetchRRD = async () => {
      try {
        const response = await fetch("http://localhost:5002/last-uploaded");
        const buffer = await response.arrayBuffer();
        setRrdData(new Uint8Array(buffer));
      } catch (err) {
        console.error("Could not load latest RRD file:", err);
      }
    };

    fetchRRD();
  }, []);

  return (
    <div style={{ width: "100%", height: "100vh" }}>
      {/* {rrdData ? (
        <Suspense fallback={<div>Loading viewer...</div>}>
          <RerunViewer rrd="http://localhost:5002/last-uploaded" blueprint="standard" />
        </Suspense>
      ) : (
        <p style={{ textAlign: "center", marginTop: "20px" }}>
          Loading latest uploaded RRD file...
        </p>
      )} */}
      <iframe
        width={"90%"}
        height={"90%"}
        src="https://app.rerun.io/version/0.23.4/index.html?url=http://localhost:5002/last-uploaded&url=http://localhost:5002/get-blueprint"
        title="Rerun Web Viewer"
      ></iframe>

    </div>
  );
}
