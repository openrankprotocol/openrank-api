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

  const { params } = req.query;

  if (!params || params.length === 0) {
    return sendError(res, 400, "Missing parameters");
  }

  const fileName = params[0];
  const endpoint = params[1] || null;

  // Load the dataset
  const data = await loadDatasetAsync("discord", fileName);

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

  if (endpoint === "server_id") {
    return sendResponse(res, 200, { server_id: data.server_id });
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
