const { sendResponse, sendError, enableCors } = require("./_utils");
const db = require("../lib/db");

module.exports = async (req, res) => {
  enableCors(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return sendError(res, 405, "Method not allowed");
  }

  try {
    const result = await db.query(
      "SELECT channel_id, username FROM trank.channels WHERE username IS NOT NULL ORDER BY username",
    );
    const datasets = result.rows.map((row) => ({
      id: row.channel_id.toString(),
      username: row.username,
    }));
    return sendResponse(res, 200, { datasets });
  } catch (error) {
    console.error("Error fetching channels:", error);
    return sendError(res, 500, "Internal server error");
  }
};
