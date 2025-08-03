# Rerun Visualization Architecture Guide

This document explains the methods and architecture used in our Rerun visualization system, and what needs to be considered when changing to another layout layer or frontend framework.

## System Overview

Our system consists of:
- **Frontend**: React.js application with dynamic graph configuration
- **Backend**: Flask server managing Rerun sessions and blueprints
- **Visualization Engine**: Rerun with blueprint-based layouts
- **Data Flow**: Real-time streaming via gRPC + WebSocket proxy

## Core Architecture Methods

### 1. Frontend State Management (React)

#### Key State Variables
```javascript
const [graphCount, setGraphCount] = useState(1);          // Number of graphs (1,2,4,6)
const [graphConfigs, setGraphConfigs] = useState([...]);  // Individual graph configurations
const [isSubmitted, setIsSubmitted] = useState(false);    // Session state
const [iframeUrl, setIframeUrl] = useState('');          // Rerun viewer URL
```

#### Configuration Management
- **Dynamic Graph Configs**: Automatically adjusts `graphConfigs` array when `graphCount` changes
- **Validation System**: Validates configurations before submission
- **Type-Safe Updates**: Ensures only valid combinations (e.g., timeseries requires subcarrier)

#### Layout System
- **CSS Grid-Based**: Uses CSS grid with dynamic classes (`count-1`, `count-2`, `count-4`, `count-6`)
- **Responsive Design**: Adapts to different graph counts automatically
- **Card-Based Configuration**: Each graph gets its own configuration card

### 2. Backend Session Management (Flask + Rerun)

#### Session Lifecycle
```python
# 1. Start Session
@app.route('/api/start-session', methods=['POST'])
def start_session():
    global rerun_server_proc, record_path
    
    # A) Stop existing session
    # B) Create unique recording path
    # C) Start Rerun CLI in record+serve mode
    # D) Build blueprint from configuration
    # E) Return iframe URL
```

#### Blueprint Generation System
The backend uses a **dynamic blueprint builder** that:

1. **Processes Individual Graphs**: Iterates through `graphConfigs` array
2. **Creates Rerun Views**: Maps each config to appropriate Rerun view type
3. **Builds Layout Structure**: Arranges views based on total graph count

#### Layout Algorithms
```python
# Layout Logic Based on Graph Count
if total_graphs == 1:
    layout = rrb.Horizontal(*cols, column_shares=[1.0])
elif total_graphs == 2:
    layout = rrb.Horizontal(*cols, column_shares=[0.5, 0.5])
elif total_graphs == 4:
    # 2x2 Grid
    top_row = rrb.Horizontal(cols[0], cols[1], column_shares=[0.5, 0.5])
    bottom_row = rrb.Horizontal(cols[2], cols[3], column_shares=[0.5, 0.5])
    layout = rrb.Vertical(top_row, bottom_row, row_shares=[0.5, 0.5])
elif total_graphs == 6:
    # 2x3 Grid
    top_row = rrb.Horizontal(cols[0], cols[1], cols[2], column_shares=[1/3, 1/3, 1/3])
    bottom_row = rrb.Horizontal(cols[3], cols[4], cols[5], column_shares=[1/3, 1/3, 1/3])
    layout = rrb.Vertical(top_row, bottom_row, row_shares=[0.5, 0.5])
```

### 3. Rerun Integration Methods

#### Blueprint System
- **Dynamic Blueprint Creation**: Generates layouts based on configuration
- **View Types Supported**:
  - `TensorView`: For heatmaps (magnitude/phase)
  - `TimeSeriesView`: For time-series data (per subcarrier or all)
  - `Spatial2DView`: For camera feeds

#### Data Path Mapping
```python
# Heatmap Paths
"csi/magnitude_heatmap" → Magnitude Heatmap
"csi/phase_heatmap" → Phase Heatmap

# Time Series Paths
"magnitude_vs_time/subcarrier_XXX" → Specific subcarrier magnitude
"phase_vs_time/subcarrier_XXX" → Specific subcarrier phase
"magnitude_vs_time" → All subcarriers (raw data)

# Camera Paths
"camera/live_feed" → Camera feed data
```

### 4. Communication Protocol

#### Frontend → Backend
```javascript
const backendPayload = {
  totalGraphs: graphCount,           // Layout hint
  graphConfigs: [...],               // Individual configurations
  showCamera: boolean,               // Legacy compatibility
  showHeatmap: boolean,              // Legacy compatibility
  // ... other legacy flags
};
```

#### Backend → Frontend
```javascript
const response = {
  status: "started",
  recordingUrl: "/api/recordings/filename.rrd",  // For post-session viewing
  iframeUrl: "https://app.rerun.io/version/0.24.0/index.html?url=..."
};
```

### 5. Session Persistence Method

#### Live Session Management
- **Session Start**: Spawns Rerun CLI process with gRPC server
- **Session Stop**: Cleanly terminates process and disconnects gRPC
- **Iframe Persistence**: Keeps iframe visible after session stop (no reload)

#### Implementation Pattern
```javascript
// Working persistence pattern from LiveStream.js
const stopSession = async () => {
  await fetch('http://localhost:5002/api/stop-session', { method: 'POST' });
  setLive(true);        // Keep session state active
  setCanSave(true);     // Enable save functionality
  // Note: No window.location.reload() - this preserves iframe
};
```

## Adapting to Different Layout Layers

### If Changing Frontend Framework (React → Vue/Angular/etc.)

#### Required State Management
1. **Graph Count State**: Track number of graphs (1,2,4,6)
2. **Graph Configuration Array**: Store individual graph settings
3. **Session State**: Track if visualization is active
4. **URL State**: Store iframe source URL

#### Required UI Components
1. **Graph Count Selector**: Button group for 1,2,4,6 options
2. **Configuration Grid**: Dynamic grid matching graph count
3. **Individual Graph Cards**: Type, mode, subcarrier selectors
4. **Action Buttons**: Start/stop session controls
5. **Iframe Container**: Rerun visualization display

#### CSS Layout Requirements
```css
/* Essential layout classes for any framework */
.graph-grid.count-1 { grid-template-columns: 1fr; }
.graph-grid.count-2 { grid-template-columns: repeat(2, 1fr); }
.graph-grid.count-4 { grid-template-columns: repeat(2, 1fr); }
.graph-grid.count-6 { grid-template-columns: repeat(3, 1fr); }
```

### If Changing Layout System (CSS Grid → Flexbox/Other)

#### Current CSS Grid Approach
- Uses `grid-template-columns` for responsive layouts
- Dynamic classes based on graph count
- 2x2 and 2x3 grid arrangements

#### Alternative Flexbox Approach
```css
.graph-grid {
  display: flex;
  flex-wrap: wrap;
}

.graph-grid.count-1 .graph-config-card { width: 100%; }
.graph-grid.count-2 .graph-config-card { width: 50%; }
.graph-grid.count-4 .graph-config-card { width: 50%; }
.graph-grid.count-6 .graph-config-card { width: 33.33%; }
```

### If Changing Backend Framework (Flask → FastAPI/Express/etc.)

#### Required Endpoints
1. **POST /api/start-session**: Process graph configs and start Rerun
2. **POST /api/stop-session**: Clean session termination
3. **GET /api/recordings/{id}**: Serve recorded data files

#### Required Logic
1. **Process Management**: Start/stop Rerun CLI processes
2. **Blueprint Generation**: Convert configs to Rerun blueprints
3. **Layout Algorithm**: Map graph count to layout structure
4. **URL Generation**: Create proper iframe URLs with encoding

### If Changing Visualization Engine (Rerun → D3/Three.js/etc.)

#### Current Rerun Dependencies
- **Blueprint System**: Declarative layout definitions
- **gRPC Streaming**: Real-time data updates
- **Multiple View Types**: Heatmaps, time series, spatial views

#### Required Adaptations
1. **Layout Engine**: Replicate 1/2/4/6 graph arrangements
2. **Data Binding**: Map CSI data to visualization components
3. **Real-time Updates**: Handle streaming data efficiently
4. **View Types**: Implement heatmap, time-series, camera views

## Key Integration Points

### 1. Configuration Validation
- Ensure timeseries graphs have subcarrier selections
- Validate at least one graph is properly configured
- Handle "all subcarriers" special case

### 2. URL Encoding Handling
```javascript
// Critical for Rerun iframe integration
const [base, urlPart] = data.iframeUrl.split('?url=');
const encodedUrl = urlPart ? encodeURIComponent(urlPart) : '';
const finalUrl = encodedUrl ? `${base}?url=${encodedUrl}` : data.iframeUrl;
```

### 3. Process Lifecycle Management
- Clean session termination to prevent zombie processes
- Proper gRPC disconnection before process kill
- Platform-specific signal handling (Windows vs Unix)

### 4. Blueprint Layout Logic
- Map frontend graph count to backend layout algorithms
- Handle fallback cases (fewer configured graphs than requested)
- Maintain consistent view ordering and sizing

## Performance Considerations

### Frontend Optimization
- Debounce configuration changes to prevent excessive API calls
- Use React.memo or equivalent for expensive components
- Lazy load visualization iframe only when needed

### Backend Optimization
- Reuse Rerun connections when possible
- Implement connection pooling for multiple sessions
- Cache blueprint generation for identical configurations

### Memory Management
- Clean up Rerun processes on session end
- Monitor recording file sizes
- Implement file cleanup for old sessions

## Testing Strategy

### Unit Tests Required
1. **Configuration Validation**: Test all validation scenarios
2. **Layout Generation**: Verify blueprint creation logic
3. **Process Management**: Mock Rerun CLI interactions
4. **URL Encoding**: Test iframe URL generation

### Integration Tests Required
1. **Full Session Lifecycle**: Start → Configure → Stop → Cleanup
2. **Multi-Graph Layouts**: Test all supported graph counts
3. **Error Handling**: Network failures, invalid configs
4. **Browser Compatibility**: Iframe embedding across browsers

This architecture provides a solid foundation that can be adapted to different frontend frameworks, layout systems, or visualization engines while maintaining the core functionality of dynamic graph configuration and real-time visualization.
