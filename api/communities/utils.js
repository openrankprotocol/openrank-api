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

async function getCommunityByName(name) {
  const res = await db.query(
    `SELECT id, name, telegram, discord, github, x, farcaster, seed_x, created_at, updated_at
     FROM openrank.communities
     WHERE name = $1`,
    [name],
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

async function getTelegramStats(channelId) {
  if (!channelId) return null;

  // Get latest run
  const runRes = await db.query(
    "SELECT run_id FROM trank.runs WHERE channel_id = $1 ORDER BY created_at DESC LIMIT 1",
    [channelId],
  );
  if (runRes.rows.length === 0) return null;
  const runId = runRes.rows[0].run_id;

  // Get channel info
  const channelRes = await db.query(
    "SELECT channel_id, name, username, is_group, description, member_count FROM trank.channels WHERE channel_id = $1",
    [channelId],
  );
  const channel = channelRes.rows.length > 0 ? channelRes.rows[0] : null;

  // Get score count
  const countRes = await db.query(
    "SELECT COUNT(*) as count FROM trank.scores WHERE channel_id = $1 AND run_id = $2",
    [channelId, runId],
  );
  const scoreCount = parseInt(countRes.rows[0].count);

  return {
    channel,
    run_id: runId,
    score_count: scoreCount,
  };
}

async function getDiscordStats(serverId) {
  if (!serverId) return null;
  // TODO: Implement when discord schema is available
  return null;
}

async function getGithubStats(communityId) {
  if (!communityId) return null;

  // Get latest run
  const runRes = await db.query(
    "SELECT run_id FROM devrank.runs WHERE community_id = $1 ORDER BY created_at DESC LIMIT 1",
    [communityId],
  );
  if (runRes.rows.length === 0) return null;
  const runId = runRes.rows[0].run_id;

  // Get score count (excluding orgs)
  const countRes = await db.query(
    "SELECT COUNT(*) as count FROM devrank.scores WHERE community_id = $1 AND run_id = $2 AND user_id NOT LIKE '%/%'",
    [communityId, runId],
  );
  const scoreCount = parseInt(countRes.rows[0].count);

  return {
    community_id: communityId,
    run_id: runId,
    score_count: scoreCount,
  };
}

async function getXStats(communityId) {
  if (!communityId) return null;

  // Get latest run
  const runRes = await db.query(
    "SELECT run_id FROM xrank.runs WHERE community_id = $1 ORDER BY created_at DESC LIMIT 1",
    [communityId],
  );
  if (runRes.rows.length === 0) return null;
  const runId = runRes.rows[0].run_id;

  // Get community info
  const communityRes = await db.query(
    "SELECT community_id, name, description, creator_id FROM xrank.communities WHERE community_id = $1",
    [communityId],
  );
  const community = communityRes.rows.length > 0 ? communityRes.rows[0] : null;

  // Get score count
  const countRes = await db.query(
    "SELECT COUNT(*) as count FROM xrank.scores WHERE community_id = $1 AND run_id = $2",
    [communityId, runId],
  );
  const scoreCount = parseInt(countRes.rows[0].count);

  return {
    community,
    run_id: runId,
    score_count: scoreCount,
  };
}

async function getAllCommunityData(id) {
  const community = await getCommunityById(id);
  if (!community) return null;

  // Fetch stats for each platform in parallel
  const [telegramStats, discordStats, githubStats, xStats] = await Promise.all([
    getTelegramStats(community.telegram),
    getDiscordStats(community.discord),
    getGithubStats(community.github),
    getXStats(community.x),
  ]);

  return {
    ...community,
    telegram: telegramStats,
    discord: discordStats,
    github: githubStats,
    x: xStats,
  };
}

module.exports = {
  getCommunityById,
  getCommunityByName,
  getAllCommunities,
  getTelegramStats,
  getDiscordStats,
  getGithubStats,
  getXStats,
  getAllCommunityData,
};
