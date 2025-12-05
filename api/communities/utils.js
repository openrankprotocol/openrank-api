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
          'creator_id', xc.creator_id
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

async function getTrankStats(communityId) {
  // Get linked Telegram channels
  const channels = await getTrankReferences(communityId);
  if (channels.length === 0)
    return {
      member_count: 0,
      active_member_count: 0,
      contributors: [],
    };

  const channelIds = channels.map((c) => c.channel_id);

  // 1. Total Member Count
  const membersRes = await db.query(
    `SELECT COUNT(DISTINCT user_id) as count 
     FROM trank.channel_users 
     WHERE channel_id = ANY($1)`,
    [channelIds],
  );
  const member_count = parseInt(membersRes.rows[0].count || 0);

  // 2. Active Member Count (Last 30 days)
  // Union of users who sent messages AND users who reacted
  const activeRes = await db.query(
    `
    WITH active_users AS (
      SELECT from_id as user_id 
      FROM trank.messages 
      WHERE channel_id = ANY($1) 
      AND date > NOW() - INTERVAL '30 days'
      
      UNION
      
      SELECT user_id 
      FROM trank.message_reactions 
      WHERE channel_id = ANY($1) 
      AND date > NOW() - INTERVAL '30 days'
    )
    SELECT COUNT(DISTINCT user_id) as count FROM active_users
    `,
    [channelIds],
  );
  const active_member_count = parseInt(activeRes.rows[0].count || 0);

  // 3. Top Contributors (from latest run of each channel)
  const contributors = [];
  for (const channelId of channelIds) {
    // Get latest run for this channel
    const runRes = await db.query(
      "SELECT run_id FROM trank.runs WHERE channel_id = $1 ORDER BY created_at DESC LIMIT 1",
      [channelId],
    );
    if (runRes.rows.length === 0) continue;
    const runId = runRes.rows[0].run_id;

    // Get top scores
    const scoresRes = await db.query(
      `SELECT s.user_id, s.value as score,
              COALESCE(cu.username, 'user_' || s.user_id) as username, -- Fallback if username missing
              cu.first_name
       FROM trank.scores s
       LEFT JOIN trank.channel_users cu ON s.user_id = cu.user_id AND cu.channel_id = s.channel_id
       WHERE s.channel_id = $1 AND s.run_id = $2
       ORDER BY s.value DESC
       LIMIT 5`,
      [channelId, runId],
    );
    
    contributors.push(...scoresRes.rows.map(r => ({
      platform: 'telegram',
      id: r.user_id.toString(),
      name: r.username || r.first_name || `User ${r.user_id}`,
      score: r.score
    })));
  }

  return { member_count, active_member_count, contributors };
}

async function getXrankStats(communityId) {
  // Get linked X communities
  const communities = await getXrankReferences(communityId);
  if (communities.length === 0)
    return {
      member_count: 0,
      active_member_count: 0,
      contributors: [],
    };

  const communityIds = communities.map((c) => c.community_id);

  // 1. Total Member Count
  const membersRes = await db.query(
    `SELECT COUNT(DISTINCT user_id) as count 
     FROM xrank.community_members 
     WHERE community_id = ANY($1)`,
    [communityIds],
  );
  const member_count = parseInt(membersRes.rows[0].count || 0);

  // 2. Active Member Count (Last 30 days)
  const activeRes = await db.query(
    `SELECT COUNT(DISTINCT author_user_id) as count 
     FROM xrank.interactions 
     WHERE community_id = ANY($1) 
     AND created_at > NOW() - INTERVAL '30 days'`,
    [communityIds],
  );
  const active_member_count = parseInt(activeRes.rows[0].count || 0);

  // 3. Top Contributors
  const contributors = [];
  for (const cId of communityIds) {
    // Get latest run
    const runRes = await db.query(
      "SELECT run_id FROM xrank.runs WHERE community_id = $1 ORDER BY created_at DESC LIMIT 1",
      [cId],
    );
    if (runRes.rows.length === 0) continue;
    const runId = runRes.rows[0].run_id;

    // Get top scores
    const scoresRes = await db.query(
       `SELECT s.user_id, s.score, u.username
        FROM xrank.scores s
        JOIN xrank.users u ON s.user_id = u.user_id
        WHERE s.community_id = $1 AND s.run_id = $2
        ORDER BY s.score DESC
        LIMIT 5`,
      [cId, runId],
    );

    contributors.push(...scoresRes.rows.map(r => ({
      platform: 'twitter', // consistently use 'twitter' or 'x', UI often uses 'twitter'
      id: r.user_id.toString(),
      name: r.username,
      score: r.score
    })));
  }

  return { member_count, active_member_count, contributors };
}

async function getAllCommunityData(communityId) {
  const community = await getCommunityById(communityId);
  if (!community) return null;

  const trank_refs = await getTrankReferences(communityId);
  const xrank_refs = await getXrankReferences(communityId);

  // Fetch stats in parallel
  const [trankStats, xrankStats] = await Promise.all([
    getTrankStats(communityId),
    getXrankStats(communityId)
  ]);



  // Aggregate stats
  const total_active_members = trankStats.active_member_count + xrankStats.active_member_count;
  
  // Platform breakdown (hardcoded capacities for now as per design mockups or just return current/max if we had max)
  // The design shows "12,453 / 150K". We don't have "max" capacity in DB, so we'll just return the counts.
  const platform_stats = {
    telegram: {
      member_count: trankStats.member_count,
      active_member_count: trankStats.active_member_count,
    },
    twitter: {
      member_count: xrankStats.member_count,
      active_member_count: xrankStats.active_member_count,
    }
  };

  // Merge and sort contributors
  const top_contributors = [...trankStats.contributors, ...xrankStats.contributors]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10); // Top 10 overall

  return {
    ...community,
    trank_refs,
    xrank_refs,
    stats: {
      total_active_members,
      platform_stats,
      top_contributors
    }
  };
}

module.exports = {
  getCommunityById,
  getAllCommunities,
  getTrankReferences,
  getXrankReferences,
  getAllCommunityData,
};
