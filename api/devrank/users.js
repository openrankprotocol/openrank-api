const { sendResponse, sendError, enableCors } = require("../_utils");
const db = require("../../lib/db");

async function getUserStats(communityId, userIds) {
  const res = await db.query(
    `SELECT
      user_login as user_id,
      SUM(CASE WHEN event_type = 'ISSUE_OPENED' THEN event_count ELSE 0 END) as num_issues_created,
      SUM(CASE WHEN event_type = 'PULL_REQUEST_OPENED' THEN event_count ELSE 0 END) as num_pull_requests_opened,
      SUM(CASE WHEN event_type = 'PULL_REQUEST_MERGED' THEN event_count ELSE 0 END) as num_pull_requests_merged,
      SUM(CASE WHEN event_type = 'PULL_REQUEST_REVIEWED' THEN event_count ELSE 0 END) as num_pull_requests_reviewed,
      SUM(CASE WHEN event_type = 'COMMIT_CODE' THEN event_count ELSE 0 END) as num_commits,
      COUNT(DISTINCT CASE WHEN event_type IN ('ISSUE_OPENED', 'PULL_REQUEST_OPENED', 'PULL_REQUEST_MERGED', 'PULL_REQUEST_REVIEWED', 'COMMIT_CODE') THEN repo END) as num_unique_repos_contributed
    FROM devrank.interactions
    WHERE repo IN (
      SELECT REPLACE(url, 'https://github.com/', '') FROM devrank.ecosystems WHERE ecosystem_name = $1
    )
    AND user_login = ANY($2)
    GROUP BY user_login`,
    [communityId, userIds],
  );

  return res.rows;
}

module.exports = async (req, res) => {
  enableCors(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return sendError(res, 405, "Method not allowed");
  }

  const { community_id, user_ids } = req.query;

  if (!community_id) {
    return sendError(res, 400, "Missing community_id parameter");
  }

  if (!user_ids) {
    return sendError(res, 400, "Missing user_ids parameter");
  }

  // Parse user_ids - can be comma-separated string or array
  let userIdsArray;
  if (Array.isArray(user_ids)) {
    userIdsArray = user_ids;
  } else {
    userIdsArray = user_ids.split(",").map((id) => id.trim());
  }

  try {
    const stats = await getUserStats(community_id, userIdsArray);

    // Create lookup map for stats
    const statsMap = new Map(stats.map((s) => [s.user_id, s]));

    // Build response for each user
    const users = userIdsArray.map((userId) => {
      const userStats = statsMap.get(userId) || {};

      return {
        user_id: userId,
        num_issues_created: parseInt(userStats.num_issues_created) || 0,
        num_pull_requests_opened:
          parseInt(userStats.num_pull_requests_opened) || 0,
        num_pull_requests_merged:
          parseInt(userStats.num_pull_requests_merged) || 0,
        num_pull_requests_reviewed:
          parseInt(userStats.num_pull_requests_reviewed) || 0,
        num_commits: parseInt(userStats.num_commits) || 0,
        num_unique_repos_contributed:
          parseInt(userStats.num_unique_repos_contributed) || 0,
      };
    });

    return sendResponse(res, 200, users);
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return sendError(res, 500, "Internal server error");
  }
};
