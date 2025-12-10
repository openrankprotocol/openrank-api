const { sendResponse, sendError, enableCors } = require("../_utils");
const db = require("../../lib/db");

async function getUserMessageStats(serverId, userIds) {
  const res = await db.query(
    `SELECT
      m.author_id as user_id,
      COUNT(*) as num_messages_created
    FROM socialrank.messages m
    INNER JOIN socialrank.channels c ON m.channel_id = c.id
    WHERE c.server_id = $1 AND m.author_id = ANY($2)
    GROUP BY m.author_id`,
    [serverId, userIds],
  );

  return res.rows;
}

async function getReactionsCreated(serverId, userIds) {
  const res = await db.query(
    `SELECT
      r.user_id,
      COUNT(*) as num_reactions_created
    FROM socialrank.reaction_users r
    INNER JOIN socialrank.messages m ON r.message_id = m.id
    INNER JOIN socialrank.channels c ON m.channel_id = c.id
    WHERE c.server_id = $1 AND r.user_id = ANY($2)
    GROUP BY r.user_id`,
    [serverId, userIds],
  );

  return res.rows;
}

async function getReactionsReceived(serverId, userIds) {
  const res = await db.query(
    `SELECT
      m.author_id as user_id,
      COUNT(*) as num_reactions_received
    FROM socialrank.reaction_users r
    INNER JOIN socialrank.messages m ON r.message_id = m.id
    INNER JOIN socialrank.channels c ON m.channel_id = c.id
    WHERE c.server_id = $1 AND m.author_id = ANY($2) AND r.user_id != m.author_id
    GROUP BY m.author_id`,
    [serverId, userIds],
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

  const { server_id, user_ids } = req.query;

  if (!server_id) {
    return sendError(res, 400, "Missing server_id parameter");
  }

  if (!user_ids) {
    return sendError(res, 400, "Missing user_ids parameter");
  }

  // Validate server_id is numeric
  if (!/^\d+$/.test(server_id)) {
    return sendError(res, 400, "server_id must be a valid number");
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
    const [messageStats, reactionsCreated, reactionsReceived] =
      await Promise.all([
        getUserMessageStats(server_id, userIdsArray),
        getReactionsCreated(server_id, userIdsArray),
        getReactionsReceived(server_id, userIdsArray),
      ]);

    // Create lookup maps for stats
    const messageStatsMap = new Map(
      messageStats.map((s) => [s.user_id.toString(), s]),
    );
    const reactionsCreatedMap = new Map(
      reactionsCreated.map((s) => [s.user_id.toString(), s]),
    );
    const reactionsReceivedMap = new Map(
      reactionsReceived.map((s) => [s.user_id.toString(), s]),
    );

    // Build response for each user
    const users = userIdsArray.map((userId) => {
      const msgStats = messageStatsMap.get(userId) || {};
      const reactionsC = reactionsCreatedMap.get(userId) || {};
      const reactionsR = reactionsReceivedMap.get(userId) || {};

      return {
        user_id: userId,
        num_messages_created: parseInt(msgStats.num_messages_created) || 0,
        num_reactions_created: parseInt(reactionsC.num_reactions_created) || 0,
        num_reactions_received:
          parseInt(reactionsR.num_reactions_received) || 0,
      };
    });

    return sendResponse(res, 200, users);
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return sendError(res, 500, "Internal server error");
  }
};
