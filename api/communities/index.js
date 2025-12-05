const { sendResponse, sendError, enableCors } = require("../_utils");
const { getAllCommunities } = require("./utils");

module.exports = async (req, res) => {
  enableCors(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return sendError(res, 405, "Method not allowed");
  }

  try {
    const communities = await getAllCommunities();
    return sendResponse(res, 200, communities);
  } catch (error) {
    console.error("Error fetching communities:", error);
    return sendError(res, 500, "Internal server error");
  }
};
