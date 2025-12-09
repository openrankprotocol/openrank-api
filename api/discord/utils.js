const db = require("../../lib/db");

async function validateServerId(id) {
  // Validate numeric format using regex to avoid partial parsing
  if (!/^\d+$/.test(id)) {
    return {
      valid: false,
      error: "Server ID must be a valid number",
    };
  }

  // Check existence in database
  const res = await db.query(
    "SELECT 1 FROM socialrank.servers WHERE id = $1",
    [id],
  );

  if (res.rows.length === 0) {
    return {
      valid: false,
      error: "Server not found",
    };
  }

  return {
    valid: true,
    serverId: id,
  };
}

async function getLatestRunId(serverId) {
  const res = await db.query(
    "SELECT run_id FROM socialrank.runs WHERE server_id = $1 ORDER BY created_at DESC LIMIT 1",
    [serverId],
  );
  return res.rows.length > 0 ? res.rows[0].run_id : null;
}

async function getSeeds(serverId, runId) {
  const res = await db.query(
    `SELECT user_id, score
     FROM socialrank.seeds
     WHERE server_id = $1 AND run_id = $2
     ORDER BY score DESC NULLS LAST`,
    [serverId, runId],
  );
  // Return trank format: {id, score}
  return res.rows.map((row) => ({
    id: row.user_id.toString(),
    score: row.score,
  }));
}

async function getScores(serverId, runId, start = 0, size = null) {
  // Count total scores
  const countRes = await db.query(
    "SELECT COUNT(*) FROM socialrank.scores WHERE server_id = $1 AND run_id = $2",
    [serverId, runId],
  );
  const total = parseInt(countRes.rows[0].count);

  if (start >= total) {
    return {
      scores: [],
      pagination: { start, size: 0, total },
    };
  }

  // Fetch paginated scores with log-scaling transformation
  let query = `
    WITH log_scale AS (
      SELECT
        log(min(value)) AS scale_offset,
        log(max(value)) - log(min(value)) AS scale_range
      FROM socialrank.scores
      WHERE server_id = $1 AND run_id = $2 AND value > 0
    )
    SELECT
      sc.user_id as id,
      (log(sc.value) - l.scale_offset) / l.scale_range as score
    FROM socialrank.scores sc, log_scale l
    WHERE sc.server_id = $1 AND sc.run_id = $2 AND sc.value > 0
    ORDER BY score DESC
  `;
  const queryParams = [serverId, runId];

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

async function getAllData(serverId, runId) {
  const seed = await getSeeds(serverId, runId);
  const scoresRes = await db.query(
    `WITH log_scale AS (
      SELECT
        log(min(value)) AS scale_offset,
        log(max(value)) - log(min(value)) AS scale_range
      FROM socialrank.scores
      WHERE server_id = $1 AND run_id = $2 AND value > 0
    )
    SELECT
      sc.user_id as id,
      (log(sc.value) - l.scale_offset) / l.scale_range as score
    FROM socialrank.scores sc, log_scale l
    WHERE sc.server_id = $1 AND sc.run_id = $2 AND sc.value > 0
    ORDER BY score DESC`,
    [serverId, runId],
  );
  const scores = scoresRes.rows;

  return {
    server_id: serverId,
    seed,
    scores,
  };
}

module.exports = {
  validateServerId,
  getLatestRunId,
  getSeeds,
  getScores,
  getAllData,
};
