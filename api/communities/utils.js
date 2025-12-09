const db = require("../../lib/db");

async function getCommunityById(id) {
  const res = await db.query(
    `SELECT id, name, telegram, discord, github, x, farcaster, seed_x, created_at, updated_at
     FROM openrank.communities
     WHERE id = $1`,
    [id],
  );
  return res.rows.length > 0 ? res.rows[0] : null;
}

async function getAllCommunities() {
  const res = await db.query(`
    SELECT id, name, telegram, discord, github, x, farcaster, seed_x, created_at, updated_at
    FROM openrank.communities
    ORDER BY name
  `);
  return res.rows;
}

async function getTelegramActiveUsers(channelId) {
  if (!channelId) return null;

  // Get latest run_id for this channel
  const runRes = await db.query(
    `SELECT run_id FROM trank.runs WHERE channel_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [channelId],
  );
  if (runRes.rows.length === 0) return null;
  const runId = runRes.rows[0].run_id;

  // Count unique users who sent messages AND are in the scores list
  const res = await db.query(
    `SELECT COUNT(DISTINCT m.from_id) as count
     FROM trank.messages m
     INNER JOIN trank.scores s ON m.from_id = s.user_id AND s.channel_id = $1 AND s.run_id = $2
     WHERE m.channel_id = $1`,
    [channelId, runId],
  );
  return parseInt(res.rows[0].count);
}

async function getXActiveUsers(communityId) {
  if (!communityId) return null;

  // Get latest run_id for this community
  const runRes = await db.query(
    `SELECT run_id FROM xrank.runs WHERE community_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [communityId],
  );
  if (runRes.rows.length === 0) return null;
  const runId = runRes.rows[0].run_id;

  // Count unique users who posted, replied, or quoted (not retweets) AND are in the scores list
  const res = await db.query(
    `SELECT COUNT(DISTINCT i.author_user_id) as count
     FROM xrank.interactions i
     INNER JOIN xrank.scores s ON i.author_user_id = s.user_id AND s.community_id = $1 AND s.run_id = $2
     WHERE i.community_id = $1
     AND i.interaction_type IN ('post', 'reply', 'quote')`,
    [communityId, runId],
  );
  return parseInt(res.rows[0].count);
}

async function getActiveUserStats(community) {
  const [telegram, x] = await Promise.all([
    getTelegramActiveUsers(community.telegram),
    getXActiveUsers(community.x),
  ]);

  return {
    telegram,
    x,
    discord: null,
    farcaster: null,
  };
}

module.exports = {
  getCommunityById,
  getAllCommunities,
  getActiveUserStats,
};
