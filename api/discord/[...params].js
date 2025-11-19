const { loadDataset, paginate, sendResponse, sendError, enableCors } = require('../_utils');

module.exports = async (req, res) => {
  enableCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return sendError(res, 405, 'Method not allowed');
  }

  const { params } = req.query;

  if (!params || params.length === 0) {
    return sendError(res, 400, 'Missing parameters');
  }

  const fileName = params[0];
  const endpoint = params[1] || null;

  // Load the dataset
  const data = loadDataset('discord', fileName);

  if (!data) {
    return sendError(res, 404, 'File not found');
  }

  // Handle different endpoints
  if (!endpoint) {
    // Return complete dataset
    return sendResponse(res, 200, data);
  }

  if (endpoint === 'seed') {
    return sendResponse(res, 200, data.seed);
  }

  if (endpoint === 'server_id') {
    return sendResponse(res, 200, { server_id: data.server_id });
  }

  if (endpoint === 'scores') {
    const start = parseInt(req.query.start) || 0;
    const size = req.query.size ? parseInt(req.query.size) : null;
    const paginatedScores = paginate(data.scores, start, size);
    return sendResponse(res, 200, paginatedScores);
  }

  return sendError(res, 404, 'Endpoint not found');
};
