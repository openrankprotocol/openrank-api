const fs = require("fs");
const path = require("path");

// Get the correct base path for datasets
function getDatasetsPath() {
  const possiblePaths = [
    path.join(process.cwd(), "datasets"),
    path.join(__dirname, "..", "..", "..", "datasets"),
    path.join("/var/task", "datasets"),
    "datasets",
  ];

  for (const testPath of possiblePaths) {
    if (fs.existsSync(testPath)) {
      return testPath;
    }
  }

  return path.join(process.cwd(), "datasets");
}

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    res.setHeader("Content-Type", "application/json");
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Get the id from query params (Vercel passes it as req.query.id)
  let id = req.query.id;

  // If not in query, try to extract from URL
  if (!id) {
    const url = req.url || "";
    const match = url.match(/\/pfps\/([^/?]+)/);
    if (match && match[1]) {
      id = match[1];
    }
  }

  if (!id) {
    res.setHeader("Content-Type", "application/json");
    return res.status(400).json({ error: "Missing user ID" });
  }

  // Remove .jpg extension if present (since we expect requests like /pfps/123.jpg)
  const userId = id.replace(/\.jpg$/i, "");

  // Validate that userId is numeric to prevent directory traversal
  if (!/^\d+$/.test(userId)) {
    res.setHeader("Content-Type", "application/json");
    return res.status(400).json({ error: "Invalid user ID format" });
  }

  const datasetsPath = getDatasetsPath();
  const filePath = path.join(datasetsPath, "telegram", "pfps", `${userId}.jpg`);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    res.setHeader("Content-Type", "application/json");
    return res.status(404).json({ error: "Profile picture not found" });
  }

  try {
    const imageBuffer = fs.readFileSync(filePath);

    // Set appropriate headers for image response
    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader("Cache-Control", "public, max-age=86400"); // Cache for 24 hours

    return res.status(200).send(imageBuffer);
  } catch (error) {
    console.error("Error reading profile picture:", error.message);
    res.setHeader("Content-Type", "application/json");
    return res.status(500).json({ error: "Internal server error" });
  }
};
