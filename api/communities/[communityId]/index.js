const { sendResponse, sendError, enableCors } = require("../../_utils");
const { getCommunityById } = require("../utils");

module.exports = async (req, res) => {
  enableCors(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return sendError(res, 405, "Method not allowed");
  }

  const { communityId } = req.query;

  if (!communityId) {
    return sendError(res, 400, "Missing community ID");
  }

  try {
    const community = await getCommunityById(communityId);
    if (!community) {
      return sendError(res, 404, "Community not found");
    }

    return sendResponse(res, 200, community);
  } catch (error) {
    console.error("Error fetching community:", error);
    return sendError(res, 500, "Internal server error");
  }
};
