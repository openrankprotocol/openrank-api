const db = require("../../lib/db");

async function validateChannelId(id) {
  // Validate numeric format using regex to avoid partial parsing
  if (!/^\d+$/.test(id)) {
    return {
      valid: false,
      error: "Channel ID must be a valid number",
    };
  }

  // Check existence in database
  const res = await db.query(
    "SELECT 1 FROM trank.channels WHERE channel_id = $1",
    [id],
  );

  if (res.rows.length === 0) {
    return {
      valid: false,
      error: "Channel not found",
    };
  }

  return {
    valid: true,
    channelId: id,
  };
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
    WITH log_scale AS (
      SELECT
        log(min(value)) AS scale_offset,
        log(max(value)) - log(min(value)) AS scale_range
      FROM trank.scores
      WHERE channel_id = $1 AND run_id = $2 AND value > 0
    )
    SELECT 
      sc.user_id as id, 
      (log(sc.value) - l.scale_offset) / l.scale_range as score 
    FROM trank.scores sc, log_scale l
    WHERE sc.channel_id = $1 AND sc.run_id = $2 AND sc.value > 0
    ORDER BY score DESC
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
    `WITH log_scale AS (
      SELECT
        log(min(value)) AS scale_offset,
        log(max(value)) - log(min(value)) AS scale_range
      FROM trank.scores
      WHERE channel_id = $1 AND run_id = $2 AND value > 0
    )
    SELECT 
      sc.user_id as id, 
      (log(sc.value) - l.scale_offset) / l.scale_range as score 
    FROM trank.scores sc, log_scale l
    WHERE sc.channel_id = $1 AND sc.run_id = $2 AND sc.value > 0
    ORDER BY score DESC`,
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
  validateChannelId,
  getLatestRunId,
  getSeeds,
  getScores,
  getAllData,
};
