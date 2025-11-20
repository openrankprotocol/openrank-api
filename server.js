const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

// Import handlers
const discordHandler = require("./api/discord/[...params]");
const githubHandler = require("./api/github/[...params]");
const telegramHandler = require("./api/telegram/[...params]");
const xHandler = require("./api/x/[...params]");
const apiIndexHandler = require("./api/index");

// Import list handlers
const discordListHandler = require("./api/discord");
const githubListHandler = require("./api/github");
const telegramListHandler = require("./api/telegram");
const xListHandler = require("./api/x");

const PORT = process.env.PORT || 3000;

// Mock Vercel request/response for local development
function createMockVercelContext(req, res, params, queryParams) {
  req.query = {
    params: params,
    ...queryParams,
  };
}

function serveStaticFile(filePath, res) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("404 Not Found");
      return;
    }

    const ext = path.extname(filePath);
    const contentTypes = {
      ".html": "text/html",
      ".css": "text/css",
      ".js": "text/javascript",
      ".json": "application/json",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".gif": "image/gif",
      ".svg": "image/svg+xml",
    };

    res.writeHead(200, { "Content-Type": contentTypes[ext] || "text/plain" });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const queryParams = parsedUrl.query;

  console.log(`${req.method} ${pathname}`);

  // Serve static files from public directory
  if (pathname === "/" || pathname === "/index.html") {
    serveStaticFile(path.join(__dirname, "public", "index.html"), res);
    return;
  }

  // Handle platform routes
  const pathParts = pathname
    .slice(1)
    .split("/")
    .filter((part) => part);

  if (pathParts.length > 0) {
    const platform = pathParts[0];
    const params = pathParts.slice(1);

    try {
      // Mock Vercel request format
      createMockVercelContext(req, res, params, queryParams);

      // Route to appropriate handler
      switch (platform) {
        case "discord":
          if (params.length === 0) {
            // List all available datasets
            await discordListHandler(req, res);
          } else {
            // Handle specific dataset
            await discordHandler(req, res);
          }
          return;
        case "github":
          if (params.length === 0) {
            // List all available datasets
            await githubListHandler(req, res);
          } else {
            // Handle specific dataset
            await githubHandler(req, res);
          }
          return;
        case "telegram":
          if (params.length === 0) {
            // List all available datasets
            await telegramListHandler(req, res);
          } else {
            // Handle specific dataset
            await telegramHandler(req, res);
          }
          return;
        case "x":
          if (params.length === 0) {
            // List all available datasets
            await xListHandler(req, res);
          } else {
            // Handle specific dataset
            await xHandler(req, res);
          }
          return;
      }
    } catch (error) {
      console.error("Error handling request:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Internal server error" }));
      return;
    }
  }

  // 404 for everything else
  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("404 Not Found");
});

server.listen(PORT, () => {
  console.log("");
  console.log("╔════════════════════════════════════════════════════════╗");
  console.log("║                                                        ║");
  console.log("║              🚀 OpenRank API Server                    ║");
  console.log("║                                                        ║");
  console.log("╚════════════════════════════════════════════════════════╝");
  console.log("");
  console.log(`📡 Server running at: http://localhost:${PORT}`);
  console.log(`📖 Documentation: http://localhost:${PORT}`);
  console.log("");
  console.log("Available endpoints:");
  console.log(
    `  • http://localhost:${PORT}/discord - List all Discord datasets`,
  );
  console.log(`  • http://localhost:${PORT}/github - List all GitHub datasets`);
  console.log(
    `  • http://localhost:${PORT}/telegram - List all Telegram datasets`,
  );
  console.log(`  • http://localhost:${PORT}/x - List all X datasets`);
  console.log(`  • http://localhost:${PORT}/discord/ritual`);
  console.log(`  • http://localhost:${PORT}/github/bitcoin`);
  console.log(`  • http://localhost:${PORT}/telegram/decentraliseddotco`);
  console.log(`  • http://localhost:${PORT}/x/ritual-community`);
  console.log("");
  console.log("Press Ctrl+C to stop the server");
  console.log("");
});

process.on("SIGINT", () => {
  console.log("\n\n👋 Shutting down server...\n");
  server.close(() => {
    console.log("✅ Server closed\n");
    process.exit(0);
  });
});
