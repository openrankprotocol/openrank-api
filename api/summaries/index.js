const { sendResponse, sendError, enableCors } = require("../_utils");
const { getSummaries } = require("./helpers");
const db = require("../../lib/db");

module.exports = async (req, res) => {
  enableCors(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return sendError(res, 405, "Method not allowed");
  }

  try {
    const ids =
      (req?.query?.ids || req?.query?.params?.ids)
        ?.split(",")
        ?.map((t) => t.trim()) || [];

    const summaries = await getSummaries(db, ids);
    return sendResponse(res, 200, summaries);
  } catch (error) {
    console.error("Error fetching summaries:", error);
    return sendError(res, 500, "Internal server error");
  }
};
