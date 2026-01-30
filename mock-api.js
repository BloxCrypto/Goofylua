import http from 'http';

const MOCK_PORT = 6968;

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
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, uglifier-options, uglifier-session, uglifier-token');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const path = req.url.split('?')[0]; // Remove query string
    const mockResponse = mockResponses[path];

    if (mockResponse) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(mockResponse));
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found', path }));
    }
});

server.listen(MOCK_PORT, () => {
    console.log(`Mock API server running at http://localhost:${MOCK_PORT}/`);
});
