require("dotenv").config();
const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

// Import pfp handler
const telegramPfpHandler = require("./api/telegram/pfps/[id]");

// Import handlers
const discordHandler = require("./api/discord/[...params]");
const githubHandler = require("./api/github/[...params]");
const apiIndexHandler = require("./api/index");

// Import list handlers
const discordListHandler = require("./api/discord");
const githubListHandler = require("./api/github");
const telegramListHandler = require("./api/telegram");
const xListHandler = require("./api/x");
const communitiesListHandler = require("./api/communities/index");

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
          } else if (params[0] === "pfps" && params.length >= 2) {
            // Handle profile picture requests
            req.query.id = params[1];
            await telegramPfpHandler(req, res);
          } else {
            // New file-based routing for telegram
            const channelId = params[0];
            req.query.channelId = channelId;

            if (params.length === 1) {
              // /telegram/:channelId -> index.js
              await require("./api/telegram/[channelId]/index")(req, res);
            } else if (params.length === 2) {
              const endpoint = params[1];
              if (endpoint === "seed") {
                await require("./api/telegram/[channelId]/seed")(req, res);
              } else if (endpoint === "scores") {
                await require("./api/telegram/[channelId]/scores")(req, res);
              } else if (endpoint === "channel_id") {
                await require("./api/telegram/[channelId]/channel_id")(req, res);
              } else {
                 // Fallback or 404 for unknown sub-endpoints
                 res.writeHead(404, { "Content-Type": "application/json" });
                 res.end(JSON.stringify({ error: "Endpoint not found" }));
              }
            } else {
               res.writeHead(404, { "Content-Type": "application/json" });
               res.end(JSON.stringify({ error: "Endpoint not found" }));
            }
          }
          return;
        case "x":
          if (params.length === 0) {
            // List all available datasets
            await xListHandler(req, res);
          } else {
            // New file-based routing for x
            const communityId = params[0];
            req.query.communityId = communityId;

            if (params.length === 1) {
              // /x/:communityId -> index.js
              await require("./api/x/[communityId]/index")(req, res);
            } else if (params.length === 2) {
              const endpoint = params[1];
              if (endpoint === "seed") {
                await require("./api/x/[communityId]/seed")(req, res);
              } else if (endpoint === "scores") {
                await require("./api/x/[communityId]/scores")(req, res);
              } else if (endpoint === "community_id") {
                await require("./api/x/[communityId]/community_id")(req, res);
              } else {
                // Fallback or 404 for unknown sub-endpoints
                res.writeHead(404, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Endpoint not found" }));
              }
            } else {
              res.writeHead(404, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: "Endpoint not found" }));
            }
          }
          return;
        case "communities":
          if (params.length === 0) {
            // List all communities
            await communitiesListHandler(req, res);
          } else {
            // File-based routing for communities
            const communityId = params[0];
            req.query.communityId = communityId;

            if (params.length === 1) {
              // /communities/:communityId -> index.js
              await require("./api/communities/[communityId]/index")(req, res);
            } else {
              res.writeHead(404, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: "Endpoint not found" }));
            }
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
