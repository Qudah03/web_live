from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import tempfile
from waitress import serve

app = Flask(__name__)
CORS(app)

# Path to store the latest uploaded file
UPLOAD_PATH = os.path.join(tempfile.gettempdir(), "latest.rrd")

@app.route('/server-status', methods=['GET'])
def server_status():
    """Always return running status for iframe mode"""
    return jsonify({
        "running": True,
        "message": "Iframe mode - no native server needed"
    })

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

if __name__ == '__main__':
    print("Starting simplified Flask backend server for iframe mode...")
    print("Available endpoints:")
    print("- GET /server-status: Always returns running (iframe mode)")
    print("- POST /upload: Upload RRD file for iframe viewer")
    print("- GET /get-blueprint: Serve D1.rrd blueprint")
    print("- GET /last-uploaded: Serve the last uploaded RRD file")
    print("- GET /health: Health check")
    print("\nThis server only handles file uploads and serving for iframe viewer.")
    #print("No native rerun server management.")
    
    try:
        # Use waitress for production-ready server
        serve(app, host='0.0.0.0', port=5002, threads=4)
    except KeyboardInterrupt:
        print("\nShutting down...")
    except Exception as e:
        print(f"Error starting server: {e}")
