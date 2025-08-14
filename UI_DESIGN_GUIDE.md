# CSI Visualizer UI Design Guide

## Overview
This document provides a comprehensive guide for AI agents to understand the data flow, component architecture, and backend integration requirements when modifying the UI design of the CSI Visualizer application.

## Application Architecture

### Tech Stack
- **Frontend**: React 18+ with React Router
- **Backend**: Flask (Python) running on `localhost:5002`
- **Visualization**: Rerun.io (embedded via iframes)
- **UI Components**: Native HTML select elements and form controls
- **Styling**: CSS with grid layouts and responsive design

## Data Flow Architecture

### 1. Upload Component Data Flow

```
User File Upload → Frontend Form → Backend API → File Storage → Iframe Viewer
```

**API Endpoints:**
- `POST http://localhost:5002/upload` - Upload .rrd files
- `GET http://localhost:5002/last-uploaded` - Retrieve last uploaded file
- `GET http://localhost:5002/get-blueprint` - Get blueprint configuration

**Required Data Structure:**
```javascript
// Upload Request
const formData = new FormData();
formData.append("file", file); // .rrd file

// Expected Response
{
  "status": "success",
  "message": "File uploaded successfully",
  "filename": "uploaded_file.rrd"
}
```

**Iframe Integration:**
```javascript
const iframeUrl = "https://app.rerun.io/version/0.24.0/index.html?url=http://localhost:5002/last-uploaded&blueprint-url=http://localhost:5002/get-blueprint";
```

### 2. Live Stream Component Data Flow

```
Graph Selection Interface → Session Payload → Backend Processing → Rerun Stream → Iframe Display
```

**API Endpoints:**
- `POST http://localhost:5002/api/start-session` - Start live streaming
- `POST http://localhost:5002/api/stop-session` - Stop live streaming

**Required Session Payload Structure:**
```javascript
const sessionPayload = {
  // Layout Configuration
  totalGraphs: 4,                 // Number of graphs in layout
  
  // Individual Graph Configurations
  graphConfigs: [
    {
      type: "heatmap",             // "heatmap", "timeseries", "camera"
      mode: "magnitude",           // "magnitude", "phase" (not for camera)
      subcarrier: null             // null for heatmap/camera, number (0-63) or "all" for timeseries
    },
    {
      type: "timeseries",
      mode: "phase",
      subcarrier: 5                // Specific subcarrier index
    }
  ],
  
  // Legacy Backend Compatibility Fields
  showCamera: false,              // Boolean - any camera graphs
  showHeatmap: true,              // Boolean - any heatmap graphs
  showMagHeatmap: true,           // Boolean - magnitude heatmap exists
  showPhaseHeatmap: false,        // Boolean - phase heatmap exists
  showTimeSeries: true,           // Boolean - any timeseries graphs
  showMagTimeSeries: false,       // Boolean - magnitude timeseries exists
  showPhaseTimeSeries: true,      // Boolean - phase timeseries exists
  subcarriers: [5, 10, 15]        // Array of numeric subcarrier indices only
};
```

**Expected Response:**
```javascript
{
  "status": "success",
  "iframeUrl": "https://app.rerun.io/version/0.24.0/index.html?url=ws://localhost:9877/",
  "sessionId": "unique_session_id"
}
```

## Component Structure Requirements

### 1. Home Component (`src/components/Home.js`)
**Purpose**: Landing page with navigation and branding

**Required Elements:**
- Company logo and branding
- Application title and description
- Navigation buttons with smooth scrolling
- Embedded Upload and LiveStream sections

**Key Props/State**: None (container component)

### 2. Upload Component (`src/components/Upload.js`)
**Purpose**: File upload and immediate visualization

**Required State:**
```javascript
const [fileName, setFileName] = useState(null);
const [loading, setLoading] = useState(false);
const [uploadError, setUploadError] = useState(null);
const [uploadSuccess, setUploadSuccess] = useState(false);
```

**Critical Functions:**
- `handleFileUpload(event)` - Process file upload
- File validation (accept only .rrd files)
- Progress indication during upload
- Automatic iframe generation post-upload

**UI Requirements:**
- File input with .rrd filter
- Upload progress indicator
- Success/error messaging
- Embedded iframe viewer (dimensions: 200vh x 100vh)

### 3. LiveStream Component (`src/components/LiveStream.js`)
**Purpose**: Container for GraphSelectionInterface

**Current Implementation:**
```javascript
export default function LiveStream() {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Live CSI Stream</h2>
      <p className="mb-4">Configure your visualization layout using the interface below:</p>
      <GraphSelectionInterface />
    </div>
  );
}
```

### 4. GraphSelectionInterface Component (`src/components/GraphSelectionInterface.js`)
**Purpose**: Advanced graph layout configuration and live visualization

**Required State:**
```javascript
const [graphCount, setGraphCount] = useState(1);
const [graphConfigs, setGraphConfigs] = useState([
  { type: "heatmap", mode: "magnitude", subcarrier: null }
]);
const [isSubmitted, setIsSubmitted] = useState(false);
const [iframeUrl, setIframeUrl] = useState('');
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState(null);
```

**Required Constants:**
```javascript
const ALLOWED_COUNTS = [1, 2, 4, 6]; // Supported graph layouts
```

**Graph Configuration Structure:**
```javascript
{
  type: "heatmap" | "timeseries" | "camera",
  mode: "magnitude" | "phase",      // Not applicable for camera
  subcarrier: null | number | "all" // Only for timeseries
}
```

**Critical Functions:**
- `handleGraphConfigChange(index, field, value)` - Update individual graph configs
- `validateConfigs()` - Validate configuration before submission
- `handleSubmit()` - Send configuration to backend and start session
- `handleStopAndReset()` - Stop session and reset interface

**UI Requirements:**
- Graph count selection (1, 2, 4, 6 graphs)
- Dynamic grid layout based on count
- Individual graph configuration cards
- Type selection (heatmap, timeseries, camera)
- Mode selection (magnitude, phase)
- Subcarrier selection for timeseries (0-63 or "all")
- Submit/Stop buttons with loading states
- Error message display
- Embedded iframe viewer (1300px x 600px)

### 5. RerunIframeViewer Component (`src/components/RerunIframeViewer.js`)
**Purpose**: Dedicated full-screen viewer

**Required State:**
```javascript
const [iframeUrl, setIframeUrl] = useState('');
```

**URL Construction Logic:**
```javascript
const viewerUrl = new URL("https://app.rerun.io/version/0.24.0/index.html");
viewerUrl.searchParams.set("url", "http://localhost:5002/last-uploaded");
viewerUrl.searchParams.set("blueprint-url", "http://localhost:5002/get-blueprint");
```

## CSS Architecture and Styling

### Required CSS Classes and Structure

**Core Layout Classes:**
```css
.centered {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
  font-family: Arial, sans-serif;
}

.button-group {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}
```

**Graph Selection Interface Classes:**
```css
.graph-selection-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.graph-grid {
  display: grid;
  gap: 16px;
  margin-bottom: 32px;
}

.graph-grid.count-1 { grid-template-columns: 1fr; }
.graph-grid.count-2 { grid-template-columns: repeat(2, 1fr); }
.graph-grid.count-4 { grid-template-columns: repeat(2, 1fr); }
.graph-grid.count-6 { grid-template-columns: repeat(3, 1fr); }

.graph-config-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  background-color: #f9f9f9;
}
```

**Button Styling:**
```css
button {
  padding: 8px 16px;
  font-size: 16px;
  cursor: pointer;
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 4px;
}

button.selected {
  background-color: #007bff;
  color: white;
  border-color: #0056b3;
}

.primary-button {
  background-color: #28a745;
  color: white;
}

.secondary-button {
  background-color: #6c757d;
  color: white;
}
```

**Form Controls:**
```css
.config-row select {
  width: 100%;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #ccc;
}

.radio-group {
  display: flex;
  gap: 16px;
}

.radio-group label {
  font-weight: normal;
  display: flex;
  align-items: center;
  gap: 6px;
}
```

## Backend Integration Requirements

### Flask Server Expectations
The backend expects these specific endpoints and data formats:

1. **File Upload**: 
   - Endpoint: `POST /upload`
   - Content-Type: `multipart/form-data`
   - File field name: `"file"`

2. **Session Management**:
   - Start: `POST /api/start-session`
   - Stop: `POST /api/stop-session`
   - Content-Type: `application/json`

3. **File Serving**:
   - Last uploaded: `GET /last-uploaded`
   - Blueprint: `GET /get-blueprint`

### Payload Transformation Logic
The GraphSelectionInterface transforms user selections into backend-compatible format:

```javascript
// Transform graph configs to legacy backend format
const hasHeatmap = graphConfigs.some(config => config.type === 'heatmap');
const hasTimeseries = graphConfigs.some(config => config.type === 'timeseries');
const timeseriesSubcarriers = graphConfigs
  .filter(config => config.type === 'timeseries' && config.subcarrier !== null)
  .map(config => config.subcarrier === 'all' ? 'all' : config.subcarrier);

const backendPayload = {
  totalGraphs: graphCount,
  graphConfigs: graphConfigs,
  showCamera: graphConfigs.some(config => config.type === 'camera'),
  showHeatmap: hasHeatmap,
  showMagHeatmap: graphConfigs.some(config => 
    config.type === 'heatmap' && config.mode === 'magnitude'),
  showPhaseHeatmap: graphConfigs.some(config => 
    config.type === 'heatmap' && config.mode === 'phase'),
  showTimeSeries: hasTimeseries && timeseriesSubcarriers.length > 0,
  showMagTimeSeries: graphConfigs.some(config => 
    config.type === 'timeseries' && config.mode === 'magnitude'),
  showPhaseTimeSeries: graphConfigs.some(config => 
    config.type === 'timeseries' && config.mode === 'phase'),
  subcarriers: timeseriesSubcarriers.filter(s => s !== 'all' && typeof s === 'number')
};
```

### Error Handling Requirements
All components must handle:
- Network failures
- Invalid file types
- Server unavailability
- Session timeout
- Invalid configuration parameters
- Graph validation errors

## UI Modification Guidelines

### When Changing Upload UI:
1. Maintain FormData structure for backend compatibility
2. Keep iframe integration with proper URL encoding
3. Preserve file type validation (.rrd only)
4. Maintain progress indication during upload
5. Keep iframe dimensions (200vh x 100vh)

### When Changing GraphSelectionInterface:
1. Maintain ALLOWED_COUNTS array for layout support
2. Preserve graphConfigs structure and validation
3. Keep CSS grid classes for responsive layouts
4. Maintain payload transformation logic for backend compatibility
5. Preserve session management state flow
6. Keep iframe dimensions (1300px x 600px)

### When Adding New Graph Types:
1. Update type options in select elements
2. Add new validation rules in validateConfigs()
3. Update payload transformation logic
4. Add corresponding CSS classes if needed
5. Update backend communication format

### When Changing Layout Options:
1. Update ALLOWED_COUNTS array
2. Add corresponding CSS grid classes (.count-X)
3. Update layout info display text
4. Test responsive behavior

## Testing Integration Points

### Key Test Scenarios:
1. **Upload Flow**: File → Backend → Iframe display
2. **Graph Configuration**: Selection → Validation → Session start
3. **Layout Changes**: Count selection → Grid update → Config preservation
4. **Session Management**: Start → Live data → Stop → Reset
5. **Error Handling**: Network failures, invalid inputs, validation errors

### Backend Dependency:
- Ensure Flask server is running on `localhost:5002`
- Verify all API endpoints are accessible
- Test with actual .rrd files for upload functionality
- Test live streaming with actual data source

## Common Pitfalls to Avoid

1. **URL Encoding**: Always encode iframe URLs properly for Rerun.io
2. **State Synchronization**: Keep UI state in sync with backend sessions
3. **File Validation**: Enforce .rrd file type restrictions
4. **Graph Validation**: Ensure timeseries graphs have subcarrier selection
5. **Layout Consistency**: Maintain CSS grid classes for proper display
6. **Session Cleanup**: Properly stop sessions before reset
7. **Payload Format**: Maintain both new (graphConfigs) and legacy format for backend

## Extension Points

### For Adding New Visualization Types:
1. Add new type option to graph configuration
2. Update validation logic in validateConfigs()
3. Extend payload transformation to include new type
4. Add UI controls for type-specific parameters

### For Enhanced Layout Support:
1. Add new count to ALLOWED_COUNTS array
2. Create corresponding CSS grid class
3. Update layout info text generation
4. Test responsive behavior

### For Advanced Configuration:
1. Extend graphConfigs structure with new parameters
2. Add corresponding UI controls
3. Update validation and payload transformation
4. Ensure backward compatibility with existing backend

This documentation ensures any AI agent can modify the UI while maintaining the critical data flow, layout system, and backend integration requirements of the current GraphSelectionInterface implementation.
