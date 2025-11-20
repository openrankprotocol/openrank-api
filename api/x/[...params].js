const {
  loadDatasetAsync,
  paginate,
  sendResponse,
  sendError,
  enableCors,
} = require("../_utils");

module.exports = async (req, res) => {
  enableCors(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return sendError(res, 405, "Method not allowed");
  }

  // Handle params from both Vercel and local server
  let params = req.query.params;

  // On Vercel, params might come from the URL directly
  // Extract from req.url if params not in query
  if (!params) {
    const url = req.url || "";
    // Try different URL patterns (Vercel may strip the platform prefix)
    const match = url.match(/\/x\/([^?]+)/) || url.match(/^\/([^?]+)/);
    if (match && match[1]) {
      params = match[1].split("/");
    }
  }

  // If no params found, return error
  if (!params || params.length === 0) {
    return sendError(res, 400, "Missing parameters");
  }

  // Ensure params is an array and split if it's a string with slashes
  if (!Array.isArray(params)) {
    // If it's a string like "ritual-community/seed", split it
    params = typeof params === "string" ? params.split("/") : [params];
  }

  const fileName = params[0];
  const endpoint = params[1] || null;

  // Load the dataset
  const data = await loadDatasetAsync("x", fileName);

  if (!data) {
    return sendError(res, 404, "File not found");
  }

  // Handle different endpoints
  if (!endpoint) {
    // Return complete dataset
    return sendResponse(res, 200, data);
  }

  if (endpoint === "seed") {
    return sendResponse(res, 200, { seed: data.seed });
  }

  if (endpoint === "community_id") {
    return sendResponse(res, 200, { community_id: data.community_id });
  }

  if (endpoint === "scores") {
    const start = parseInt(req.query.start) || 0;
    const size = req.query.size ? parseInt(req.query.size) : null;

    // Handle start beyond array bounds
    if (start >= data.scores.length) {
      return sendResponse(res, 200, {
        scores: [],
        pagination: {
          start: start,
          size: 0,
          total: data.scores.length,
        },
      });
    }

    const paginatedScores = paginate(data.scores, start, size);

    // Calculate actual size returned
    const actualSize = size
      ? Math.min(size, data.scores.length - start)
      : data.scores.length - start;

    return sendResponse(res, 200, {
      scores: paginatedScores,
      pagination: {
        start: start,
        size: actualSize,
        total: data.scores.length,
      },
    });
  }

  return sendError(res, 404, "Endpoint not found");
};
