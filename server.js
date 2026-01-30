import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

// Mock API responses
const mockResponses = {
    '/api/ide': {
        token: 'mock-token-dev',
        authenticated: true
    },
    '/api/ide/sidenav': {
        stats: [0, 0],
        updatelog: {
            '01.30.2026': [
                'Development environment initialized',
                'Mock API server is running'
            ]
        }
    }
};

const server = http.createServer((req, res) => {
    // Enable CORS for API calls
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, uglifier-options, uglifier-session, uglifier-token');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Handle API requests
    const path_url = req.url.split('?')[0];
    if (path_url.startsWith('/api/')) {
        res.setHeader('Content-Type', 'application/json');
        const mockResponse = mockResponses[path_url];

        if (mockResponse) {
            res.writeHead(200);
            res.end(JSON.stringify(mockResponse));
        } else {
            res.writeHead(404);
            res.end(JSON.stringify({ error: 'Not found', path: path_url }));
        }
        return;
    }

    // Handle static files
    let filePath = path.join(__dirname, req.url);

    // Default to index.html for root path
    if (req.url === '/') {
        filePath = path.join(__dirname, 'index.html');
    }

    // Get file extension
    const ext = path.extname(filePath);

    // Set appropriate content types
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
        '.ttf': 'font/ttf',
        '.eot': 'application/vnd.ms-fontobject',
        '.json': 'application/json'
    };

    const contentType = mimeTypes[ext] || 'application/octet-stream';

    // Read and serve the file
    fs.readFile(filePath, (err, data) => {
        if (err) {
            // If file not found and it's not a dist file, try index.html
            if (err.code === 'ENOENT' && !filePath.includes('dist')) {
                fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
                    if (err) {
                        res.writeHead(404, { 'Content-Type': 'text/plain' });
                        res.end('404 Not Found');
                    } else {
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.end(data);
                    }
                });
            } else {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('404 Not Found');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});
