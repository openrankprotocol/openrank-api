const { sendResponse, sendError, enableCors } = require("../_utils");
const db = require("../../lib/db");

async function getInteractionsCreated(communityId, userIds) {
  const res = await db.query(
    `SELECT
      author_user_id as user_id,
      COUNT(*) FILTER (WHERE interaction_type = 'post') as num_community_posts_created,
      COUNT(*) FILTER (WHERE interaction_type = 'quote') as num_community_post_quotes_created,
      COUNT(*) FILTER (WHERE interaction_type = 'retweet') as num_community_post_reposts_created,
      COUNT(*) FILTER (WHERE interaction_type = 'reply') as num_community_post_replies_created
    FROM xrank.interactions
    WHERE community_id = $1 AND author_user_id = ANY($2)
    GROUP BY author_user_id`,
    [communityId, userIds],
  );

  return res.rows;
}

async function getGlobalInteractionsCreated(userIds) {
  const res = await db.query(
    `SELECT
      author_user_id as user_id,
      COUNT(*) FILTER (WHERE interaction_type = 'post') as num_posts_created,
      COUNT(*) FILTER (WHERE interaction_type = 'quote') as num_post_quotes_created,
      COUNT(*) FILTER (WHERE interaction_type = 'retweet') as num_post_reposts_created,
      COUNT(*) FILTER (WHERE interaction_type = 'reply') as num_post_replies_created
    FROM xrank.interactions
    WHERE author_user_id = ANY($1)
    GROUP BY author_user_id`,
    [userIds],
  );

  return res.rows;
}

async function getGlobalInteractionsReceived(userIds) {
  const res = await db.query(
    `SELECT
      user_id,
      SUM(num_quotes) as num_post_quotes_received,
      SUM(num_reposts) as num_post_reposts_received,
      SUM(num_replies) as num_post_replies_received
    FROM (
      SELECT
        quoted_user_id as user_id,
        COUNT(*) as num_quotes,
        0 as num_reposts,
        0 as num_replies
      FROM xrank.interactions
      WHERE quoted_user_id = ANY($1) AND author_user_id != quoted_user_id
      GROUP BY quoted_user_id

      UNION ALL

      SELECT
        retweeted_user_id as user_id,
        0 as num_quotes,
        COUNT(*) as num_reposts,
        0 as num_replies
      FROM xrank.interactions
      WHERE retweeted_user_id = ANY($1) AND author_user_id != retweeted_user_id
      GROUP BY retweeted_user_id

      UNION ALL

      SELECT
        reply_to_user_id as user_id,
        0 as num_quotes,
        0 as num_reposts,
        COUNT(*) as num_replies
      FROM xrank.interactions
      WHERE reply_to_user_id = ANY($1) AND author_user_id != reply_to_user_id
      GROUP BY reply_to_user_id
    ) sub
    GROUP BY user_id`,
    [userIds],
  );

  return res.rows;
}

async function getInteractionsReceived(communityId, userIds) {
  const res = await db.query(
    `WITH community_posts AS (
      SELECT author_user_id, post_id
      FROM xrank.interactions
      WHERE community_id = $1 AND interaction_type = 'post' AND author_user_id = ANY($2)
    )
    SELECT
      user_id,
      SUM(num_quotes) as num_community_post_quotes_received,
      SUM(num_reposts) as num_community_post_reposts_received,
      SUM(num_replies) as num_community_post_replies_received
    FROM (
      SELECT
        cp.author_user_id as user_id,
        COUNT(*) as num_quotes,
        0 as num_reposts,
        0 as num_replies
      FROM xrank.interactions i
      INNER JOIN community_posts cp ON i.quoted_post_id = cp.post_id
      WHERE i.interaction_type = 'quote' AND i.author_user_id != cp.author_user_id
      GROUP BY cp.author_user_id

      UNION ALL

      SELECT
        cp.author_user_id as user_id,
        0 as num_quotes,
        COUNT(*) as num_reposts,
        0 as num_replies
      FROM xrank.interactions i
      INNER JOIN community_posts cp ON i.retweeted_post_id = cp.post_id
      WHERE i.interaction_type = 'retweet' AND i.author_user_id != cp.author_user_id
      GROUP BY cp.author_user_id

      UNION ALL

      SELECT
        cp.author_user_id as user_id,
        0 as num_quotes,
        0 as num_reposts,
        COUNT(*) as num_replies
      FROM xrank.interactions i
      INNER JOIN community_posts cp ON i.reply_to_post_id = cp.post_id
      WHERE i.community_id = $1 AND i.interaction_type = 'reply' AND i.author_user_id != cp.author_user_id
      GROUP BY cp.author_user_id
    ) sub
    GROUP BY user_id`,
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

  // Validate community_id is numeric
  if (!/^\d+$/.test(community_id)) {
    return sendError(res, 400, "community_id must be a valid number");
  }

  // Parse user_ids - can be comma-separated string or array
  let userIdsArray;
  if (Array.isArray(user_ids)) {
    userIdsArray = user_ids;
  } else {
    userIdsArray = user_ids.split(",").map((id) => id.trim());
  }

  // Validate all user_ids are numeric
  for (const userId of userIdsArray) {
    if (!/^\d+$/.test(userId)) {
      return sendError(
        res,
        400,
        `Invalid user_id: ${userId}. All user_ids must be valid numbers`,
      );
    }
  }

  try {
    const [created, received, globalCreated, globalReceived] =
      await Promise.all([
        getInteractionsCreated(community_id, userIdsArray),
        getInteractionsReceived(community_id, userIdsArray),
        getGlobalInteractionsCreated(userIdsArray),
        getGlobalInteractionsReceived(userIdsArray),
      ]);

    // Create lookup maps for stats
    const createdMap = new Map(created.map((s) => [s.user_id.toString(), s]));
    const receivedMap = new Map(received.map((s) => [s.user_id.toString(), s]));
    const globalCreatedMap = new Map(
      globalCreated.map((s) => [s.user_id.toString(), s]),
    );
    const globalReceivedMap = new Map(
      globalReceived.map((s) => [s.user_id.toString(), s]),
    );

    // Build response for each user
    const users = userIdsArray.map((userId) => {
      const createdStats = createdMap.get(userId) || {};
      const receivedStats = receivedMap.get(userId) || {};
      const globalCreatedStats = globalCreatedMap.get(userId) || {};
      const globalReceivedStats = globalReceivedMap.get(userId) || {};

      return {
        user_id: userId,
        num_community_posts_created:
          parseInt(createdStats.num_community_posts_created) || 0,
        num_community_post_quotes_created:
          parseInt(createdStats.num_community_post_quotes_created) || 0,
        num_community_post_reposts_created:
          parseInt(createdStats.num_community_post_reposts_created) || 0,
        num_community_post_replies_created:
          parseInt(createdStats.num_community_post_replies_created) || 0,
        num_community_post_quotes_received:
          parseInt(receivedStats.num_community_post_quotes_received) || 0,
        num_community_post_reposts_received:
          parseInt(receivedStats.num_community_post_reposts_received) || 0,
        num_community_post_replies_received:
          parseInt(receivedStats.num_community_post_replies_received) || 0,
        num_posts_created: parseInt(globalCreatedStats.num_posts_created) || 0,
        num_post_quotes_created:
          parseInt(globalCreatedStats.num_post_quotes_created) || 0,
        num_post_reposts_created:
          parseInt(globalCreatedStats.num_post_reposts_created) || 0,
        num_post_replies_created:
          parseInt(globalCreatedStats.num_post_replies_created) || 0,
        num_post_quotes_received:
          parseInt(globalReceivedStats.num_post_quotes_received) || 0,
        num_post_reposts_received:
          parseInt(globalReceivedStats.num_post_reposts_received) || 0,
        num_post_replies_received:
          parseInt(globalReceivedStats.num_post_replies_received) || 0,
      };
    });

    return sendResponse(res, 200, users);
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return sendError(res, 500, "Internal server error");
  }
};
