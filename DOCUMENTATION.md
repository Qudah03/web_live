# Wi-EYE: Real-Time CSI Data Capture and Visualization Platform

## Overview

Wi-EYE is a comprehensive real-time Channel State Information (CSI) data capture and visualization platform built for wireless signal analysis and gesture recognition. The platform combines a React.js frontend with a Flask backend and leverages Rerun.io for advanced data visualization capabilities.

## Architecture

### System Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend│    │  Flask Backend  │    │   Rerun Server  │
│    (Port 3000)  │◄──►│   (Port 5002)   │◄──►│   (Port 9876)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  User Interface │    │Session Management│    │Data Visualization│
│  - Graph Config │    │ - Graph Types   │    │ - Real-time     │
│  - File Upload  │    │ - Subcarriers   │    │ - Interactive   │
│  - Live Stream  │    │ - Blueprint Gen │    │ - Multi-view    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Technology Stack

### Frontend (React.js)
- **Framework**: React 18.3.1
- **Build Tool**: Create React App
- **Routing**: React Router DOM v6.26.0
- **Styling**: Custom CSS with Inter font family
- **Key Dependencies**:
  - `@rerun-io/web-viewer`: Rerun.io web viewer integration
  - `@rerun-io/web-viewer-react`: React wrapper for Rerun viewer

### Backend (Python/Flask)
- **Framework**: Flask with Flask-CORS
- **Server**: Waitress WSGI server
- **Data Processing**: Rerun SDK v0.24.0
- **Process Management**: Subprocess for CLI integration
- **Key Dependencies**:
  - `rerun-sdk`: Python SDK for Rerun.io
  - `flask-cors`: Cross-origin resource sharing
  - `waitress`: Production WSGI server

### Visualization Engine
- **Platform**: Rerun.io v0.24.0
- **Protocol**: gRPC streaming
- **Features**: Real-time data visualization, interactive 3D/2D plots

## Project Structure

```
rerun-vis1/
├── backend.py                 # Flask server with session management
├── package.json              # Node.js dependencies and scripts
├── config-overrides.js       # Webpack configuration overrides
├── README.md                 # Basic project information
├── public/                   # Static assets
│   ├── index.html           # HTML template with Google Fonts
│   ├── logo.png             # Company logo
│   ├── logo1.png            # Alternative logo
│   ├── rerunLogo.png        # Rerun.io branding
│   └── heatmap.gif          # Demo gesture animations
├── src/                     # React source code
│   ├── App.js              # Main application component
│   ├── index.js            # Application entry point
│   ├── styles.css          # Global styling with Inter font
│   └── components/         # React components
│       ├── Home.js         # Landing page and navigation
│       ├── GraphSelector.js # Dynamic graph configuration
│       ├── SubcarrierSelector.js # Subcarrier selection
│       ├── Upload.js       # File upload and replay
│       ├── LiveStream.js   # Real-time streaming interface
│       ├── EmbeddedViewer.js # Rerun viewer integration
│       └── RerunIframeViewer.js # Iframe-based viewer
├── uploads/                # User uploaded RRD files
│   ├── blueprint_embedded.rrd
│   └── user_uploaded.rrd
├── blueprints/             # Generated Rerun blueprints
└── build/                  # Production build output
```

## Core Features

### 1. Real-Time CSI Data Visualization

The platform supports real-time visualization of Channel State Information data from Wi-Fi devices:

- **Amplitude Visualization**: Real-time amplitude heatmaps
- **Phase Visualization**: Phase relationship analysis
- **3D Scatter Plots**: Multi-dimensional data representation
- **Time Series**: Temporal data analysis

### 2. Dynamic Graph Configuration

Users can configure multiple visualization types simultaneously:

```javascript
// Supported graph types
const graphTypes = [
  'amplitude',     // CSI amplitude heatmaps
  'phase',         // CSI phase visualization
  'scatter3d',     // 3D scatter plots
  'timeseries'     // Time series analysis
];
```

### 3. Subcarrier Selection

Flexible subcarrier configuration for targeted analysis:

- **Individual Selection**: Choose specific subcarriers (0-63)
- **Range Selection**: Select continuous ranges
- **Multi-Selection**: Combine multiple subcarriers in single graphs
- **Dynamic Updates**: Real-time configuration changes

### 4. File Upload and Replay

Support for previously recorded CSI data:

- **RRD Format**: Native Rerun recording format
- **Drag & Drop**: Intuitive file upload interface
- **Instant Replay**: Immediate visualization of uploaded data
- **Session Persistence**: Maintain upload sessions

### 5. Session Management

Robust session handling for multi-user environments:

- **Session Isolation**: Independent user sessions
- **Configuration Persistence**: Maintain graph settings
- **Clean Shutdown**: Proper resource cleanup
- **Error Recovery**: Graceful error handling

## Component Architecture

### Frontend Components

#### 1. Home.js - Landing Page
```javascript
// Key responsibilities:
- Brand presentation with Wi-EYE title
- User instructions and deployment notes
- Navigation to upload/live stream modes
- Graph selector integration
- Server IP address display for deployment
```

#### 2. GraphSelector.js - Configuration Interface
```javascript
// Core functionality:
- Graph type selection (amplitude, phase, scatter3d, timeseries)
- Subcarrier configuration management
- Backend session communication
- Start/stop streaming controls
- Real-time configuration updates
```

#### 3. Upload.js - File Management
```javascript
// Features:
- RRD file upload handling
- Rerun iframe integration
- Responsive viewer sizing
- File validation and error handling
```

#### 4. SubcarrierSelector.js - Subcarrier Management
```javascript
// Capabilities:
- Individual subcarrier selection (0-63)
- Range-based selection
- Multi-selection support
- Dynamic list updates
```

### Backend Architecture

#### 1. Session Management
```python
# Flask routes for session handling
@app.route('/api/session/start', methods=['POST'])
@app.route('/api/session/stop', methods=['POST'])
@app.route('/api/session/reset', methods=['POST'])
```

#### 2. Graph Configuration Processing
```python
# Data format conversion and validation
def process_graph_config(config_data):
    # Convert frontend format to backend format
    # Handle subcarrier grouping
    # Generate Rerun blueprints
```

#### 3. Blueprint Generation
```python
# Dynamic blueprint creation for Rerun.io
def generate_blueprint(graph_types, subcarriers):
    # Create visualization layouts
    # Configure data streams
    # Set up real-time updates
```

## Data Flow

### 1. Configuration Flow
```
User Input → GraphSelector → Backend API → Session Storage → Blueprint Generation
```

### 2. Streaming Flow
```
CSI Client → Rerun Server → Backend Processing → Frontend Display
```

### 3. Upload Flow
```
File Upload → Backend Validation → Rerun Integration → Iframe Display
```

## API Endpoints

### Session Management
- `POST /api/session/start` - Initialize new session
- `POST /api/session/stop` - Stop current session
- `POST /api/session/reset` - Reset session configuration

### File Operations
- `POST /api/upload` - Upload RRD files
- `GET /api/files` - List uploaded files

### Configuration
- `POST /api/config` - Update graph configuration
- `GET /api/config` - Retrieve current configuration

## Installation and Setup

### Prerequisites
```bash
# Python 3.8+
python --version

# Node.js 16+
node --version
npm --version
```

### Backend Setup
```bash
# Create virtual environment
python -m venv venv

# Activate environment (Windows)
venv\Scripts\activate

# Install dependencies
pip install flask flask-cors rerun-sdk waitress

# Start backend server
python backend.py
```

### Frontend Setup
```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

### Rerun Server
```bash
# Start Rerun server (if using external data source)
rerun --serve --port 9876
```

## Configuration

### Environment Variables
```bash
# Backend configuration
FLASK_PORT=5002
RERUN_PORT=9876
UPLOAD_FOLDER=./uploads

# Frontend configuration
REACT_APP_BACKEND_URL=http://localhost:5002
REACT_APP_RERUN_URL=http://localhost:9876
```

### Graph Types Configuration
```python
# Supported visualization types
GRAPH_TYPES = {
    'amplitude': 'CSI Amplitude Heatmap',
    'phase': 'CSI Phase Visualization',
    'scatter3d': '3D Scatter Plot',
    'timeseries': 'Time Series Analysis'
}
```

### Subcarrier Configuration
```javascript
// Valid subcarrier range
const SUBCARRIER_RANGE = {
    min: 0,
    max: 63,
    default: [0, 31, 63]
};
```

## Deployment

### Development Deployment
```bash
# Terminal 1: Backend
python backend.py

# Terminal 2: Frontend
npm start

# Access application at http://localhost:3000
```

### Production Deployment
```bash
# Build frontend
npm run build

# Serve with production server
# Backend: Waitress server (built-in)
# Frontend: Serve build directory with web server

# Configure firewall for ports 3000, 5002, 9876
```

### Network Configuration
For deployment across networks, configure clients to connect to:
- **Frontend**: `http://{server-ip}:3000`
- **Backend**: `http://{server-ip}:5002`
- **Rerun Stream**: `{server-ip}:9876`
- **Stream Name**: `"csi-camera-stream"`

## Data Formats

### CSI Data Format
```python
# Expected CSI data structure
{
    "timestamp": "2025-08-16T10:30:00Z",
    "subcarrier": 0-63,
    "amplitude": float,
    "phase": float,
    "metadata": {
        "device_id": "esp32_001",
        "channel": 6,
        "bandwidth": 20
    }
}
```

### RRD File Format
Rerun Recording Data (RRD) files contain:
- Timestamped data points
- Entity paths and components
- Metadata and annotations
- Compressed binary format

## Troubleshooting

### Common Issues

#### 1. Backend Connection Failed
```bash
# Check backend status
curl http://localhost:5002/api/health

# Verify Python environment
python -c "import flask, rerun"
```

#### 2. Rerun Server Not Responding
```bash
# Check Rerun server
rerun --version

# Restart with verbose logging
rerun --serve --port 9876 --verbose
```

#### 3. Frontend Build Issues
```bash
# Clear cache
npm run build -- --reset-cache

# Check dependencies
npm audit
```

#### 4. File Upload Problems
```bash
# Check upload directory permissions
ls -la uploads/

# Verify file format
file uploads/example.rrd
```

### Performance Optimization

#### 1. Frontend Optimization
- Implement React.memo for heavy components
- Use lazy loading for large datasets
- Optimize iframe rendering

#### 2. Backend Optimization
- Session cleanup and garbage collection
- Efficient blueprint caching
- Database connection pooling (if applicable)

#### 3. Network Optimization
- Compress data streams
- Implement WebSocket for real-time updates
- CDN for static assets

## Contributing

### Development Guidelines
1. Follow React hooks patterns
2. Use TypeScript for new components
3. Implement comprehensive error handling
4. Add unit tests for critical functions
5. Document API changes

### Code Style
- ESLint configuration for JavaScript
- Black formatter for Python
- Prettier for consistent formatting

## License

This project is developed for CSI data analysis and visualization research. Please refer to individual package licenses for third-party dependencies.

## Support

For technical support and questions:
1. Check this documentation
2. Review error logs in browser console
3. Verify backend logs in terminal
4. Consult Rerun.io documentation for visualization issues

## Version History

- **v1.0.0**: Initial release with basic CSI visualization
- **v1.1.0**: Added multi-graph support and subcarrier selection
- **v1.2.0**: Implemented session management and file upload
- **v1.3.0**: Enhanced UI with Inter font and responsive design
- **v1.4.0**: Added deployment configuration and error handling
