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

module.exports = {
  getCommunityById,
  getAllCommunities,
};
