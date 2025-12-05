const db = require("../../lib/db");

async function getCommunityById(id) {
  const res = await db.query(
    "SELECT id, name, display_picture, created_at, updated_at FROM openrank.communities WHERE id = $1",
    [id],
  );
  return res.rows.length > 0 ? res.rows[0] : null;
}

async function getAllCommunities() {
  const res = await db.query(`
    SELECT
      c.id,
      c.name,
      c.display_picture,
      c.created_at,
      c.updated_at,
      COALESCE(
        json_agg(DISTINCT jsonb_build_object(
          'channel_id', tc.channel_id,
          'name', tc.name,
          'username', tc.username,
          'is_group', tc.is_group,
          'description', tc.description,
          'member_count', tc.member_count,
          'created_at', tc.created_at,
          'updated_at', tc.updated_at
        )) FILTER (WHERE tc.channel_id IS NOT NULL),
        '[]'
      ) as trank_refs,
      COALESCE(
        json_agg(DISTINCT jsonb_build_object(
          'community_id', xc.community_id,
          'name', xc.name,
          'description', xc.description,
          'created_at', xc.created_at,
          'imported_at', xc.imported_at,
          'updated_at', xc.updated_at,
          'creator_username', xc.creator_username
        )) FILTER (WHERE xc.community_id IS NOT NULL),
        '[]'
      ) as xrank_refs
    FROM openrank.communities c
    LEFT JOIN openrank.communities_trank_refs ct ON c.id = ct.openrank_id
    LEFT JOIN trank.channels tc ON ct.trank_channel_id = tc.channel_id
    LEFT JOIN openrank.communities_xrank_refs cx ON c.id = cx.openrank_id
    LEFT JOIN xrank.communities xc ON cx.x_community_id = xc.community_id
    GROUP BY c.id, c.name, c.display_picture, c.created_at, c.updated_at
    ORDER BY c.name
  `);
  return res.rows;
}

async function getTrankReferences(communityId) {
  const res = await db.query(
    `SELECT tc.*
     FROM openrank.communities_trank_refs ct
     JOIN trank.channels tc ON ct.trank_channel_id = tc.channel_id
     WHERE ct.openrank_id = $1
     ORDER BY tc.channel_id`,
    [communityId],
  );
  return res.rows;
}

async function getXrankReferences(communityId) {
  const res = await db.query(
    `SELECT xc.*
     FROM openrank.communities_xrank_refs cx
     JOIN xrank.communities xc ON cx.x_community_id = xc.community_id
     WHERE cx.openrank_id = $1
     ORDER BY xc.community_id`,
    [communityId],
  );
  return res.rows;
}

async function getAllCommunityData(communityId) {
  const community = await getCommunityById(communityId);
  if (!community) return null;

  const trank_refs = await getTrankReferences(communityId);
  const xrank_refs = await getXrankReferences(communityId);

  return {
    ...community,
    trank_refs,
    xrank_refs,
  };
}

module.exports = {
  getCommunityById,
  getAllCommunities,
  getTrankReferences,
  getXrankReferences,
  getAllCommunityData,
};
