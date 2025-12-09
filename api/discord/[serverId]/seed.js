const { sendResponse, sendError, enableCors } = require("../../_utils");
const { validateServerId, getLatestRunId, getSeeds } = require("../utils");

module.exports = async (req, res) => {
  enableCors(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return sendError(res, 405, "Method not allowed");
  }

  const { serverId: serverIdStr } = req.query;

  if (!serverIdStr) {
    return sendError(res, 400, "Missing server ID");
  }

  try {
    const validation = await validateServerId(serverIdStr);
    if (!validation.valid) {
      return sendError(res, 400, validation.error);
    }
    const serverId = validation.serverId;

    const runId = await getLatestRunId(serverId);
    if (!runId) {
      return sendError(res, 404, "No runs found for this server");
    }

    const seed = await getSeeds(serverId, runId);
    return sendResponse(res, 200, { seed });
  } catch (error) {
    console.error("Error fetching seeds:", error);
    return sendError(res, 500, "Internal server error");
  }
};
