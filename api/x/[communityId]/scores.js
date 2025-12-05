const { sendResponse, sendError, enableCors } = require("../../_utils");
const { validateCommunityId, getLatestRunId, getScores } = require("../utils");

module.exports = async (req, res) => {
  enableCors(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return sendError(res, 405, "Method not allowed");
  }

  const { communityId: communityIdStr } = req.query;

  if (!communityIdStr) {
    return sendError(res, 400, "Missing community ID");
  }

  const start = parseInt(req.query.start) || 0;
  const size = req.query.size ? parseInt(req.query.size) : null;

  try {
    const validation = await validateCommunityId(communityIdStr);
    if (!validation.valid) {
      return sendError(res, 400, validation.error);
    }
    const communityId = validation.communityId;

    const runId = await getLatestRunId(communityId);
    if (!runId) {
      return sendError(res, 404, "No runs found for this community");
    }

    const data = await getScores(communityId, runId, start, size);
    return sendResponse(res, 200, data);
  } catch (error) {
    console.error("Error fetching scores:", error);
    return sendError(res, 500, "Internal server error");
  }
};
