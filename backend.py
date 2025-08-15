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

    # Stop any existing session first
    if rerun_server_proc and rerun_server_proc.poll() is None:
        print("[start-session] Stopping existing rerun CLI...")
        try:
            if sys.platform == "win32":
                rerun_server_proc.send_signal(signal.CTRL_BREAK_EVENT)
            else:
                os.killpg(os.getpgid(rerun_server_proc.pid), signal.SIGTERM)
            rerun_server_proc.wait(timeout=5)
        except Exception as e:
            print(f"[start-session] Error stopping existing process: {e}")
        
    # (A) build the path ONCE per session
    record_path = os.path.join(
        BLUEPRINTS_DIR,
        f"recording_{uuid.uuid4()}.rrd"
    )

    # (B) spawn CLI in record+serve mode
    try:
        rerun_server_proc = subprocess.Popen([
            'rerun',
            record_path,         # <-- record into this file
            '--serve',
            '--port', '9876'
        ],

        preexec_fn=os.setsid if sys.platform != "win32" else None,  # << add this :  allow group termination (Linux/macOS)
        creationflags=CREATE_NEW_PROCESS_GROUP)
        print(f"[start-session] Rerun CLI record+serve PID={rerun_server_proc.pid}")
        wait_for_rerun_ready()

    except Exception as e:
        print(f"[start-session] Failed to start Rerun server: {e}")
        return jsonify({"status": "error", "message": f"Failed to start Rerun server: {e}"}), 500

    # (2) prepare file sink
    cfg = request.json or {}
    
    # Get the total number of graphs for layout calculation
    total_graphs = cfg.get("totalGraphs", 1)
    print(f"[start-session] Configuring layout for {total_graphs} graphs")

    # (3) init Rerun: live gRPC only (no file sink, CLI handles recording)
    rr.init("csi-camera-stream", spawn=False) # <-- spawn=False to avoid double init, csi-camera-stream is the app ID
    rr.set_sinks(                               rr.GrpcSink()) # <-- use gRPC sink only, CLI handles recording
    #     ^                                       ^
    # Stream data to multiple different sinks. Initialize a gRPC sink
    print(f"[start-session] Live + saving to {record_path}")

    # (4) build & send blueprint - create individual columns for each graph
    cols = []
    
    # Get individual graph configurations
    graph_configs = cfg.get("graphConfigs", [])
    print(f"[start-session] Processing {len(graph_configs)} graph configs: {graph_configs}")
    
    for i, graph_config in enumerate(graph_configs):
        graph_type = graph_config.get("type", "heatmap")
        mode = graph_config.get("mode", "magnitude")
        subcarrier = graph_config.get("subcarrier")
        
        print(f"[start-session] Graph {i+1}: type={graph_type}, mode={mode}, subcarrier={subcarrier}")
        
        if graph_type == "camera":
            camera_col = rrb.Vertical(
                rrb.Spatial2DView(
                    origin="camera/live_feed",
                    contents=["camera/**"],
                    name=f"Camera Feed"
                ),
                row_shares=[1.0]
            )
            cols.append(camera_col)
            
        elif graph_type == "heatmap":
            if mode == "magnitude":
                heatmap_view = rrb.TensorView(
                    origin="csi/magnitude_heatmap",
                    contents=["csi/magnitude_heatmap"],
                    name=f"Magnitude Heatmap {i+1}",
                    view_fit="fill",
                )
            else:  # phase
                heatmap_view = rrb.TensorView(
                    origin="csi/phase_heatmap",
                    contents=["csi/phase_heatmap"],
                    name=f"Phase Heatmap {i+1}",
                    view_fit="fill",
                )
            heatmap_col = rrb.Vertical(heatmap_view, row_shares=[1.0])
            cols.append(heatmap_col)
            
        elif graph_type == "timeseries" and subcarrier is not None:
            # Handle different subcarrier formats
            if isinstance(subcarrier, str) and subcarrier == "all":
                # For "all" subcarriers, show the raw time series data as it comes from source
                if mode == "magnitude":
                    path = "magnitude_vs_time"  # Raw path without subcarrier filtering
                    name = f"All Magnitude TS ({i+1})"
                else:  # phase
                    path = "phase_vs_time"  # Raw path without subcarrier filtering
                    name = f"All Phase TS ({i+1})"
                    
                timeseries_view = rrb.TimeSeriesView(
                    origin=path,
                    contents=[f"{path}/**"],  # Include all subcarriers under this path
                    name=name
                )
                timeseries_col = rrb.Vertical(timeseries_view, row_shares=[1.0])
                cols.append(timeseries_col)
                print(f"[start-session] Added 'all' timeseries column: {name} with path {path}")
                continue
                
            elif isinstance(subcarrier, list):
                # Handle multiple specific subcarriers in one graph
                if mode == "magnitude":
                    base_path = "magnitude_vs_time"
                    name = f"Magnitude SC {subcarrier} ({i+1})"
                else:  # phase
                    base_path = "phase_vs_time"
                    name = f"Phase SC {subcarrier} ({i+1})"
                
                # Create contents list for specific subcarriers
                contents = [f"{base_path}/subcarrier_{sc:03d}" for sc in subcarrier]
                
                timeseries_view = rrb.TimeSeriesView(
                    origin=base_path,
                    contents=contents,  # Include only selected subcarriers
                    name=name
                )
                timeseries_col = rrb.Vertical(timeseries_view, row_shares=[1.0])
                cols.append(timeseries_col)
                print(f"[start-session] Added multi-subcarrier timeseries column: {name} with {len(contents)} subcarriers")
                continue
                
            else:
                # Handle single subcarrier (for backward compatibility)
                try:
                    if isinstance(subcarrier, str):
                        subcarrier = int(subcarrier)
                except ValueError:
                    print(f"[start-session] Invalid subcarrier value: {subcarrier}, skipping")
                    continue
                
                # Handle specific single subcarrier
                if mode == "magnitude":
                    path = f"magnitude_vs_time/subcarrier_{subcarrier:03d}"
                    name = f"Magnitude SC {subcarrier} ({i+1})"
                else:  # phase
                    path = f"phase_vs_time/subcarrier_{subcarrier:03d}"
                    name = f"Phase SC {subcarrier} ({i+1})"
                    
                timeseries_view = rrb.TimeSeriesView(
                    origin=path,
                    contents=[path],
                    name=name
                )
                timeseries_col = rrb.Vertical(timeseries_view, row_shares=[1.0])
                cols.append(timeseries_col)
                print(f"[start-session] Added specific timeseries column: {name} with path {path}")
    
    # Ensure we have at least one column
    if not cols:
        print("[start-session] No valid columns created, adding default heatmap")
        default_view = rrb.TensorView(
            origin="csi/magnitude_heatmap",
            contents=["csi/magnitude_heatmap"],
            name="Default Magnitude Heatmap",
            view_fit="fill",
        )
        cols.append(rrb.Vertical(default_view, row_shares=[1.0]))
    
    print(f"[start-session] Created {len(cols)} columns from {len(graph_configs)} graph configs")

    # Create layout based on total number of graphs
    if total_graphs == 1:
        # Single graph takes full width
        layout = rrb.Horizontal(*cols, column_shares=[1.0])
    elif total_graphs == 2:
        # Side by side: 50/50 split
        layout = rrb.Horizontal(*cols, column_shares=[0.5, 0.5])
    elif total_graphs == 4:
        # 2x2 grid layout
        if len(cols) >= 4:
            top_row = rrb.Horizontal(cols[0], cols[1], column_shares=[0.5, 0.5])
            bottom_row = rrb.Horizontal(cols[2], cols[3], column_shares=[0.5, 0.5])
            layout = rrb.Vertical(top_row, bottom_row, row_shares=[0.5, 0.5])
        else:
            # Fallback to horizontal if less than 4 columns
            column_shares = [1.0/len(cols)] * len(cols)
            layout = rrb.Horizontal(*cols, column_shares=column_shares)
    elif total_graphs == 6:
        # 2x3 grid layout
        if len(cols) >= 6:
            top_row = rrb.Horizontal(cols[0], cols[1], cols[2], column_shares=[1.0/3, 1.0/3, 1.0/3])
            bottom_row = rrb.Horizontal(cols[3], cols[4], cols[5], column_shares=[1.0/3, 1.0/3, 1.0/3])
            layout = rrb.Vertical(top_row, bottom_row, row_shares=[0.5, 0.5])
        else:
            # Fallback to horizontal if less than 6 columns
            column_shares = [1.0/len(cols)] * len(cols)
            layout = rrb.Horizontal(*cols, column_shares=column_shares)
    else:
        # Default: equal horizontal distribution
        column_shares = [1.0/len(cols)] * len(cols)
        layout = rrb.Horizontal(*cols, column_shares=column_shares)
    
    print(f"[start-session] Layout: {total_graphs} graphs configured")

    # Build and send blueprint (Rerun 0.24+ API)
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

     # Step 1: Disconnect Rerun gRPC client cleanly to avoid transport errors
    try:
        rr.disconnect()
        print("[stop-session] rr.disconnect() successful")
    except Exception as e:
        print(f"[stop-session] rr.disconnect() failed: {e}")

    # Step 2: Kill the rerun CLI process depending on platform
    if rerun_server_proc and rerun_server_proc.poll() is None:
        print("[stop-session] Stopping rerun CLI...")
        if sys.platform == "win32":
            rerun_server_proc.send_signal(signal.CTRL_BREAK_EVENT)
        else:
            os.killpg(os.getpgid(rerun_server_proc.pid), signal.SIGTERM)
            # On Linux/macOS, if rerun spawns subprocesses, rerun_server_proc.terminate() won’t kill them.
            # os.setsid + os.killpg(...) guarantees the whole process group gets nuked.
        rerun_server_proc.wait(timeout=5)
        print("[stop-session] Rerun CLI stopped")

    return jsonify({"status": "stopped", "message": "Session stopped"})


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
        # file.save(UPLOAD_PATH) # ← Your file is saved as "latest.rrd"
        # print(f"Saved {file.filename} to {UPLOAD_PATH} for iframe viewer")
        
        return jsonify({
            "status": "success", 
            "message": f"File '{file.filename}' uploaded successfully for iframe viewer",
            "filename": file.filename
        })
            
    except Exception as e:
        print(f"Upload error for {file.filename}: {str(e)}")
        return jsonify({"status": "error", "message": f"Upload failed: {str(e)}"})


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
    print("started\n")
    try:
        serve(app, host='127.0.0.1', port=5002, threads=4)
    finally:
        if rerun_server_proc and rerun_server_proc.poll() is None:
            print("[shutdown] Flask server exiting, stopping Rerun CLI...")
        try:
            rr.disconnect()
        except Exception as e:
            print(f"[shutdown] rr.disconnect() failed: {e}")
        
        if sys.platform == "win32":
            rerun_server_proc.send_signal(signal.CTRL_BREAK_EVENT)
        else:
            os.killpg(os.getpgid(rerun_server_proc.pid), signal.SIGTERM)
        rerun_server_proc.wait(timeout=5)
        print("[shutdown] Rerun CLI terminated")
