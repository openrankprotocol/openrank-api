const { sendResponse, sendError, enableCors } = require("../../_utils");
const { getAllCommunityData } = require("../utils");

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

  // Validate that communityId is a valid integer
  const communityId = parseInt(communityIdStr, 10);
  if (isNaN(communityId)) {
    return sendError(res, 400, "Invalid community ID - must be a number");
  }

  try {
    const data = await getAllCommunityData(communityId);
    if (!data) {
      return sendError(res, 404, "Community not found");
    }

    return sendResponse(res, 200, data);
  } catch (error) {
    console.error("Error fetching community data:", error);
    return sendError(res, 500, "Internal server error");
  }
};
