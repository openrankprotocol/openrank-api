const fs = require("fs");
const path = require("path");

// Get the correct base path for datasets
// On Vercel, files are relative to the function location
function getDatasetsPath() {
  // Try multiple possible locations
  const possiblePaths = [
    path.join(process.cwd(), "datasets"),
    path.join(__dirname, "..", "..", "datasets"),
    path.join("/var/task", "datasets"),
    "datasets",
  ];

  for (const testPath of possiblePaths) {
    if (fs.existsSync(testPath)) {
      return testPath;
    }
  }

  // Default to process.cwd() if none found
  return path.join(process.cwd(), "datasets");
}

/**
 * Load a dataset file from local storage
 * @param {string} platform - The platform name (discord, github, telegram, x)
 * @param {string} fileName - The file name without .json extension
 * @returns {Promise<Object|null>} The parsed JSON data or null if not found
 */
async function loadDatasetAsync(platform, fileName) {
  try {
    const datasetsPath = getDatasetsPath();
    const filePath = path.join(datasetsPath, platform, `${fileName}.json`);

    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, "utf8");
      return JSON.parse(fileContent);
    }

    return null;
  } catch (error) {
    console.error(
      `Error loading dataset ${platform}/${fileName}:`,
      error.message,
    );
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
  const endIndex = size
    ? Math.min(array.length, startIndex + size)
    : array.length;
  return array.slice(startIndex, endIndex);
}

/**
 * Send JSON response
 * @param {Object} res - Response object
 * @param {number} statusCode - HTTP status code
 * @param {*} data - Data to send
 */
function sendResponse(res, statusCode, data) {
  // Check if this is a Vercel response object or Node.js http response
  if (res.status && res.json) {
    // Vercel format
    res.status(statusCode).json(data);
  } else {
    // Node.js http format
    res.writeHead(statusCode, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
  }
}

/**
 * Send error response
 * @param {Object} res - Response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 */
function sendError(res, statusCode, message) {
  // Check if this is a Vercel response object or Node.js http response
  if (res.status && res.json) {
    // Vercel format
    res.status(statusCode).json({ error: message });
  } else {
    // Node.js http format
    res.writeHead(statusCode, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: message }));
  }
}

/**
 * Enable CORS for the response
 * @param {Object} res - Response object
 */
function enableCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

/**
 * List available dataset files for a platform
 * @param {string} platform - The platform name (discord, github, telegram, x)
 * @returns {Promise<Array<string>>} Array of file names without .json extension
 */
async function listDatasets(platform) {
  try {
    const datasetsPath = getDatasetsPath();
    const dirPath = path.join(datasetsPath, platform);

    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath);
      return files
        .filter((file) => file.endsWith(".json"))
        .map((file) => file.replace(".json", ""))
        .sort();
    }

    return [];
  } catch (error) {
    console.error(`Error listing datasets for ${platform}:`, error.message);
    return [];
  }
}

module.exports = {
  loadDatasetAsync,
  paginate,
  sendResponse,
  sendError,
  enableCors,
  listDatasets,
};
