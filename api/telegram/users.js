const { sendResponse, sendError, enableCors } = require("../_utils");
const db = require("../../lib/db");

async function getChannelUsers(channelId, userIds) {
  const res = await db.query(
    `SELECT * FROM trank.channel_users WHERE channel_id = $1 AND user_id = ANY($2)`,
    [channelId, userIds],
  );

  return res.rows;
}

async function getUserMessageStats(channelId, userIds) {
  const res = await db.query(
    `SELECT
      from_id as user_id,
      COUNT(*) as num_messages_created,
      COUNT(*) FILTER (WHERE reply_to_msg_id IS NOT NULL) as num_replies_created
    FROM trank.messages
    WHERE channel_id = $1 AND from_id = ANY($2)
    GROUP BY from_id`,
    [channelId, userIds],
  );

  return res.rows;
}

async function getRepliesReceived(channelId, userIds) {
  const res = await db.query(
    `SELECT
      m2.from_id as user_id,
      COUNT(*) as num_replies_received
    FROM trank.messages m1
    INNER JOIN trank.messages m2 ON m1.reply_to_msg_id = m2.id AND m1.channel_id = m2.channel_id
    WHERE m1.channel_id = $1 AND m2.from_id = ANY($2) AND m1.from_id != m2.from_id
    GROUP BY m2.from_id`,
    [channelId, userIds],
  );

  return res.rows;
}

async function getReactionsCreated(channelId, userIds) {
  const res = await db.query(
    `SELECT
      user_id,
      COUNT(*) as num_reactions_created
    FROM trank.message_reactions
    WHERE channel_id = $1 AND user_id = ANY($2)
    GROUP BY user_id`,
    [channelId, userIds],
  );

  return res.rows;
}

async function getReactionsReceived(channelId, userIds) {
  const res = await db.query(
    `SELECT
      m.from_id as user_id,
      COUNT(*) as num_reactions_received
    FROM trank.message_reactions r
    INNER JOIN trank.messages m ON r.channel_id = m.channel_id AND r.message_id = m.id
    WHERE r.channel_id = $1 AND m.from_id = ANY($2) AND r.user_id != m.from_id
    GROUP BY m.from_id`,
    [channelId, userIds],
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

  const { channel_id, user_ids } = req.query;

  if (!channel_id) {
    return sendError(res, 400, "Missing channel_id parameter");
  }

  if (!user_ids) {
    return sendError(res, 400, "Missing user_ids parameter");
  }

  // Validate channel_id is numeric
  if (!/^\d+$/.test(channel_id)) {
    return sendError(res, 400, "channel_id must be a valid number");
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
      return sendError(res, 400, `Invalid user_id: ${userId}. All user_ids must be valid numbers`);
    }
  }

  try {
    const [users, messageStats, repliesReceived, reactionsCreated, reactionsReceived] = await Promise.all([
      getChannelUsers(channel_id, userIdsArray),
      getUserMessageStats(channel_id, userIdsArray),
      getRepliesReceived(channel_id, userIdsArray),
      getReactionsCreated(channel_id, userIdsArray),
      getReactionsReceived(channel_id, userIdsArray),
    ]);

    // Create lookup maps for stats
    const messageStatsMap = new Map(messageStats.map((s) => [s.user_id.toString(), s]));
    const repliesReceivedMap = new Map(repliesReceived.map((s) => [s.user_id.toString(), s]));
    const reactionsCreatedMap = new Map(reactionsCreated.map((s) => [s.user_id.toString(), s]));
    const reactionsReceivedMap = new Map(reactionsReceived.map((s) => [s.user_id.toString(), s]));

    // Merge stats into user objects
    const enrichedUsers = users.map((user) => {
      const msgStats = messageStatsMap.get(user.user_id.toString()) || {};
      const replies = repliesReceivedMap.get(user.user_id.toString()) || {};
      const reactionsC = reactionsCreatedMap.get(user.user_id.toString()) || {};
      const reactionsR = reactionsReceivedMap.get(user.user_id.toString()) || {};

      return {
        ...user,
        num_messages_created: parseInt(msgStats.num_messages_created) || 0,
        num_replies_created: parseInt(msgStats.num_replies_created) || 0,
        num_replies_received: parseInt(replies.num_replies_received) || 0,
        num_reactions_created: parseInt(reactionsC.num_reactions_created) || 0,
        num_reactions_received: parseInt(reactionsR.num_reactions_received) || 0,
      };
    });

    return sendResponse(res, 200, enrichedUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    return sendError(res, 500, "Internal server error");
  }
};
