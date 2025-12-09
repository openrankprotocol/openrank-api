const { sendResponse, sendError, enableCors } = require("../_utils");
const {
  validateCommunityId,
  getLatestRunId,
  getSeeds,
  getScores,
  getAllData,
} = require("./utils");

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
    const match = url.match(/\/github\/([^?]+)/) || url.match(/^\/([^?]+)/);
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
    // If it's a string like "123/seed", split it
    params = typeof params === "string" ? params.split("/") : [params];
  }

  const communityIdStr = params[0];
  const endpoint = params[1] || null;

  try {
    // Validate community ID
    const validation = await validateCommunityId(communityIdStr);
    if (!validation.valid) {
      return sendError(res, 400, validation.error);
    }
    const communityId = validation.communityId;

    // Get latest run ID
    const runId = await getLatestRunId(communityId);
    if (!runId) {
      return sendError(res, 404, "No runs found for this community");
    }

    // Handle different endpoints
    if (!endpoint) {
      // Return complete dataset
      const data = await getAllData(communityId, runId);
      return sendResponse(res, 200, data);
    }

    if (endpoint === "seed") {
      const seed = await getSeeds(communityId, runId);
      return sendResponse(res, 200, { seed });
    }

    if (endpoint === "scores") {
      const start = parseInt(req.query.start) || 0;
      const size = req.query.size ? parseInt(req.query.size) : null;
      const data = await getScores(communityId, runId, start, size);
      return sendResponse(res, 200, data);
    }

    return sendError(res, 404, "Endpoint not found");
  } catch (error) {
    console.error("Error fetching GitHub data:", error);
    return sendError(res, 500, "Internal server error");
  }
};
