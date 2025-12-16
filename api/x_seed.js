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
      "SELECT id, name, x_seed FROM openrank.communities WHERE x_seed IS NOT NULL ORDER BY name",
    );
    const datasets = result.rows.map((row) => ({
      id: row.x_seed.toString(),
      name: row.name,
    }));

    return sendResponse(res, 200, { datasets });
  } catch (error) {
    console.error("Error fetching x_seed datasets:", error);
    return sendError(res, 500, "Internal server error");
  }
};
