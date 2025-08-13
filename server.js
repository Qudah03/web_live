// server.js
const express = require('express');
const path = require('path');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3000;

// When packaged, __dirname becomes /snapshot/..., but files next to the exe live at path.dirname(process.execPath)
const baseDir = process.pkg ? path.dirname(process.execPath) : __dirname;
const staticDir = path.join(baseDir, 'build');

app.use(compression());
app.use(express.static(staticDir, { maxAge: '1y', extensions: ['html'] }));
app.get(/.*/, (_, res) => res.sendFile(path.join(staticDir, 'index.html')));

app.listen(PORT, () => console.log(`Serving on http://localhost:${PORT}`));
