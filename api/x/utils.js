const db = require("../../lib/db");

async function validateCommunityId(id) {
  // Validate numeric format using regex to avoid partial parsing
  if (!/^\d+$/.test(id)) {
    return {
      valid: false,
      error: "Community ID must be a valid number",
    };
  }
  // Check existence in database
  const res = await db.query(
    "SELECT 1 FROM xrank.communities WHERE community_id = $1",
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
    "SELECT run_id FROM xrank.runs WHERE community_id = $1 ORDER BY created_at DESC LIMIT 1",
    [communityId],
  );
  return res.rows.length > 0 ? res.rows[0].run_id : null;
}

async function getSeeds(communityId, runId) {
  const res = await db.query(
    `SELECT s.user_id, u.username, s.score
     FROM xrank.seeds s
     JOIN xrank.users u ON s.user_id = u.user_id
     WHERE s.community_id = $1 AND s.run_id = $2
     ORDER BY s.score DESC`,
    [communityId, runId],
  );
  return res.rows.map((row) => ({ i: row.username, v: row.score }));
}

async function getScores(communityId, runId, start = 0, size = null) {
  // Count total scores
  const countRes = await db.query(
    "SELECT COUNT(*) FROM xrank.scores WHERE community_id = $1 AND run_id = $2",
    [communityId, runId],
  );
  const total = parseInt(countRes.rows[0].count);

  if (start >= total) {
    return {
      scores: [],
      pagination: { start, size: 0, total },
    };
  }

  // Fetch paginated scores with usernames
  let query = `
    SELECT u.username as i, sc.score as v
    FROM xrank.scores sc
    JOIN xrank.users u ON sc.user_id = u.user_id
    WHERE sc.community_id = $1 AND sc.run_id = $2
    ORDER BY sc.score DESC
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
    `SELECT u.username as i, sc.score as v
     FROM xrank.scores sc
     JOIN xrank.users u ON sc.user_id = u.user_id
     WHERE sc.community_id = $1 AND sc.run_id = $2
     ORDER BY sc.score DESC`,
    [communityId, runId],
  );
  const scores = scoresRes.rows;

  return {
    category: "xrank",
    community_id: communityId.toString(),
    seed,
    scores,
  };
}

module.exports = {
  validateCommunityId,
  getLatestRunId,
  getSeeds,
  getScores,
  getAllData,
};
