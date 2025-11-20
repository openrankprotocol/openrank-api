const {
  listDatasets,
  sendResponse,
  sendError,
  enableCors,
} = require("./_utils");

module.exports = async (req, res) => {
  enableCors(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return sendError(res, 405, "Method not allowed");
  }

  const datasets = await listDatasets("discord");

  return sendResponse(res, 200, { datasets });
};
