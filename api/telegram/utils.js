const db = require("../../lib/db");

async function getChannelId(username) {
  const res = await db.query(
    "SELECT channel_id FROM trank.channels WHERE username = $1",
    [username],
  );
  return res.rows.length > 0 ? res.rows[0].channel_id : null;
}

async function getLatestRunId(channelId) {
  const res = await db.query(
    "SELECT run_id FROM trank.runs WHERE channel_id = $1 ORDER BY created_at DESC LIMIT 1",
    [channelId],
  );
  return res.rows.length > 0 ? res.rows[0].run_id : null;
}

async function getSeeds(channelId, runId) {
  const res = await db.query(
    "SELECT user_id FROM trank.seeds WHERE channel_id = $1 AND run_id = $2",
    [channelId, runId],
  );
  return res.rows.map((row) => row.user_id);
}

async function getScores(channelId, runId, start = 0, size = null) {
  // Count total scores
  const countRes = await db.query(
    "SELECT COUNT(*) FROM trank.scores WHERE channel_id = $1 AND run_id = $2",
    [channelId, runId],
  );
  const total = parseInt(countRes.rows[0].count);

  if (start >= total) {
    return {
      scores: [],
      pagination: { start, size: 0, total },
    };
  }

  // Fetch paginated scores
  let query = `
    SELECT user_id as id, value as score 
    FROM trank.scores 
    WHERE channel_id = $1 AND run_id = $2 
    ORDER BY value DESC
  `;
  const queryParams = [channelId, runId];

  if (size !== null) {
    query += ` LIMIT $3 OFFSET $4`;
    queryParams.push(size, start);
  } else {
    query += ` OFFSET $3`;
    queryParams.push(start);
  }

  const scoresRes = await db.query(query, queryParams);
  const scores = scoresRes.rows;

  return {
    scores,
    pagination: {
      start,
      size: scores.length,
      total,
    },
  };
}

async function getAllData(channelId, runId) {
  const seed = await getSeeds(channelId, runId);
  const scoresRes = await db.query(
    "SELECT user_id as id, value as score FROM trank.scores WHERE channel_id = $1 AND run_id = $2 ORDER BY value DESC",
    [channelId, runId],
  );
  const scores = scoresRes.rows;

  return {
    channel_id: channelId,
    seed,
    scores,
  };
}

module.exports = {
  getChannelId,
  getLatestRunId,
  getSeeds,
  getScores,
  getAllData,
};
