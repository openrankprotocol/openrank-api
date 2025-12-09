const db = require("../../lib/db");

async function validateCommunityId(id) {
  // community_id is text, just check it exists in the database
  const res = await db.query(
    "SELECT 1 FROM devrank.runs WHERE community_id = $1 LIMIT 1",
    [id],
  );

  if (res.rows.length === 0) {
    return {
      valid: false,
      error: "Community not found",
    };
  }

  return {
    valid: true,
    communityId: id,
  };
}

async function getLatestRunId(communityId) {
  const res = await db.query(
    "SELECT run_id FROM devrank.runs WHERE community_id = $1 ORDER BY created_at DESC LIMIT 1",
    [communityId],
  );
  return res.rows.length > 0 ? res.rows[0].run_id : null;
}

async function getSeeds(communityId, runId) {
  const res = await db.query(
    `SELECT user_id, value
     FROM devrank.seeds
     WHERE community_id = $1 AND run_id = $2
     ORDER BY value DESC`,
    [communityId, runId],
  );
  return res.rows.map((row) => ({ i: row.user_id, v: row.value }));
}

async function getScores(communityId, runId, start = 0, size = null) {
  // Count total scores
  const countRes = await db.query(
    "SELECT COUNT(*) FROM devrank.scores WHERE community_id = $1 AND run_id = $2 AND user_id NOT LIKE '%/%'",
    [communityId, runId],
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
      FROM devrank.scores
      WHERE community_id = $1 AND run_id = $2 AND value > 0 AND user_id NOT LIKE '%/%'
    )
    SELECT
      sc.user_id as i,
      (log(sc.value) - l.scale_offset) / l.scale_range as v
    FROM devrank.scores sc, log_scale l
    WHERE sc.community_id = $1 AND sc.run_id = $2 AND sc.value > 0 AND sc.user_id NOT LIKE '%/%'
    ORDER BY v DESC
  `;
  const queryParams = [communityId, runId];

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

async function getAllData(communityId, runId) {
  const seed = await getSeeds(communityId, runId);
  const scoresRes = await db.query(
    `WITH log_scale AS (
      SELECT
        log(min(value)) AS scale_offset,
        log(max(value)) - log(min(value)) AS scale_range
      FROM devrank.scores
      WHERE community_id = $1 AND run_id = $2 AND value > 0 AND user_id NOT LIKE '%/%'
    )
    SELECT
      sc.user_id as i,
      (log(sc.value) - l.scale_offset) / l.scale_range as v
    FROM devrank.scores sc, log_scale l
    WHERE sc.community_id = $1 AND sc.run_id = $2 AND sc.value > 0 AND sc.user_id NOT LIKE '%/%'
    ORDER BY v DESC`,
    [communityId, runId],
  );
  const scores = scoresRes.rows;

  return {
    category: "devrank",
    community_id: communityId,
    seed,
    scores,
  };
}

async function listCommunities() {
  const res = await db.query(
    "SELECT DISTINCT community_id FROM devrank.runs ORDER BY community_id",
  );
  return res.rows.map((row) => row.community_id);
}

module.exports = {
  validateCommunityId,
  getLatestRunId,
  getSeeds,
  getScores,
  getAllData,
  listCommunities,
};
