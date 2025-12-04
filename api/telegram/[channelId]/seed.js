const { sendResponse, sendError, enableCors } = require("../../_utils");
const { getChannelId, getLatestRunId, getSeeds } = require("../utils");

module.exports = async (req, res) => {
  enableCors(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return sendError(res, 405, "Method not allowed");
  }

  const { channelId: channelIdStr } = req.query;

  if (!channelIdStr) {
    return sendError(res, 400, "Missing channel ID");
  }

  try {
    const channelId = await getChannelId(channelIdStr);
    if (!channelId) {
      return sendError(res, 404, "Channel not found");
    }

    const runId = await getLatestRunId(channelId);
    if (!runId) {
      return sendError(res, 404, "No runs found for this channel");
    }

    const seed = await getSeeds(channelId, runId);
    return sendResponse(res, 200, { seed });
  } catch (error) {
    console.error("Error fetching seeds:", error);
    return sendError(res, 500, "Internal server error");
  }
};
