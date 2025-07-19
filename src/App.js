import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import Upload from './components/Upload';
import LiveStream from './components/LiveStream';
import WebViewerPage from './components/WebViewerPage';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/live" element={<LiveStream />} />
        <Route path="/viewer" element={<WebViewerPage />} />
      </Routes>
    </Router>
  );
}
