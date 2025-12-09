const { sendResponse, sendError, enableCors } = require("./_utils");
const { listCommunities } = require("./github/utils");

module.exports = async (req, res) => {
  enableCors(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return sendError(res, 405, "Method not allowed");
  }

  try {
    const datasets = await listCommunities();
    return sendResponse(res, 200, { datasets });
  } catch (error) {
    console.error("Error fetching GitHub communities:", error);
    return sendError(res, 500, "Internal server error");
  }
};
