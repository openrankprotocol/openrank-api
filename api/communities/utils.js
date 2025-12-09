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

  const res = await db.query(
    `SELECT COUNT(DISTINCT from_id) as count
     FROM trank.messages
     WHERE channel_id = $1`,
    [channelId],
  );
  return parseInt(res.rows[0].count);
}

async function getXActiveUsers(communityId) {
  if (!communityId) return null;

  // Count unique users who posted, replied, or quoted (not retweets)
  const res = await db.query(
    `SELECT COUNT(DISTINCT author_user_id) as count
     FROM xrank.interactions
     WHERE community_id = $1
     AND interaction_type IN ('post', 'reply', 'quote')`,
    [communityId],
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
