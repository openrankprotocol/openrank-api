const fs = require('fs');
const path = require('path');

/**
 * Load a dataset file from the datasets directory
 * @param {string} platform - The platform name (discord, github, telegram, x)
 * @param {string} fileName - The file name without .json extension
 * @returns {Object|null} The parsed JSON data or null if not found
 */
function loadDataset(platform, fileName) {
  try {
    const filePath = path.join(process.cwd(), 'datasets', platform, `${fileName}.json`);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    return null;
  }
}

/**
 * Paginate an array
 * @param {Array} array - The array to paginate
 * @param {number} start - Starting index
 * @param {number} size - Number of items to return
 * @returns {Array} Paginated array
 */
function paginate(array, start = 0, size = null) {
  const startIndex = Math.max(0, start);
  const endIndex = size ? Math.min(array.length, startIndex + size) : array.length;
  return array.slice(startIndex, endIndex);
}

/**
 * Send JSON response
 * @param {Object} res - Response object
 * @param {number} statusCode - HTTP status code
 * @param {*} data - Data to send
 */
function sendResponse(res, statusCode, data) {
  res.status(statusCode).json(data);
}

/**
 * Send error response
 * @param {Object} res - Response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 */
function sendError(res, statusCode, message) {
  res.status(statusCode).json({ error: message });
}

/**
 * Enable CORS for the response
 * @param {Object} res - Response object
 */
function enableCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = {
  loadDataset,
  paginate,
  sendResponse,
  sendError,
  enableCors
};
