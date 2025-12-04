const { sendResponse, sendError, enableCors } = require("../../_utils");
const { getChannelId } = require("../utils");

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

    return sendResponse(res, 200, { channel_id: channelId });
  } catch (error) {
    console.error("Error fetching channel ID:", error);
    return sendError(res, 500, "Internal server error");
  }
};
