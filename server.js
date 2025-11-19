const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Import handlers
const discordHandler = require('./api/discord/[...params]');
const githubHandler = require('./api/github/[...params]');
const telegramHandler = require('./api/telegram/[...params]');
const xHandler = require('./api/x/[...params]');
const apiIndexHandler = require('./api/index');

const PORT = process.env.PORT || 3000;

// Mock Vercel request/response for local development
function createMockVercelContext(req, res, params, queryParams) {
  req.query = {
    params: params,
    ...queryParams
  };
}

function serveStaticFile(filePath, res) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath);
    const contentTypes = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'text/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml'
    };

    res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'text/plain' });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const queryParams = parsedUrl.query;

  console.log(`${req.method} ${pathname}`);

  // Serve static files from public directory
  if (pathname === '/' || pathname === '/index.html') {
    serveStaticFile(path.join(__dirname, 'public', 'index.html'), res);
    return;
  }

  // Handle API routes
  if (pathname.startsWith('/api')) {
    // Remove /api prefix and split path
    const apiPath = pathname.replace(/^\/api\/?/, '');
    const pathParts = apiPath.split('/').filter(part => part);

    if (pathParts.length === 0) {
      // API index
      await apiIndexHandler(req, res);
      return;
    }

    const platform = pathParts[0];
    const params = pathParts.slice(1);

    try {
      // Mock Vercel request format
      createMockVercelContext(req, res, params, queryParams);

      // Route to appropriate handler
      switch (platform) {
        case 'discord':
          await discordHandler(req, res);
          break;
        case 'github':
          await githubHandler(req, res);
          break;
        case 'telegram':
          await telegramHandler(req, res);
          break;
        case 'x':
          await xHandler(req, res);
          break;
        default:
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Platform not found' }));
      }
    } catch (error) {
      console.error('Error handling request:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
    return;
  }

  // 404 for everything else
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('404 Not Found');
});

server.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║                                                        ║');
  console.log('║              🚀 OpenRank API Server                    ║');
  console.log('║                                                        ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`📡 Server running at: http://localhost:${PORT}`);
  console.log(`📖 Documentation: http://localhost:${PORT}`);
  console.log(`🔌 API Endpoint: http://localhost:${PORT}/api`);
  console.log('');
  console.log('Available endpoints:');
  console.log(`  • http://localhost:${PORT}/api/discord/ritual`);
  console.log(`  • http://localhost:${PORT}/api/github/bitcoin`);
  console.log(`  • http://localhost:${PORT}/api/telegram/decentraliseddotco`);
  console.log(`  • http://localhost:${PORT}/api/x/ritual-community`);
  console.log('');
  console.log('Press Ctrl+C to stop the server');
  console.log('');
});

process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down server...\n');
  server.close(() => {
    console.log('✅ Server closed\n');
    process.exit(0);
  });
});
