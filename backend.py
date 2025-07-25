#backend.py
# This file is part of the Rerun project, licensed under the Apache License 

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os, signal
import tempfile

from waitress import serve
import uuid
import sys

if sys.platform == "win32":
    from subprocess import CREATE_NEW_PROCESS_GROUP
else:
    CREATE_NEW_PROCESS_GROUP = 0
import rerun as rr
import rerun.blueprint as rrb
import subprocess
import socket
import time

app = Flask(__name__)
CORS(app)

UPLOAD_PATH = os.path.join(tempfile.gettempdir(), "latest.rrd")
BLUEPRINTS_DIR = "./blueprints"
os.makedirs(BLUEPRINTS_DIR, exist_ok=True)

rerun_server_proc = None
record_path       = None
data_proc         = None

# Wait for rerun server to be ready
def wait_for_rerun_ready(host="127.0.0.1", port=9876, timeout=10, interval=0.2):
    start = time.time()
    while time.time() - start < timeout:
        try:
            with socket.create_connection((host, port), timeout=1):
                print("[wait_for_rerun_ready] Rerun server is responsive.")
                return
        except OSError:
            time.sleep(interval)
    raise RuntimeError("Rerun server did not start in time.")

# --- Session-based endpoints ---

# --- Drop-in replacement for session management endpoints ---
@app.route('/api/start-session', methods=['POST'])
def start_session():
    global rerun_server_proc, record_path

    # (A) build the path ONCE per session
    record_path = os.path.join(
        BLUEPRINTS_DIR,
        f"recording_{uuid.uuid4()}.rrd"
    )

    # (B) spawn CLI in record+serve mode
    rerun_server_proc = subprocess.Popen([
        'rerun',
        record_path,         # <-- record into this file
        '--serve',
        '--port', '9876'
    ],
    creationflags=CREATE_NEW_PROCESS_GROUP)
    print(f"[start-session] Rerun CLI record+serve PID={rerun_server_proc.pid}")
    wait_for_rerun_ready()

    # (2) prepare file sink
    cfg = request.json or {}

    # (3) init Rerun: live gRPC only (no file sink, CLI handles recording)
    rr.init("csi-camera-stream", spawn=False)
    rr.set_sinks(rr.GrpcSink())
    print(f"[start-session] Live + saving to {record_path}")

    # (4) build & send blueprint (your existing code)
    cols = []
    if cfg.get("showCamera", False):
        camera_col = rrb.Vertical(
            rrb.Spatial2DView(
                origin="camera/live_feed",
                contents=["camera/**"],
                name="Camera Feed"
            ),
            row_shares=[1.0]
        )
        cols.append(camera_col)

    heatmap_views = []
    if cfg.get("showMagHeatmap", False):
        heatmap_views.append(
            rrb.TensorView(
                origin="csi/magnitude_heatmap",
                contents=["csi/magnitude_heatmap"],
                name="Magnitude Heatmap",
                view_fit="fill",
            )
        )
    if cfg.get("showPhaseHeatmap", False):
        heatmap_views.append(
            rrb.TensorView(
                origin="csi/phase_heatmap",
                contents=["csi/phase_heatmap"],
                name="Phase Heatmap",
                view_fit="fill",
            )
        )
    # if not heatmap_views:
    #     heatmap_views.append(
    #         rrb.TextDocumentView(
    #             origin="info",
    #             contents=["info"],
    #             name="No Heatmap Selected"
    #         )
    #     )
    heatmap_col = rrb.Vertical(*heatmap_views, row_shares=[1.0]*len(heatmap_views))
    cols.append(heatmap_col)

    timeseries_views = []
    if cfg.get("showTimeSeries", False):
        for sc in cfg.get("subcarriers", []):
            if cfg.get("showMagTimeSeries", False):
                path = f"magnitude_vs_time/subcarrier_{sc:03d}"
                timeseries_views.append(
                    rrb.TimeSeriesView(
                        origin=path,
                        contents=[path],
                        name=f"Magnitude SC {sc}"
                    )
                )
            if cfg.get("showPhaseTimeSeries", False):
                path = f"phase_vs_time/subcarrier_{sc:03d}"
                timeseries_views.append(
                    rrb.TimeSeriesView(
                        origin=path,
                        contents=[path],
                        name=f"Phase SC {sc}"
                    )
                )
    # if not timeseries_views:
    #     timeseries_views.append(
    #         rrb.TextDocumentView(
    #             origin="info",
    #             contents=["info"],
    #             name="No TimeSeries Selected"
    #         )
    #     )

    timeseries_col = rrb.Vertical(*timeseries_views, row_shares=[1.0]*len(timeseries_views))
    cols.append(timeseries_col)

    # Build and send blueprint (Rerun 0.24+ API)
    layout = rrb.Horizontal(*cols, column_shares=[1.0] * len(cols))
    blueprint = rrb.Blueprint(layout, collapse_panels=True)
    rr.send_blueprint(blueprint)
    print("[start-session] Blueprint sent")

    # (5) point iframe at the live gRPC server
    viewer_iframe_url = (
        "https://app.rerun.io/version/0.24.0/index.html"
        "?url=rerun+http://127.0.0.1:9876/proxy"
    )

    return jsonify({
        "status": "started",
        "recordingUrl": f"/api/recordings/{os.path.basename(record_path)}",
        "iframeUrl": viewer_iframe_url
    })


@app.route('/api/stop-session', methods=['POST'])
def stop_session():
    """Stop the current Rerun session (terminate the CLI process)."""
    global rerun_server_proc
    if rerun_server_proc and rerun_server_proc.poll() is None:
        print("[stop-session] Sending CTRL_BREAK_EVENT to Rerun CLI")
        rerun_server_proc.send_signal(signal.CTRL_BREAK_EVENT)
        rerun_server_proc.wait(timeout=5)
        print("[stop-session] Rerun CLI stopped")
    return jsonify({"status": "stopped", "message": "Session stopped"})

# @app.route('/api/save-recording', methods=['POST'])
# def save_recording():
#     """Return the URL to the saved .rrd file if it exists."""
#     global record_path
#     abs_path = os.path.abspath(record_path or "")
#     if not os.path.exists(abs_path):
#         return jsonify(status='error', message='Recording missing'), 404

#     filename = os.path.basename(record_path)
#     return jsonify({
#         "status": "success",
#         "filename": filename,
#         "url": f"http://localhost:5002/blueprints/{filename}"
#     })


# @app.route('/server-status', methods=['GET'])
# def server_status():
#     """Always return running status for iframe mode"""
#     return jsonify({
#         "running": True,
#         "message": "Iframe mode - no native server needed"
#     })

@app.route('/upload', methods=['POST'])
def upload_file():
    """Upload RRD file for iframe viewer"""
    if 'file' not in request.files:
        return jsonify({"status": "error", "message": "No file provided"})
    
    file = request.files['file'] # ← Receives your .rrd file
    if file.filename == '': 
        return jsonify({"status": "error", "message": "No file selected"})
    
    if not file.filename.endswith('.rrd'):
        return jsonify({"status": "error", "message": "Only .rrd files are allowed"})
    
    try:
        # Save to UPLOAD_PATH for the web viewer
        file.save(UPLOAD_PATH) # ← Your file is saved as "latest.rrd"
        print(f"Saved {file.filename} to {UPLOAD_PATH} for iframe viewer")
        
        return jsonify({
            "status": "success", 
            "message": f"File '{file.filename}' uploaded successfully for iframe viewer",
            "filename": file.filename
        })
            
    except Exception as e:
        print(f"Upload error for {file.filename}: {str(e)}")
        return jsonify({"status": "error", "message": f"Upload failed: {str(e)}"})

# Blueprint layout (D1.rrd)
@app.route('/get-blueprint', methods=['GET'])
def get_blueprint():
    """Get the D1.rrd blueprint data"""
    try:
        if not os.path.exists('D1.rrd'):
            return jsonify({"status": "error", "message": "D1.rrd blueprint file not found"})
        
        return send_file('./D1.rrd', mimetype='application/octet-stream')
    except Exception as e:
        return jsonify({"status": "error", "message": f"Failed to read blueprint: {str(e)}"})

# Your uploaded data (latest.rrd)
@app.route('/last-uploaded', methods=['GET'])
def serve_last_uploaded():
    """Serve the last uploaded RRD file for the iframe viewer"""
    if not os.path.exists(UPLOAD_PATH):
        return jsonify({"error": "No file uploaded yet"}), 404
    
    try:
        return send_file(UPLOAD_PATH, mimetype="application/octet-stream")
    except Exception as e:
        return jsonify({"error": f"Failed to serve file: {str(e)}"}), 500

@app.route('/health', methods=['GET'])  
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "mode": "iframe-only",
        "blueprint_exists": os.path.exists('D1.rrd'),
        "last_uploaded_exists": os.path.exists(UPLOAD_PATH)
    })

@app.route('/api/live-blueprint', methods=['POST'])
def live_blueprint():
    try:
        cfg = request.json
        print(f"Generating blueprint with config: {cfg}")

        rr.init("csi-camera-stream")

        cols = []

        # Only add camera column if requested
        if cfg.get("showCamera", False):
            camera_col = rrb.Vertical(
                rrb.Spatial2DView(
                    origin="camera/live_feed",
                    contents=["camera/**"],
                    name="Camera Feed"
                ),
                row_shares=[1.0]
            )
            cols.append(camera_col)

        # Heatmap column (always present)
        heatmap_views = []
        if cfg.get("showMagHeatmap", False):
            heatmap_views.append(
                rrb.TensorView(
                    origin="csi/magnitude_heatmap",
                    contents=["csi/magnitude_heatmap"],
                    name="Magnitude Heatmap",
                    view_fit="fill",
                )
            )
        if cfg.get("showPhaseHeatmap", False):
            heatmap_views.append(
                rrb.TensorView(
                    origin="csi/phase_heatmap",
                    contents=["csi/phase_heatmap"],
                    name="Phase Heatmap",
                    view_fit="fill",
                )
            )
        if not heatmap_views:
            heatmap_views.append(
                rrb.TextDocumentView(
                    origin="info",
                    contents=["info"],
                    name="No Heatmap Selected"
                )
            )
        heatmap_col = rrb.Vertical(*heatmap_views, row_shares=[1.0]*len(heatmap_views))
        cols.append(heatmap_col)

        # TimeSeries column (always present)
        timeseries_views = []
        if cfg.get("showTimeSeries", False):
            for sc in cfg.get("subcarriers", []):
                if cfg.get("showMagTimeSeries", False):
                    path = f"magnitude_vs_time/subcarrier_{sc:03d}"
                    timeseries_views.append(
                        rrb.TimeSeriesView(
                            origin=path,
                            contents=[path],
                            name=f"Magnitude SC {sc}"
                        )
                    )
                if cfg.get("showPhaseTimeSeries", False):
                    path = f"phase_vs_time/subcarrier_{sc:03d}"
                    timeseries_views.append(
                        rrb.TimeSeriesView(
                            origin=path,
                            contents=[path],
                            name=f"Phase SC {sc}"
                        )
                    )
        if not timeseries_views:
            timeseries_views.append(
                rrb.TextDocumentView(
                    origin="info",
                    contents=["info"],
                    name="No TimeSeries Selected"
                )
            )
        timeseries_col = rrb.Vertical(*timeseries_views, row_shares=[1.0]*len(timeseries_views))
        cols.append(timeseries_col)

        # Final layout: columns based on selection
        layout = rrb.Horizontal(*cols, column_shares=[1.0]*len(cols))

        blueprint = rrb.Blueprint(layout, collapse_panels=True)
        blueprint_id = f"{uuid.uuid4()}.rrd"
        blueprint_path = os.path.join(BLUEPRINTS_DIR, blueprint_id)
        rr.save(blueprint_path, blueprint)

        url = f"http://localhost:5002/blueprints/{blueprint_id}"
        return jsonify({
            "status": "success",
            "blueprintUrl": url,
            "blueprintId": blueprint_id
        })

    except Exception as e:
        print(f"Error generating blueprint: {e}")
        return jsonify({
            "status": "error",
            "message": f"Failed to generate blueprint: {e}"
        }), 500


@app.route('/blueprints/<blueprint_id>', methods=['GET'])
def serve_blueprint(blueprint_id):
    """Serve generated blueprint files"""
    try:
        blueprint_path = os.path.join(BLUEPRINTS_DIR, blueprint_id)
        
        if not os.path.exists(blueprint_path):
            return jsonify({"error": "Blueprint not found"}), 404
            
        return send_file(blueprint_path, mimetype="application/octet-stream")
        
    except Exception as e:
        return jsonify({"error": f"Failed to serve blueprint: {str(e)}"}), 500

@app.route('/live-stream', methods=['GET'])
def live_stream():
    """Live data streaming endpoint - connects to Rust data generator"""
    return jsonify({
        "status": "live-stream-active",
        "message": "Connecting to Rust CSI data generator",
        "grpc_url": "ws://localhost:9876",
        "app_id": "live-stream",
        "data_sources": [
            "csi/magnitude_heatmap",
            "csi/phase_heatmap", 
            "magnitude_vs_time/subcarrier_*",
            "phase_vs_time/subcarrier_*"
        ],
        "instructions": "Start Rust generator first, then rerun server: rerun --serve --port 9876"
    })

if __name__ == '__main__':
    print("Starting simplified Flask backend server for session mode...")
    # print("Available endpoints:")
    # print("- POST /api/start-session: Start live session")
    # print("- POST /api/stop-session: Stop live session")
    # print("- POST /api/save-recording: Save/download recording")
    # print("- GET /server-status: Always returns running (iframe mode)")
    # print("- POST /upload: Upload RRD file for iframe viewer")
    # print("- GET /get-blueprint: Serve D1.rrd blueprint")
    # print("- GET /last-uploaded: Serve the last uploaded RRD file")
    # print("- GET /health: Health check")
    # print("\nThis server only handles file uploads and serving for iframe viewer.")
    try:
        serve(app, host='127.0.0.1', port=5002, threads=4)
    finally:
        if rerun_server_proc and rerun_server_proc.poll() is None:
            rerun_server_proc.terminate()
            rerun_server_proc.wait()
